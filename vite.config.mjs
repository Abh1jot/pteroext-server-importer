import { defineConfig } from 'vite';
import { resolve } from 'path';

/** Modules provided by the panel runtime import map - never bundled */
const SHARED_RUNTIME_MODULES = [
    'react',
    'react/jsx-runtime',
    'react-dom',
    'react-dom/client',
    '@tanstack/react-query',
    '@pterodactyl/sdk',
    '@pterodactyl/sdk/api',
    '@pterodactyl/sdk/theme',
];

/** Ensures entry CSS loads before setup runs, matching exact URL so multiple extensions never conflict */
const extensionStylesPlugin = () => ({
    name: 'imp-extension-styles',
    enforce: 'post',
    generateBundle(_options, bundle) {
        const cssFiles = Object.keys(bundle).filter((file) => file.endsWith('.css'));
        if (!cssFiles.length) return;

        for (const chunk of Object.values(bundle)) {
            if (chunk.type !== 'chunk' || !chunk.isEntry) continue;
            const prelude = 'await Promise.all(' + JSON.stringify(cssFiles) + '.map(file => new Promise((resolve, reject) => {' +
                'const href = new URL(file, import.meta.url).href;' +
                'if (document.querySelector(\'link[href="\' + href + \'"]\')) return resolve();' +
                'const link = document.createElement(\'link\');' +
                'link.rel = \'stylesheet\';' +
                'link.href = href;' +
                'link.onload = () => resolve();' +
                'link.onerror = () => { link.remove(); reject(new Error(\'Unable to load extension stylesheet: \' + file)); };' +
                'document.head.append(link);' +
            '})));\n';
            chunk.code = prelude + chunk.code;
        }
    },
});

export default defineConfig({
    plugins: [extensionStylesPlugin()],
    publicDir: false,
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        target: 'es2022',
        modulePreload: false,
        lib: {
            entry: resolve(__dirname, 'src/client/index.tsx'),
            formats: ['es'],
            fileName: () => 'client.js',
        },
        rollupOptions: {
            external: SHARED_RUNTIME_MODULES,
            output: {
                format: 'es',
                entryFileNames: 'client.js',
                chunkFileNames: 'chunk.[name].[hash].js',
                assetFileNames: (assetInfo) => (assetInfo.name && assetInfo.name.endsWith('.css') ? 'server-importer.css' : '[name].[hash][extname]'),
            },
        },
    },
});
