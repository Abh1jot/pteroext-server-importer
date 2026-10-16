import { definePterodactylExtension } from '@pterodactyl/sdk';
import './styles.css';

export default definePterodactylExtension({
    setup({ screens }) {
        screens.register('server-importer', () => import('./screens/ServerImporterScreen'));
    },
});
