<?php

declare(strict_types=1);

namespace ServerImporter\Services;

use Pterodactyl\Models\Server;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

if (!defined('NET_SFTP_QUEUE_SIZE')) {
    define('NET_SFTP_QUEUE_SIZE', 256);
}

class SftpImporterService
{
    /**
     * Get local status file path for a given server.
     */
    protected function getStatusFilePath(Server $server): string
    {
        $dir = storage_path('framework/cache');
        if (!File::isDirectory($dir)) {
            File::makeDirectory($dir, 0755, true, true);
        }
        return $dir . '/sftp_import_' . $server->uuid . '.json';
    }

    /**
     * Sanitize and normalize remote host and port.
     */
    public function normalizeHostAndPort(string $rawHost, int $rawPort = 2022): array
    {
        $host = trim($rawHost);
        $port = $rawPort > 0 ? $rawPort : 2022;

        // Strip URI schemes like sftp://, ssh://, tcp://, ftp://
        $host = preg_replace('#^[a-zA-Z0-9\+\.\-]+://#', '', $host);

        // Strip any trailing paths or slashes, e.g. host.com/path
        $host = explode('/', $host)[0];

        // Check if port is in host string, e.g. host.com:2022 or [::1]:2022
        if (preg_match('/^\[(.*?)\](?::(\d+))?$/', $host, $matches)) {
            // IPv6
            $host = $matches[1];
            if (!empty($matches[2])) {
                $port = (int)$matches[2];
            }
        } elseif (substr_count($host, ':') === 1) {
            // IPv4 or hostname with port
            [$h, $p] = explode(':', $host, 2);
            $host = $h;
            if (is_numeric($p) && (int)$p > 0) {
                $port = (int)$p;
            }
        }

        return [$host, $port];
    }

    /**
     * Test connection to a remote SFTP server.
     */
    public function testConnection(string $host, int $port, string $username, string $password): array
    {
        [$host, $port] = $this->normalizeHostAndPort($host, $port);

        if (empty($host) || empty($username) || empty($password)) {
            return ['success' => false, 'message' => 'Host, username, and password are required.'];
        }

        // 1. Socket reachability check using TCP transport
        $socket = @fsockopen("tcp://{$host}", $port, $errno, $errstr, 6.0);
        if (!$socket) {
            $socket = @fsockopen($host, $port, $errno, $errstr, 6.0);
        }

        if (!$socket) {
            return [
                'success' => false,
                'message' => "Could not reach SFTP host {$host}:{$port}. Error: {$errstr} (Code {$errno}). Check hostname and port.",
            ];
        }
        fclose($socket);

        // 2. SFTP authentication check with phpseclib3 (if present in Pterodactyl vendor)
        if (class_exists(\phpseclib3\Net\SFTP::class)) {
            try {
                $sftp = new \phpseclib3\Net\SFTP($host, $port, 10);
                if (!$sftp->login($username, $password)) {
                    return [
                        'success' => false,
                        'message' => 'SFTP Authentication failed. Verify that your username and password are correct.',
                    ];
                }
                return [
                    'success' => true,
                    'message' => "Successfully connected and authenticated to {$host}:{$port} as {$username}!",
                ];
            } catch (\Throwable $e) {
                return [
                    'success' => false,
                    'message' => 'SFTP login error: ' . $e->getMessage(),
                ];
            }
        }

        // 3. Fallback to ext-ssh2
        if (function_exists('ssh2_connect')) {
            try {
                $conn = @ssh2_connect($host, $port, ['timeout' => 10]);
                if (!$conn) {
                    return ['success' => false, 'message' => "Unable to establish SSH connection to {$host}:{$port}."];
                }
                if (!@ssh2_auth_password($conn, $username, $password)) {
                    return ['success' => false, 'message' => 'SFTP Authentication failed. Verify your username and password.'];
                }
                return ['success' => true, 'message' => "Successfully connected and authenticated to {$host}:{$port}!"];
            } catch (\Throwable $e) {
                return ['success' => false, 'message' => 'SSH2 error: ' . $e->getMessage()];
            }
        }

        // 4. Fallback: Socket reached successfully
        return [
            'success' => true,
            'message' => "SFTP server at {$host}:{$port} is online and accepting connections.",
        ];
    }

    /**
     * List files and directories in remote path.
     */
    public function listRemote(string $host, int $port, string $username, string $password, string $remotePath = '/'): array
    {
        [$host, $port] = $this->normalizeHostAndPort($host, $port);
        $remotePath = '/' . ltrim($remotePath, '/');

        if (class_exists(\phpseclib3\Net\SFTP::class)) {
            try {
                $sftp = new \phpseclib3\Net\SFTP($host, $port, 12);
                if (!$sftp->login($username, $password)) {
                    throw new \RuntimeException('Authentication failed for remote SFTP.');
                }

                $rawList = $sftp->rawlist($remotePath);
                if ($rawList === false) {
                    $rawList = $sftp->nlist($remotePath);
                }

                $entries = [];
                if (is_array($rawList)) {
                    foreach ($rawList as $name => $info) {
                        if ($name === '.' || $name === '..') continue;
                        $isDir = false;
                        $size = 0;
                        $modified = time();

                        if (is_array($info)) {
                            $type = $info['type'] ?? 0;
                            $isDir = ($type === 2 || ($info['mode'] ?? 0) & 0040000);
                            $size = $info['size'] ?? 0;
                            $modified = $info['mtime'] ?? time();
                        } else {
                            $name = is_string($info) ? $info : (string)$name;
                            $full = rtrim($remotePath, '/') . '/' . $name;
                            $isDir = $sftp->is_dir($full);
                            $size = $sftp->size($full) ?: 0;
                            $modified = $sftp->filemtime($full) ?: time();
                        }

                        $entries[] = [
                            'name' => $name,
                            'path' => rtrim($remotePath, '/') . '/' . $name,
                            'is_dir' => (bool) $isDir,
                            'size' => (int) $size,
                            'modified' => (int) $modified,
                        ];
                    }
                }

                // Sort: directories first, then alphabetically
                usort($entries, function ($a, $b) {
                    if ($a['is_dir'] !== $b['is_dir']) {
                        return $a['is_dir'] ? -1 : 1;
                    }
                    return strcasecmp($a['name'], $b['name']);
                });

                return [
                    'current_path' => $remotePath,
                    'entries' => $entries,
                ];
            } catch (\Throwable $e) {
                throw new \RuntimeException('Failed to list remote directory: ' . $e->getMessage());
            }
        }

        // Return empty list if SFTP library not installed
        return [
            'current_path' => $remotePath,
            'entries' => [],
            'notice' => 'Remote directory browsing requires phpseclib3. Full root import remains supported.',
        ];
    }

    /**
     * Start the import operation.
     */
    public function startImport(Server $server, array $params): array
    {
        $statusFile = $this->getStatusFilePath($server);

        // Check if an import is already running
        if (File::exists($statusFile)) {
            $existing = json_decode(File::get($statusFile), true);
            if (is_array($existing) && in_array($existing['status'] ?? '', ['scanning', 'transferring'])) {
                // If last update was under 60 seconds ago, consider it running
                if (time() - ($existing['updated_at'] ?? 0) < 60) {
                    return [
                        'success' => false,
                        'message' => 'An import job is already running on this server.',
                        'status' => $existing,
                    ];
                }
            }
        }

        [$host, $port] = $this->normalizeHostAndPort((string)($params['host'] ?? ''), (int)($params['port'] ?? 2022));
        $params['host'] = $host;
        $params['port'] = $port;
        $username = trim((string)($params['username'] ?? ''));
        $password = (string)($params['password'] ?? '');
        $sourcePath = '/' . ltrim((string)($params['source_path'] ?? '/'), '/');
        $targetPath = '/' . ltrim((string)($params['target_path'] ?? '/'), '/');
        $wipeTarget = (bool)($params['wipe_target'] ?? false);
        $overwrite = (bool)($params['overwrite'] ?? true);
        $excludeCommon = (bool)($params['exclude_common'] ?? true);
        $customExclusions = trim((string)($params['custom_exclusions'] ?? ''));

        // Initialize status data
        $status = [
            'status' => 'scanning',
            'progress_percent' => 0,
            'files_total' => 0,
            'files_transferred' => 0,
            'bytes_total' => 0,
            'bytes_transferred' => 0,
            'current_file' => 'Initializing connection...',
            'speed_bytes_sec' => 0,
            'source_host' => $host,
            'source_path' => $sourcePath,
            'target_path' => $targetPath,
            'wipe_target' => $wipeTarget,
            'overwrite' => $overwrite,
            'started_at' => time(),
            'updated_at' => time(),
            'logs' => [
                '[' . date('H:i:s') . '] Initializing SFTP migration session...',
                '[' . date('H:i:s') . "] Target destination: {$targetPath}",
                '[' . date('H:i:s') . "] Connecting to {$host}:{$port} as {$username}...",
            ],
            'error' => null,
        ];

        // Set execution limits
        @ini_set('memory_limit', '1024M');
        @ini_set('max_execution_time', '0');
        @set_time_limit(0);
        @ignore_user_abort(true);

        File::put($statusFile, json_encode($status, JSON_PRETTY_PRINT));

        // If running in PHP-FPM, finish the HTTP response immediately to prevent browser timeouts
        if (function_exists('fastcgi_finish_request')) {
            response()->json([
                'success' => true,
                'message' => 'Import job started successfully.',
                'status' => $status,
            ])->send();
            fastcgi_finish_request();
            $this->executeImport($server, $params, $statusFile);
            exit(0);
        }

        // For non-FPM environments, run synchronously
        $this->executeImport($server, $params, $statusFile);

        return [
            'success' => true,
            'message' => 'Import job started successfully.',
            'status' => $this->getStatus($server),
        ];
    }

    /**
     * Execute the file migration.
     */
    protected function executeImport(Server $server, array $params, string $statusFile): void
    {
        @ini_set('memory_limit', '1024M');
        @ini_set('max_execution_time', '0');
        @set_time_limit(0);
        @ignore_user_abort(true);

        // Ensure bundled phpseclib3 autoloader is loaded
        if (file_exists(__DIR__ . '/../../vendor/autoload.php')) {
            require_once __DIR__ . '/../../vendor/autoload.php';
        }

        [$host, $port] = $this->normalizeHostAndPort((string)($params['host'] ?? ''), (int)($params['port'] ?? 2022));
        $username = trim((string)($params['username'] ?? ''));
        $password = (string)($params['password'] ?? '');
        $sourcePath = '/' . trim((string)($params['source_path'] ?? '/'), '/');
        $targetPath = '/' . trim((string)($params['target_path'] ?? '/'), '/');
        $wipeTarget = (bool)($params['wipe_target'] ?? false);
        $overwrite = (bool)($params['overwrite'] ?? true);
        $excludeCommon = (bool)($params['exclude_common'] ?? true);
        $customExclusions = trim((string)($params['custom_exclusions'] ?? ''));

        // Prepare exclusions list
        $patterns = [];
        if ($excludeCommon) {
            $patterns = array_merge($patterns, [
                '*.log', '*.log.gz', 'crash-reports/*', 'logs/*', 'backups/*', 'cache/*', '.git/*', '.env', 'session.lock', 'libraries/*', '*.tmp', '*.jfr', '*.jfr.tmp', 'plugins/*/tmp/*', 'tmp/*'
            ]);
        }
        if (!empty($customExclusions)) {
            $parts = explode(',', $customExclusions);
            foreach ($parts as $p) {
                $trimmed = trim($p);
                if (!empty($trimmed)) $patterns[] = $trimmed;
            }
        }

        // Get server filesystem destination
        $localVolumePath = '/var/lib/pterodactyl/volumes/' . $server->uuid;
        $destRoot = File::isDirectory($localVolumePath) ? $localVolumePath : (storage_path('app/servers/' . $server->uuid));

        if (!File::isDirectory($destRoot)) {
            @File::makeDirectory($destRoot, 0755, true, true);
        }

        $destFullPath = rtrim($destRoot, '/') . ($targetPath !== '/' ? '/' . ltrim($targetPath, '/') : '');
        if (!File::isDirectory($destFullPath)) {
            @File::makeDirectory($destFullPath, 0755, true, true);
        }

        // Wipe destination if requested
        if ($wipeTarget && $destFullPath !== '/' && File::isDirectory($destFullPath)) {
            $this->appendLog($statusFile, "Wiping existing destination files in {$targetPath}...");
            $items = File::allFiles($destFullPath);
            foreach ($items as $item) {
                @File::delete($item->getPathname());
            }
            $dirs = File::directories($destFullPath);
            foreach ($dirs as $dir) {
                @File::deleteDirectory($dir);
            }
            $this->appendLog($statusFile, "Target directory cleaned.");
        }

        if (!class_exists(\phpseclib3\Net\SFTP::class)) {
            $this->failImport($statusFile, 'phpseclib3 is not installed on this panel. Please contact administrator.');
            return;
        }

        try {
            $sftp = new \phpseclib3\Net\SFTP($host, $port, 20);
            if (!$sftp->login($username, $password)) {
                $this->failImport($statusFile, 'Authentication failed on remote SFTP server.');
                return;
            }

            $this->appendLog($statusFile, "Connected to remote SFTP successfully. Scanning files in {$sourcePath}...");
            $this->updateStatus($statusFile, [
                'current_file' => "Scanning remote directory tree...",
                'updated_at' => time(),
            ]);

            // Scan files recursively with cycle detection & live feedback
            $filesToTransfer = [];
            $visitedDirs = [];
            $this->scanRemoteRecursive($sftp, $sourcePath, '', $patterns, $filesToTransfer, $statusFile, $visitedDirs, 0);

            if ($this->isCancelled($statusFile)) {
                $this->appendLog($statusFile, "Import was cancelled by user.");
                $this->updateStatus($statusFile, ['status' => 'cancelled']);
                return;
            }

            $totalCount = count($filesToTransfer);
            $totalBytes = array_sum(array_column($filesToTransfer, 'size'));

            $this->updateStatus($statusFile, [
                'status' => 'transferring',
                'files_total' => $totalCount,
                'bytes_total' => $totalBytes,
                'current_file' => $totalCount > 0 ? 'Starting file transfer...' : 'No files found to transfer.',
                'updated_at' => time(),
            ]);

            $this->appendLog($statusFile, "Discovered {$totalCount} files to import (" . $this->formatBytes($totalBytes) . ").");

            if ($totalCount === 0) {
                $this->appendLog($statusFile, "No matching files were discovered in {$sourcePath}.");
                $this->updateStatus($statusFile, [
                    'status' => 'completed',
                    'progress_percent' => 100,
                    'current_file' => 'Import complete (0 files).',
                    'speed_bytes_sec' => 0,
                    'updated_at' => time(),
                ]);
                return;
            }

            $transferredCount = 0;
            $transferredBytes = 0;
            $startTime = microtime(true);
            $lastProgressUpdate = microtime(true);

            foreach ($filesToTransfer as $f) {
                // Check if user cancelled
                if ($this->isCancelled($statusFile)) {
                    $this->appendLog($statusFile, "Import was cancelled by user.");
                    $this->updateStatus($statusFile, ['status' => 'cancelled']);
                    return;
                }

                $remoteFilePath = $f['full_path'];
                $relativeFilePath = $f['relative_path'];
                $fileSize = (int)$f['size'];

                $localFilePath = rtrim($destFullPath, '/') . '/' . ltrim($relativeFilePath, '/');
                $localFileDir = dirname($localFilePath);

                if (!File::isDirectory($localFileDir)) {
                    @File::makeDirectory($localFileDir, 0755, true, true);
                }

                // Check overwrite
                if (File::exists($localFilePath) && !$overwrite) {
                    $transferredCount++;
                    $transferredBytes += $fileSize;
                    continue;
                }

                // Stream remote file directly to local destination path
                $fetchSuccess = $sftp->get($remoteFilePath, $localFilePath);

                if ($fetchSuccess === false) {
                    $this->appendLog($statusFile, "Warning: Failed to download {$relativeFilePath}");
                } else {
                    $transferredCount++;
                    $transferredBytes += $fileSize;
                }

                // Throttled UI status update (at most every 0.4s or on completion)
                $now = microtime(true);
                if ($now - $lastProgressUpdate > 0.4 || $transferredCount === $totalCount) {
                    $lastProgressUpdate = $now;
                    $elapsed = $now - $startTime;
                    $speed = $elapsed > 0 ? round($transferredBytes / $elapsed) : 0;
                    $percent = $totalBytes > 0 ? min(100, round(($transferredBytes / $totalBytes) * 100, 1)) : 100;
                    $remainingBytes = max(0, $totalBytes - $transferredBytes);
                    $etaSeconds = ($speed > 0 && $remainingBytes > 0) ? (int)round($remainingBytes / $speed) : null;

                    $this->updateStatus($statusFile, [
                        'current_file' => $relativeFilePath,
                        'files_transferred' => $transferredCount,
                        'bytes_transferred' => $transferredBytes,
                        'speed_bytes_sec' => $speed,
                        'eta_seconds' => $etaSeconds,
                        'progress_percent' => $percent,
                        'updated_at' => time(),
                    ]);
                }
            }

            // Completed!
            $duration = max(1, round(microtime(true) - $startTime, 1));
            $this->appendLog($statusFile, "Import completed successfully! Transferred {$transferredCount} files (" . $this->formatBytes($transferredBytes) . ") in {$duration}s.");
            $this->updateStatus($statusFile, [
                'status' => 'completed',
                'progress_percent' => 100,
                'files_transferred' => $transferredCount,
                'bytes_transferred' => $transferredBytes,
                'current_file' => 'All files imported successfully.',
                'speed_bytes_sec' => 0,
                'updated_at' => time(),
            ]);

        } catch (\Throwable $e) {
            $this->failImport($statusFile, 'Transfer error: ' . $e->getMessage());
        }
    }

    /**
     * Recursively scan remote SFTP path safely with cycle detection, depth limits, and live reporting.
     */
    protected function scanRemoteRecursive(
        \phpseclib3\Net\SFTP $sftp,
        string $basePath,
        string $relPath,
        array $patterns,
        array &$files,
        string $statusFile,
        array &$visitedDirs = [],
        int $depth = 0
    ): void {
        // Prevent runaway recursion
        if ($depth > 8) {
            return;
        }

        // Check if user cancelled
        if ($this->isCancelled($statusFile)) {
            return;
        }

        // Compute normalized remote path
        $cleanBase = '/' . trim($basePath, '/');
        if ($cleanBase === '/') {
            $cleanBase = '';
        }
        $cleanRel = trim($relPath, '/');
        $currentFull = $cleanBase . ($cleanRel !== '' ? '/' . $cleanRel : '');
        if ($currentFull === '') {
            $currentFull = '/';
        }

        // Prevent symlink cycles
        if (isset($visitedDirs[$currentFull])) {
            return;
        }
        $visitedDirs[$currentFull] = true;

        // Fetch directory listing
        $rawList = $sftp->rawlist($currentFull);
        if ($rawList === false) {
            $rawList = $sftp->nlist($currentFull);
            if ($rawList === false || !is_array($rawList)) {
                return;
            }
            $temp = [];
            foreach ($rawList as $n) {
                if ($n === '.' || $n === '..') continue;
                $cF = ($currentFull === '/' ? '' : $currentFull) . '/' . $n;
                $isDir = $sftp->is_dir($cF);
                $temp[$n] = [
                    'type' => $isDir ? 2 : 1,
                    'size' => $isDir ? 0 : ($sftp->size($cF) ?: 0),
                ];
            }
            $rawList = $temp;
        }

        // Periodic live UI status update during deep scanning
        static $lastReportTime = 0.0;
        $now = microtime(true);
        if ($now - $lastReportTime > 0.8 || count($files) === 1) {
            $lastReportTime = $now;
            $this->updateStatus($statusFile, [
                'current_file' => "Scanning: {$currentFull} (" . count($files) . " files found)...",
                'files_total' => count($files),
                'bytes_total' => array_sum(array_column($files, 'size')),
                'updated_at' => time(),
            ]);
        }

        if ($depth <= 1 && $currentFull !== '/') {
            $this->appendLog($statusFile, "Scanning {$currentFull}... (" . count($files) . " files indexed so far)");
        }

        foreach ($rawList as $name => $info) {
            if ($name === '.' || $name === '..') continue;

            $childRel = $cleanRel !== '' ? ($cleanRel . '/' . $name) : $name;
            $childFull = ($currentFull === '/' ? '' : $currentFull) . '/' . $name;

            $type = is_array($info) ? ($info['type'] ?? 0) : 0;
            $mode = is_array($info) ? ($info['mode'] ?? 0) : 0;
            $isDir = ($type === 2 || ($mode & 0040000) === 0040000);

            // Pattern exclusion check
            if ($this->isExcluded($childRel, $isDir, $patterns)) {
                if ($isDir) {
                    $this->appendLog($statusFile, "Skipped excluded folder: {$childRel}/");
                }
                continue;
            }

            if ($isDir) {
                $this->scanRemoteRecursive(
                    $sftp,
                    $basePath,
                    $childRel,
                    $patterns,
                    $files,
                    $statusFile,
                    $visitedDirs,
                    $depth + 1
                );
            } else {
                $size = is_array($info) ? ($info['size'] ?? 0) : 0;
                $files[] = [
                    'full_path' => $childFull,
                    'relative_path' => $childRel,
                    'size' => (int) $size,
                ];
            }
        }
    }

    /**
     * Check if a path or directory matches any exclusion patterns.
     */
    protected function isExcluded(string $path, bool $isDir, array $patterns): bool
    {
        $cleanPath = trim($path, '/');
        $base = basename($cleanPath);

        foreach ($patterns as $pattern) {
            $pattern = trim($pattern);
            if ($pattern === '') continue;

            $dirPattern = rtrim($pattern, '/*');

            // 1. Direct directory match
            if ($isDir) {
                if ($base === $dirPattern || $cleanPath === $dirPattern) {
                    return true;
                }
                if (fnmatch($dirPattern, $base) || fnmatch($dirPattern, $cleanPath)) {
                    return true;
                }
            }

            // 2. Child item inside an excluded directory
            if ($dirPattern !== '' && (str_starts_with($cleanPath, $dirPattern . '/') || str_starts_with($base, $dirPattern . '/'))) {
                return true;
            }

            // 3. Filename or path glob match
            if (fnmatch($pattern, $cleanPath) || fnmatch($pattern, $base)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if current job was marked as cancelled.
     */
    protected function isCancelled(string $statusFile): bool
    {
        if (!File::exists($statusFile)) return false;
        $data = json_decode(File::get($statusFile), true);
        return is_array($data) && ($data['status'] ?? '') === 'cancelled';
    }

    /**
     * Update status JSON file safely.
     */
    protected function updateStatus(string $statusFile, array $patch): void
    {
        if (!File::exists($statusFile)) return;
        $current = json_decode(File::get($statusFile), true) ?: [];
        $merged = array_merge($current, $patch, ['updated_at' => time()]);
        File::put($statusFile, json_encode($merged, JSON_PRETTY_PRINT));
    }

    /**
     * Append a log line with timestamp to status file.
     */
    protected function appendLog(string $statusFile, string $message): void
    {
        if (!File::exists($statusFile)) return;
        $current = json_decode(File::get($statusFile), true) ?: [];
        $logs = $current['logs'] ?? [];
        $logs[] = '[' . date('H:i:s') . '] ' . $message;
        // Keep last 150 log entries to maintain fast responses
        if (count($logs) > 150) {
            $logs = array_slice($logs, -150);
        }
        $current['logs'] = $logs;
        $current['updated_at'] = time();
        File::put($statusFile, json_encode($current, JSON_PRETTY_PRINT));
    }

    /**
     * Mark import as failed.
     */
    protected function failImport(string $statusFile, string $error): void
    {
        $this->appendLog($statusFile, "ERROR: {$error}");
        $this->updateStatus($statusFile, [
            'status' => 'failed',
            'error' => $error,
            'current_file' => 'Import halted with error.',
            'updated_at' => time(),
        ]);
    }

    /**
     * Get current status for a server.
     */
    public function getStatus(Server $server): array
    {
        $statusFile = $this->getStatusFilePath($server);
        if (!File::exists($statusFile)) {
            return [
                'status' => 'idle',
                'progress_percent' => 0,
                'files_total' => 0,
                'files_transferred' => 0,
                'bytes_total' => 0,
                'bytes_transferred' => 0,
                'current_file' => '',
                'speed_bytes_sec' => 0,
                'logs' => [],
                'error' => null,
            ];
        }

        $data = json_decode(File::get($statusFile), true);
        if (!is_array($data)) {
            return ['status' => 'idle'];
        }

        // Auto-recover stale jobs if updated_at is older than 5 minutes and status was transferring/scanning
        if (in_array($data['status'] ?? '', ['transferring', 'scanning'])) {
            if (time() - ($data['updated_at'] ?? 0) > 300) {
                $data['status'] = 'failed';
                $data['error'] = 'Transfer timed out or was interrupted.';
                File::put($statusFile, json_encode($data, JSON_PRETTY_PRINT));
            }
        }

        return $data;
    }

    /**
     * Cancel active import.
     */
    public function cancelImport(Server $server): array
    {
        $statusFile = $this->getStatusFilePath($server);
        if (File::exists($statusFile)) {
            $this->updateStatus($statusFile, [
                'status' => 'cancelled',
                'current_file' => 'Import cancelled by user.',
                'updated_at' => time(),
            ]);
            $this->appendLog($statusFile, "Cancellation requested by user.");
        }
        return ['success' => true, 'message' => 'Import cancellation requested.'];
    }

    protected function formatBytes(int $bytes): string
    {
        if ($bytes >= 1073741824) return number_format($bytes / 1073741824, 2) . ' GB';
        if ($bytes >= 1048576) return number_format($bytes / 1048576, 2) . ' MB';
        if ($bytes >= 1024) return number_format($bytes / 1024, 2) . ' KB';
        return $bytes . ' B';
    }
}
