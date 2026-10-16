<?php

declare(strict_types=1);

namespace ServerImporter\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Pterodactyl\Models\Server;
use ServerImporter\Services\SftpImporterService;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ServerImporterController extends Controller
{
    protected SftpImporterService $importer;

    public function __construct(SftpImporterService $importer)
    {
        $this->importer = $importer;
    }

    protected function resolveServer(Request $request, mixed $server = null): Server
    {
        if ($server instanceof Server) {
            return $server;
        }

        $param = $server ?? $request->route('server');

        if ($param instanceof Server) {
            return $param;
        }

        if ($request->attributes->has('server')) {
            $attrServer = $request->attributes->get('server');
            if ($attrServer instanceof Server) {
                return $attrServer;
            }
        }

        if (is_string($param) && !empty($param)) {
            $found = Server::query()
                ->where(strlen($param) === 8 ? 'uuidShort' : 'uuid', $param)
                ->first();

            if ($found) {
                return $found;
            }

            if (str_starts_with($param, 'serv_') && method_exists(Server::class, 'whereIdentifier')) {
                $found = Server::whereIdentifier($param)->first();
                if ($found) {
                    return $found;
                }
            }

            if (is_numeric($param)) {
                $found = Server::find((int) $param);
                if ($found) {
                    return $found;
                }
            }
        }

        $fallbackParam = $request->query('server_id') ?? $request->query('server') ?? $request->route('server_id') ?? $request->route('serverId');
        if (!empty($fallbackParam)) {
            $found = Server::query()
                ->where(is_numeric($fallbackParam) ? 'id' : (strlen($fallbackParam) === 8 ? 'uuidShort' : 'uuid'), $fallbackParam)
                ->first();
            if ($found) {
                return $found;
            }
        }

        throw new NotFoundHttpException('Could not resolve server model from request parameters.');
    }

    /**
     * Test connection to remote SFTP server.
     */
    public function testConnection(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'host' => 'required|string',
            'port' => 'nullable|integer|min:1|max:65535',
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $res = $this->importer->testConnection(
            $validated['host'],
            (int)($validated['port'] ?? 2022),
            $validated['username'],
            $validated['password']
        );

        return response()->json($res, $res['success'] ? 200 : 400);
    }

    /**
     * List directories / files on the remote server.
     */
    public function listRemote(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'host' => 'required|string',
            'port' => 'nullable|integer|min:1|max:65535',
            'username' => 'required|string',
            'password' => 'required|string',
            'path' => 'nullable|string',
        ]);

        try {
            $result = $this->importer->listRemote(
                $validated['host'],
                (int)($validated['port'] ?? 2022),
                $validated['username'],
                $validated['password'],
                $validated['path'] ?? '/'
            );

            return response()->json($result);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Start the import process.
     */
    public function startImport(Request $request, mixed $server = null): JsonResponse
    {
        $serverModel = $this->resolveServer($request, $server);

        $validated = $request->validate([
            'host' => 'required|string',
            'port' => 'nullable|integer|min:1|max:65535',
            'username' => 'required|string',
            'password' => 'required|string',
            'source_path' => 'nullable|string',
            'target_path' => 'nullable|string',
            'wipe_target' => 'nullable|boolean',
            'overwrite' => 'nullable|boolean',
            'exclude_common' => 'nullable|boolean',
            'custom_exclusions' => 'nullable|string',
        ]);

        $res = $this->importer->startImport($serverModel, $validated);
        return response()->json($res, $res['success'] ? 200 : 400);
    }

    /**
     * Poll live status of import.
     */
    public function getStatus(Request $request, mixed $server = null): JsonResponse
    {
        $serverModel = $this->resolveServer($request, $server);
        $status = $this->importer->getStatus($serverModel);
        return response()->json($status);
    }

    /**
     * Cancel running import.
     */
    public function cancelImport(Request $request, mixed $server = null): JsonResponse
    {
        $serverModel = $this->resolveServer($request, $server);
        $res = $this->importer->cancelImport($serverModel);
        return response()->json($res);
    }
}
