import React, { useState, useEffect, useRef } from 'react';
import { useCurrentServerRequired, toast } from '@pterodactyl/sdk';

interface RemoteFileEntry {
    name: string;
    path: string;
    is_dir: boolean;
    size: number;
    modified: number;
}

interface ImportStatus {
    status: 'idle' | 'scanning' | 'transferring' | 'completed' | 'failed' | 'cancelled';
    progress_percent: number;
    files_total: number;
    files_transferred: number;
    bytes_total: number;
    bytes_transferred: number;
    current_file: string;
    speed_bytes_sec: number;
    source_host?: string;
    source_path?: string;
    target_path?: string;
    started_at?: number;
    updated_at?: number;
    logs: string[];
    error?: string | null;
}

const getCsrfToken = (): string => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') || '' : '';
};

function formatBytes(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
}

function formatSpeed(bytesPerSec: number): string {
    if (!bytesPerSec || bytesPerSec <= 0) return '0 KB/s';
    if (bytesPerSec >= 1048576) return (bytesPerSec / 1048576).toFixed(2) + ' MB/s';
    return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
}

export default function ServerImporterScreen() {
    const server = useCurrentServerRequired();
    const serverId = server?.attributes?.identifier || (server as any)?.identifier || '';

    // Step state: 1: Credentials, 2: Paths, 3: Options, 4: Progress
    const [step, setStep] = useState<number>(1);

    // Form data
    const [host, setHost] = useState('');
    const [port, setPort] = useState(2022);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Connection testing
    const [testingConnection, setTestingConnection] = useState(false);
    const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null);

    // Directory selection
    const [sourcePath, setSourcePath] = useState('/');
    const [targetPath, setTargetPath] = useState('/');
    const [remoteEntries, setRemoteEntries] = useState<RemoteFileEntry[]>([]);
    const [browsingRemote, setBrowsingRemote] = useState(false);
    const [browserLoading, setBrowserLoading] = useState(false);

    // Options
    const [wipeTarget, setWipeTarget] = useState(false);
    const [wipeConfirmed, setWipeConfirmed] = useState(false);
    const [overwrite, setOverwrite] = useState(true);
    const [excludeCommon, setExcludeCommon] = useState(true);
    const [customExclusions, setCustomExclusions] = useState('');

    // Transfer status
    const [importStatus, setImportStatus] = useState<ImportStatus>({
        status: 'idle',
        progress_percent: 0,
        files_total: 0,
        files_transferred: 0,
        bytes_total: 0,
        bytes_transferred: 0,
        current_file: '',
        speed_bytes_sec: 0,
        logs: [],
        error: null,
    });
    const [submittingImport, setSubmittingImport] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const terminalRef = useRef<HTMLDivElement>(null);

    // Multi-candidate API fetch to support both /extensions/server-importer and /server-importer routing
    const apiFetch = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
        const candidateUrls = [
            `/api/client/servers/${serverId}/extensions/server-importer/${endpoint}`,
            `/api/client/servers/${serverId}/server-importer/${endpoint}`,
        ];
        let lastRes: Response | null = null;
        for (const url of candidateUrls) {
            try {
                const res = await fetch(url, {
                    ...options,
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': getCsrfToken(),
                        ...(options.headers || {}),
                    },
                });
                if (res.status !== 404) {
                    return res;
                }
                lastRes = res;
            } catch (e) {
                // Try next candidate
            }
        }
        return lastRes || fetch(candidateUrls[0], options);
    };

    // Polling active status
    const pollStatus = async () => {
        if (!serverId) return;
        try {
            const res = await apiFetch('status');
            if (res.ok) {
                const data: ImportStatus = await res.json();
                setImportStatus(data);
                if (data.status === 'scanning' || data.status === 'transferring') {
                    setStep(4);
                }
            }
        } catch (e) {
            // Ignore background polling glitches
        }
    };

    useEffect(() => {
        pollStatus();
        const interval = setInterval(() => {
            if (importStatus.status === 'scanning' || importStatus.status === 'transferring' || step === 4) {
                pollStatus();
            }
        }, 1500);
        return () => clearInterval(interval);
    }, [serverId, importStatus.status, step]);

    // Auto-scroll terminal to bottom
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [importStatus.logs]);

    const handleHostChange = (raw: string) => {
        let clean = raw.trim();
        // Automatically extract from sftp://host:port or host:port
        if (clean.includes('://')) {
            clean = clean.split('://')[1];
        }
        clean = clean.split('/')[0];
        if (clean.includes(':')) {
            const parts = clean.split(':');
            setHost(parts[0]);
            const parsedPort = Number(parts[1]);
            if (parsedPort && !isNaN(parsedPort)) {
                setPort(parsedPort);
            }
        } else {
            setHost(clean);
        }
    };

    // Test remote connection
    const handleTestConnection = async () => {
        const sanitizedHost = host.replace(/^[a-zA-Z0-9]+:\/\//, '').split('/')[0].split(':')[0].trim();
        if (!sanitizedHost || !username || !password) {
            toast.error('Please enter Host, Username, and Password first.');
            return;
        }
        setTestingConnection(true);
        setConnectionResult(null);

        try {
            const res = await apiFetch('test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ host: sanitizedHost, port, username, password }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setConnectionResult({ success: true, message: data.message });
                toast.success('SFTP Connection verified successfully!');
            } else {
                setConnectionResult({ success: false, message: data.message || 'Connection failed' });
                toast.error(data.message || 'Failed to connect to SFTP');
            }
        } catch (err: any) {
            setConnectionResult({ success: false, message: err.message || 'Network error' });
            toast.error(err.message || 'Network error');
        } finally {
            setTestingConnection(false);
        }
    };

    // Browse remote directory
    const fetchRemoteDirectory = async (path: string) => {
        if (!host || !username || !password) return;
        const sanitizedHost = host.replace(/^[a-zA-Z0-9]+:\/\//, '').split('/')[0].split(':')[0].trim();
        setBrowserLoading(true);
        try {
            const res = await apiFetch('list-remote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ host: sanitizedHost, port, username, password, path }),
            });
            const data = await res.json();
            if (res.ok && data.entries) {
                setRemoteEntries(data.entries);
                setSourcePath(data.current_path || path);
                setBrowsingRemote(true);
            } else {
                toast.error(data.error || 'Failed to list remote directory');
            }
        } catch (err: any) {
            toast.error(err.message || 'Error exploring remote files');
        } finally {
            setBrowserLoading(false);
        }
    };

    // Start Import
    const handleStartImport = async () => {
        if (!host || !username || !password) {
            toast.error('Missing SFTP credentials.');
            setStep(1);
            return;
        }

        if (wipeTarget && !wipeConfirmed) {
            toast.error('Please confirm destination wiping before proceeding.');
            return;
        }

        const sanitizedHost = host.replace(/^[a-zA-Z0-9]+:\/\//, '').split('/')[0].split(':')[0].trim();
        setSubmittingImport(true);
        try {
            const res = await apiFetch('start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    host: sanitizedHost,
                    port,
                    username,
                    password,
                    source_path: sourcePath,
                    target_path: targetPath,
                    wipe_target: wipeTarget,
                    overwrite,
                    exclude_common: excludeCommon,
                    custom_exclusions: customExclusions,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                toast.success('Migration initiated!');
                setStep(4);
                if (data.status) {
                    setImportStatus(data.status);
                }
            } else {
                toast.error(data.message || 'Failed to start import.');
            }
        } catch (err: any) {
            toast.error(err.message || 'Connection error starting import.');
        } finally {
            setSubmittingImport(false);
        }
    };

    // Cancel import
    const handleCancelImport = async () => {
        if (!confirm('Are you sure you want to stop this migration transfer?')) return;
        setCancelling(true);
        try {
            const res = await apiFetch('cancel', { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                toast.info('Cancellation requested.');
                pollStatus();
            }
        } catch (e: any) {
            toast.error('Failed to cancel import.');
        } finally {
            setCancelling(false);
        }
    };

    const isRunning = importStatus.status === 'scanning' || importStatus.status === 'transferring';

    return (
        <div className="imp-container">
            {/* Header */}
            <div className="imp-header">
                <div className="imp-title-wrap">
                    <h1 className="imp-title">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            <line x1="12" y1="11" x2="12" y2="17"></line>
                            <polyline points="9 14 12 17 15 14"></polyline>
                        </svg>
                        Server File Importer
                    </h1>
                    <p className="imp-subtitle">
                        Seamlessly import worlds, plugins, mods, and complete server files from any external Pterodactyl panel via SFTP.
                    </p>
                </div>

                {isRunning && (
                    <span className="imp-btn imp-btn-primary !text-xs !py-1 !px-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block mr-1"></span>
                        Transfer Active ({importStatus.progress_percent}%)
                    </span>
                )}
            </div>

            {/* Stepper Navigation */}
            <div className="imp-stepper">
                <button
                    type="button"
                    className={`imp-step-item ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}
                    onClick={() => !isRunning && setStep(1)}
                >
                    <span className="imp-step-badge">1</span>
                    <span>SFTP Details</span>
                </button>

                <button
                    type="button"
                    className={`imp-step-item ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}
                    onClick={() => !isRunning && setStep(2)}
                >
                    <span className="imp-step-badge">2</span>
                    <span>Paths & Files</span>
                </button>

                <button
                    type="button"
                    className={`imp-step-item ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}
                    onClick={() => !isRunning && setStep(3)}
                >
                    <span className="imp-step-badge">3</span>
                    <span>Options</span>
                </button>

                <button
                    type="button"
                    className={`imp-step-item ${step === 4 ? 'active' : ''}`}
                    onClick={() => setStep(4)}
                >
                    <span className="imp-step-badge">4</span>
                    <span>Live Progress</span>
                </button>
            </div>

            {/* STEP 1: SFTP CREDENTIALS */}
            {step === 1 && (
                <div className="imp-card">
                    <h2 className="imp-card-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                            <line x1="6" y1="6" x2="6.01" y2="6"></line>
                            <line x1="6" y1="18" x2="6.01" y2="18"></line>
                        </svg>
                        Remote Pterodactyl SFTP Credentials
                    </h2>

                    <div className="imp-alert imp-alert-info">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span>
                            To find these credentials, log into the source Pterodactyl panel, open your server, and click <strong>Settings &rarr; SFTP Details</strong>.
                        </span>
                    </div>

                    <div className="imp-grid-2">
                        <div className="imp-field">
                            <label className="imp-label">SFTP Host / IP Address</label>
                            <input
                                type="text"
                                className="imp-input"
                                placeholder="sftp.example.com or 192.168.1.100"
                                value={host}
                                onChange={(e) => handleHostChange(e.target.value)}
                            />
                        </div>

                        <div className="imp-field">
                            <label className="imp-label">SFTP Port</label>
                            <input
                                type="number"
                                className="imp-input"
                                placeholder="2022"
                                value={port}
                                onChange={(e) => setPort(Number(e.target.value))}
                            />
                        </div>

                        <div className="imp-field">
                            <label className="imp-label">SFTP Username</label>
                            <input
                                type="text"
                                className="imp-input"
                                placeholder="e.g. username.8b2c4e1"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="imp-field">
                            <label className="imp-label">SFTP Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="imp-input"
                                    placeholder="Source account / SFTP password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ paddingRight: 40 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: 10,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {connectionResult && (
                        <div className={`imp-alert ${connectionResult.success ? 'imp-alert-success' : 'imp-alert-error'}`}>
                            <span>{connectionResult.message}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                        <button
                            type="button"
                            className="imp-btn imp-btn-secondary"
                            onClick={handleTestConnection}
                            disabled={testingConnection || !host || !username || !password}
                        >
                            {testingConnection ? 'Testing Connection...' : 'Test Connection'}
                        </button>

                        <button
                            type="button"
                            className="imp-btn imp-btn-primary"
                            onClick={() => setStep(2)}
                            disabled={!host || !username || !password}
                        >
                            Continue to Paths &rarr;
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 2: PATHS & FILE SELECTION */}
            {step === 2 && (
                <div className="imp-card">
                    <h2 className="imp-card-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Migration Directories & Selective Import
                    </h2>

                    <div className="imp-grid-2">
                        <div className="imp-field">
                            <label className="imp-label">Remote Source Path</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input
                                    type="text"
                                    className="imp-input"
                                    placeholder="/"
                                    value={sourcePath}
                                    onChange={(e) => setSourcePath(e.target.value)}
                                />
                                <button
                                    type="button"
                                    className="imp-btn imp-btn-secondary"
                                    onClick={() => fetchRemoteDirectory(sourcePath || '/')}
                                    disabled={browserLoading}
                                >
                                    {browserLoading ? 'Loading...' : 'Browse'}
                                </button>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Use <code>/</code> for entire server, or specific folder like <code>/plugins</code> or <code>/world</code>.
                            </span>
                        </div>

                        <div className="imp-field">
                            <label className="imp-label">Target Destination Path</label>
                            <input
                                type="text"
                                className="imp-input"
                                placeholder="/"
                                value={targetPath}
                                onChange={(e) => setTargetPath(e.target.value)}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Local server path where downloaded files will be placed. Usually <code>/</code>.
                            </span>
                        </div>
                    </div>

                    {/* Remote Directory Explorer View */}
                    {browsingRemote && (
                        <div style={{ marginTop: 16, border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12, background: 'rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f1f5f9' }}>
                                    Remote Directory: <code>{sourcePath}</code>
                                </span>
                                {sourcePath !== '/' && (
                                    <button
                                        type="button"
                                        className="imp-btn imp-btn-secondary !text-xs !py-1"
                                        onClick={() => {
                                            const parts = sourcePath.split('/').filter(Boolean);
                                            parts.pop();
                                            const parent = '/' + parts.join('/');
                                            fetchRemoteDirectory(parent || '/');
                                        }}
                                    >
                                        &uarr; Up One Level
                                    </button>
                                )}
                            </div>

                            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                                {remoteEntries.length === 0 ? (
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: 16 }}>
                                        No files found or directory is empty.
                                    </div>
                                ) : (
                                    remoteEntries.map((item, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '6px 10px',
                                                borderRadius: 6,
                                                background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                                                cursor: item.is_dir ? 'pointer' : 'default',
                                            }}
                                            onClick={() => {
                                                if (item.is_dir) {
                                                    fetchRemoteDirectory(item.path);
                                                }
                                            }}
                                        >
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', color: item.is_dir ? '#60a5fa' : '#cbd5e1' }}>
                                                {item.is_dir ? '📁' : '📄'} {item.name}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {item.is_dir ? 'Folder' : formatBytes(item.size)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                        <button type="button" className="imp-btn imp-btn-secondary" onClick={() => setStep(1)}>
                            &larr; Back
                        </button>
                        <button type="button" className="imp-btn imp-btn-primary" onClick={() => setStep(3)}>
                            Continue to Options &rarr;
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 3: MIGRATION OPTIONS */}
            {step === 3 && (
                <div className="imp-card">
                    <h2 className="imp-card-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="21" x2="4" y2="14"></line>
                            <line x1="4" y1="10" x2="4" y2="3"></line>
                            <line x1="12" y1="21" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12" y2="3"></line>
                            <line x1="20" y1="21" x2="20" y2="16"></line>
                            <line x1="20" y1="12" x2="20" y2="3"></line>
                            <line x1="1" y1="14" x2="7" y2="14"></line>
                            <line x1="9" y1="8" x2="15" y2="8"></line>
                            <line x1="17" y1="16" x2="23" y2="16"></line>
                        </svg>
                        Migration & Overwrite Settings
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {/* Overwrite existing */}
                        <label className="imp-checkbox-row">
                            <input
                                type="checkbox"
                                checked={overwrite}
                                onChange={(e) => setOverwrite(e.target.checked)}
                                style={{ marginTop: 4 }}
                            />
                            <div>
                                <div className="imp-checkbox-title">Overwrite Existing Files</div>
                                <div className="imp-checkbox-desc">
                                    Replace any files on this server if they already exist with the same name.
                                </div>
                            </div>
                        </label>

                        {/* Exclude common logs */}
                        <label className="imp-checkbox-row">
                            <input
                                type="checkbox"
                                checked={excludeCommon}
                                onChange={(e) => setExcludeCommon(e.target.checked)}
                                style={{ marginTop: 4 }}
                            />
                            <div>
                                <div className="imp-checkbox-title">Exclude Temporary & Log Files (Recommended)</div>
                                <div className="imp-checkbox-desc">
                                    Skips <code>*.log</code>, <code>crash-reports/</code>, <code>backups/</code>, <code>cache/</code>, and <code>session.lock</code> to optimize transfer speed and prevent file lock conflicts.
                                </div>
                            </div>
                        </label>

                        {/* Wipe target directory */}
                        <label className="imp-checkbox-row" style={{ borderColor: wipeTarget ? 'rgba(239, 68, 68, 0.4)' : undefined }}>
                            <input
                                type="checkbox"
                                checked={wipeTarget}
                                onChange={(e) => {
                                    setWipeTarget(e.target.checked);
                                    if (!e.target.checked) setWipeConfirmed(false);
                                }}
                                style={{ marginTop: 4 }}
                            />
                            <div>
                                <div className="imp-checkbox-title" style={{ color: wipeTarget ? '#f87171' : undefined }}>
                                    Wipe Destination Directory Before Import
                                </div>
                                <div className="imp-checkbox-desc">
                                    Deletes all existing files in target path (<code>{targetPath}</code>) prior to starting. Useful for clean full-server moves.
                                </div>
                            </div>
                        </label>

                        {wipeTarget && (
                            <div className="imp-alert imp-alert-warning" style={{ margin: 0 }}>
                                <input
                                    type="checkbox"
                                    checked={wipeConfirmed}
                                    onChange={(e) => setWipeConfirmed(e.target.checked)}
                                    id="wipeConfirmCheckbox"
                                />
                                <label htmlFor="wipeConfirmCheckbox" style={{ cursor: 'pointer' }}>
                                    I understand that existing files in <strong>{targetPath}</strong> will be permanently wiped.
                                </label>
                            </div>
                        )}

                        {/* Custom exclusions */}
                        <div className="imp-field" style={{ marginTop: 8 }}>
                            <label className="imp-label">Custom Exclusion Patterns (Optional)</label>
                            <input
                                type="text"
                                className="imp-input"
                                placeholder="e.g. *.tar.gz, dynmap/*, coreprotect/*"
                                value={customExclusions}
                                onChange={(e) => setCustomExclusions(e.target.value)}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Comma-separated list of file or directory patterns to exclude from migration.
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                        <button type="button" className="imp-btn imp-btn-secondary" onClick={() => setStep(2)}>
                            &larr; Back
                        </button>
                        <button
                            type="button"
                            className="imp-btn imp-btn-primary"
                            onClick={handleStartImport}
                            disabled={submittingImport || (wipeTarget && !wipeConfirmed)}
                        >
                            {submittingImport ? 'Starting Migration...' : 'Start Server Migration 🚀'}
                        </button>
                    </div>
                </div>
            )}

            {/* STEP 4: LIVE MONITOR & LOGS */}
            {step === 4 && (
                <div className="imp-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <h2 className="imp-card-title" style={{ margin: 0 }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            Migration Pipeline Status: &nbsp;
                            <span style={{
                                textTransform: 'uppercase',
                                color: importStatus.status === 'completed' ? '#34d399' : (importStatus.status === 'failed' ? '#f87171' : '#60a5fa')
                            }}>
                                {importStatus.status}
                            </span>
                        </h2>

                        <div>
                            {isRunning ? (
                                <button
                                    type="button"
                                    className="imp-btn imp-btn-danger !text-xs !py-1 !px-3"
                                    onClick={handleCancelImport}
                                    disabled={cancelling}
                                >
                                    {cancelling ? 'Cancelling...' : 'Cancel Transfer'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="imp-btn imp-btn-primary !text-xs !py-1 !px-3"
                                    onClick={() => setStep(1)}
                                >
                                    Start New Migration &rarr;
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Notice for failed or cancelled transfers */}
                    {(importStatus.status === 'failed' || importStatus.status === 'cancelled') && (
                        <div className="imp-alert imp-alert-warning" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong>{importStatus.status === 'failed' ? 'Import Failed:' : 'Transfer Stopped:'}</strong> {importStatus.error || (importStatus.status === 'failed' ? 'An unexpected error occurred during transfer.' : 'Import was stopped by user.')}
                            </div>
                            <button
                                type="button"
                                className="imp-btn imp-btn-primary !text-xs !py-1 !px-3"
                                onClick={() => setStep(1)}
                            >
                                Try Again &rarr;
                            </button>
                        </div>
                    )}

                    {/* Progress Bar */}
                    <div className="imp-progress-track">
                        <div
                            className={`imp-progress-fill ${importStatus.status === 'scanning' ? 'scanning' : ''}`}
                            style={{
                                width: importStatus.status === 'scanning' ? undefined : `${Math.min(100, importStatus.progress_percent || 0)}%`
                            }}
                        ></div>
                    </div>

                    {/* Statistics Metrics Grid */}
                    <div className="imp-metrics-grid">
                        <div className="imp-metric-card">
                            <span className="imp-metric-val">{importStatus.status === 'scanning' ? 'Indexing...' : `${importStatus.progress_percent}%`}</span>
                            <span className="imp-metric-lbl">Total Progress</span>
                        </div>

                        <div className="imp-metric-card">
                            <span className="imp-metric-val">
                                {importStatus.status === 'scanning'
                                    ? `${importStatus.files_total} Found`
                                    : `${importStatus.files_transferred} / ${importStatus.files_total}`}
                            </span>
                            <span className="imp-metric-lbl">
                                {importStatus.status === 'scanning' ? 'Files Discovered' : 'Files Processed'}
                            </span>
                        </div>

                        <div className="imp-metric-card">
                            <span className="imp-metric-val">
                                {formatBytes(importStatus.bytes_transferred)} / {formatBytes(importStatus.bytes_total)}
                            </span>
                            <span className="imp-metric-lbl">Data Volume</span>
                        </div>

                        <div className="imp-metric-card">
                            <span className="imp-metric-val">
                                {formatSpeed(importStatus.speed_bytes_sec)}
                            </span>
                            <span className="imp-metric-lbl">Transfer Rate</span>
                        </div>
                    </div>

                    {/* Current File Banner */}
                    <div style={{
                        padding: '8px 12px',
                        background: 'rgba(15, 23, 42, 0.6)',
                        borderRadius: 6,
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.75rem',
                        color: '#94a3b8',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis'
                    }}>
                        <strong style={{ color: '#cbd5e1' }}>Current Operation:</strong>
                        <span style={{ fontFamily: 'monospace', color: '#60a5fa', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {importStatus.current_file || 'Idle'}
                        </span>
                    </div>

                    {/* Terminal Console */}
                    <div className="imp-terminal" ref={terminalRef}>
                        {importStatus.logs && importStatus.logs.length > 0 ? (
                            importStatus.logs.map((log, index) => {
                                const isErr = log.includes('ERROR') || log.includes('Failed');
                                const isSucc = log.includes('successfully') || log.includes('completed');
                                const isWarn = log.includes('Warning') || log.includes('Excluded');
                                return (
                                    <div
                                        key={index}
                                        className={`imp-terminal-line ${isErr ? 'error' : (isSucc ? 'success' : (isWarn ? 'warn' : ''))}`}
                                    >
                                        {log}
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ color: '#64748b' }}>Waiting for transfer stream output...</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
