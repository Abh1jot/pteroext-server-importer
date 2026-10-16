<?php

declare(strict_types=1);

namespace ServerImporter;

use Pterodactyl\Extensions\ExtensionProvider;
use Pterodactyl\Services\Extensions\ExtensionSettingDefinition;
use Pterodactyl\Services\Extensions\ExtensionSettingsDefinition;

class ServerImporterProvider extends ExtensionProvider
{
    public function boot(): void
    {
        // 1. Mount API routes (routes/server.php)
        $this->registerApiRoutes();

        // 2. Register granular permissions
        $this->registerPermissions('Server Importer', [
            'import' => 'Allow importing remote server files via SFTP',
        ]);

        // 3. Register extension settings
        $this->registerSettings(new ExtensionSettingsDefinition($this->settings(), [
            ExtensionSettingDefinition::make('enabled_by_default', 'toggle', true)
                ->label('Enable for All Servers')
                ->help('Allow all server owners to access the Server Importer tab.')
                ->field('toggle')
                ->frontend()
                ->public(),

            ExtensionSettingDefinition::make('default_port', 'number', 2022)
                ->label('Default SFTP Port')
                ->help('The default SFTP port filled in when opening the Importer wizard.')
                ->field('number')
                ->frontend()
                ->public(),

            ExtensionSettingDefinition::make('connection_timeout_seconds', 'number', 15)
                ->label('Connection Timeout (Seconds)')
                ->help('Maximum seconds to wait when testing SFTP connection or reading remote directory trees.')
                ->field('number')
                ->frontend(),

            ExtensionSettingDefinition::make('default_exclusions', 'text', '*.log, *.log.gz, crash-reports/*, backups/*, cache/*, .git/*, .env')
                ->label('Default Excluded File Patterns')
                ->help('Comma-separated list of glob patterns to exclude from migration transfers by default.')
                ->field('text')
                ->frontend()
                ->public(),
        ]));
    }
}
