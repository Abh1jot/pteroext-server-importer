import React, { useState, useEffect } from 'react';
import { useCurrentServerRequired } from '@pterodactyl/sdk';

interface StatusPayload {
    status: 'idle' | 'scanning' | 'transferring' | 'completed' | 'failed' | 'cancelled';
    progress_percent: number;
    files_total: number;
    files_transferred: number;
    bytes_total: number;
    bytes_transferred: number;
    current_file: string;
    speed_bytes_sec: number;
    eta_seconds?: number | null;
}

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

function formatEta(seconds?: number | null): string {
    if (seconds === undefined || seconds === null || seconds < 0) return '--:--';
    if (seconds < 5) return 'A few seconds left';
    if (seconds < 60) return `${seconds}s remaining`;
    const mins = Math.floor(seconds / 60);
    const remSecs = seconds % 60;
    if (mins < 60) {
        return `${mins}m ${remSecs < 10 ? '0' : ''}${remSecs}s remaining`;
    }
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hours}h ${remMins}m remaining`;
}

export default function ServerImportLockdown() {
    const server = useCurrentServerRequired();
    const serverId = server?.attributes?.identifier || (server as any)?.identifier || '';

    const [status, setStatus] = useState<StatusPayload | null>(null);

    const isImportPage = () => {
        const path = window.location.pathname.toLowerCase();
        return path.endsWith('/import') || path.includes('/import/') || path.includes('/server-importer');
    };

    useEffect(() => {
        if (!serverId) return;

        let isMounted = true;

        const checkStatus = async () => {
            try {
                const candidates = [
                    `/api/client/servers/${serverId}/extensions/server-importer/status`,
                    `/api/client/servers/${serverId}/server-importer/status`,
                ];

                for (const url of candidates) {
                    try {
                        const res = await fetch(url, {
                            headers: { 'Accept': 'application/json' },
                        });
                        if (res.ok) {
                            const data: StatusPayload = await res.json();
                            if (isMounted) {
                                setStatus(data);
                                // If actively importing and user is on another server tab, automatically redirect to importer
                                if ((data.status === 'scanning' || data.status === 'transferring') && !isImportPage()) {
                                    window.location.href = `/server/${serverId}/import`;
                                }
                            }
                            break;
                        }
                    } catch (e) {
                        // try next candidate
                    }
                }
            } catch (err) {
                // Ignore silent background polling
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 3000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [serverId]);

    // Only render lockdown screen if an import is running AND the user somehow stays on another tab
    const isRunning = status && (status.status === 'scanning' || status.status === 'transferring');
    if (!isRunning || isImportPage()) {
        return null;
    }

    const etaText = formatEta(status.eta_seconds);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            backgroundColor: 'rgba(9, 13, 22, 0.95)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}>
            <div style={{
                maxWidth: 540,
                width: '100%',
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: 28,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                color: '#f8fafc',
            }}>
                {/* Header Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 10px',
                        backgroundColor: 'rgba(59, 130, 246, 0.12)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: 9999,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#60a5fa',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}>
                        <span style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: '#3b82f6',
                            display: 'inline-block',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        }}></span>
                        {status.status === 'scanning' ? 'Scanning Remote Files' : 'Import In Progress'}
                    </div>

                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                        ID: {serverId}
                    </span>
                </div>

                {/* Title & Warning */}
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 8px', color: '#ffffff' }}>
                    Server Operations Locked
                </h2>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 20px' }}>
                    Files are actively being imported to this server via SFTP. All console commands, power actions, and file edits are locked to prevent filesystem corruption.
                </p>

                {/* Progress Bar */}
                <div style={{
                    width: '100%',
                    height: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    borderRadius: 9999,
                    overflow: 'hidden',
                    marginBottom: 16,
                }}>
                    <div style={{
                        height: '100%',
                        width: status.status === 'scanning' ? '40%' : `${Math.min(100, status.progress_percent || 0)}%`,
                        backgroundColor: '#3b82f6',
                        borderRadius: 9999,
                        transition: 'width 0.3s ease',
                    }}></div>
                </div>

                {/* Metrics Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 10,
                    marginBottom: 20,
                }}>
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 8,
                        padding: '10px 12px',
                    }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Files</div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#f1f5f9' }}>
                            {status.files_transferred} / {status.files_total}
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 8,
                        padding: '10px 12px',
                    }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Volume</div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#f1f5f9' }}>
                            {formatBytes(status.bytes_transferred)} / {formatBytes(status.bytes_total)}
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 8,
                        padding: '10px 12px',
                    }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Speed</div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#f1f5f9' }}>
                            {formatSpeed(status.speed_bytes_sec)}
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: 8,
                        padding: '10px 12px',
                    }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Estimated Time</div>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#60a5fa' }}>
                            {status.status === 'scanning' ? 'Calculating...' : etaText}
                        </div>
                    </div>
                </div>

                {/* Primary Action Button */}
                <a
                    href={`/server/${serverId}/import`}
                    style={{
                        display: 'block',
                        textAlign: 'center',
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        padding: '10px 16px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                >
                    View Import Screen &rarr;
                </a>
            </div>
        </div>
    );
}
