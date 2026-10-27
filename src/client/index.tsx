import ServerImporterScreen from './screens/ServerImporterScreen';
import { definePterodactylExtension } from '@pterodactyl/sdk';
import ServerImportLockdown from './components/ServerImportLockdown';
import './styles.css';

export default definePterodactylExtension({
    setup({ screens, slots }) {
        screens.register('server-importer', () => Promise.resolve({ default: ServerImporterScreen }));
        if (slots && typeof slots.register === 'function') {
            slots.register('server.console.before', ServerImportLockdown);
            slots.register('server.console.after', ServerImportLockdown);
        }
    },
});
