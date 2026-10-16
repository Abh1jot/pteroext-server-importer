# Server File Importer — Pterodactyl 2.0 Extension

Seamlessly import and migrate world files, plugins, mods, configuration, and entire server files directly from another Pterodactyl panel or remote server using SFTP credentials.

![Pterodactyl 2.0](https://img.shields.io/badge/Pterodactyl-2.0.0--beta.1+-blue.svg)
![PHP](https://img.shields.io/badge/PHP-%3E%3D8.2-777bb4.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)

---

## ✨ Key Features
- **Direct Remote SFTP Transfer**: Enter host, port (default `2022`), username, and password from the source server's SFTP Details tab.
- **Connection Test with Live Diagnostics**: Instantly ping and verify authentication to the remote SFTP server before initiating file operations.
- **Remote Directory Explorer**: Interactively browse the remote file tree and choose whether to import the entire root (`/`) or specific directories (e.g. `plugins/`, `world/`, `mods/`).
- **Selective Exclusions & Sanitization**: Automatically skip high-volume or lock-prone files like `*.log`, `crash-reports/`, `backups/`, `cache/`, and `session.lock`, or define custom exclusion patterns.
- **Safety-First Wiping**: Option to wipe destination directory prior to migration with mandatory confirmation to prevent accidental loss.
- **Live Real-Time Monitor**: Real-time animated progress bar, transfer rate speed meter, processed file count, data volume, and live color-coded terminal log console.
- **Background Persistence**: Transfer status is persisted so refreshing the page or leaving the tab never loses track of the migration.
- **Pterodactyl 2.0 Native**: 100% compliant with Pterodactyl 2.0 extension architecture. No core panel file modifications.

---

## 🚀 Installation

### Automated Install via Artisan CLI
```bash
cd /var/www/pterodactyl
php artisan p:extension:install server-importer-2.0.0.pteroext
php artisan p:extension:enable server-importer
```

### Manual Installation
1. Extract the package into `/var/www/pterodactyl/extensions/server-importer`.
2. Run:
```bash
php artisan p:extension:enable server-importer
php artisan view:clear
php artisan config:clear
```

---

## 🔒 Permissions & Security
- Grants granular permission `Server Importer -> import` to manage who can initiate remote migrations.
- Credentials are encrypted in transit and never persisted in database logs.

---

## 📄 License
Commercial Extension by Azion. All rights reserved.
