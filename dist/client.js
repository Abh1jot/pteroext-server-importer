await Promise.all(["server-importer.css"].map(file => new Promise((resolve, reject) => {const href = new URL(file, import.meta.url).href;if (document.querySelector('link[href="' + href + '"]')) return resolve();const link = document.createElement('link');link.rel = 'stylesheet';link.href = href;link.onload = () => resolve();link.onerror = () => { link.remove(); reject(new Error('Unable to load extension stylesheet: ' + file)); };document.head.append(link);})));
import { definePterodactylExtension as r } from "@pterodactyl/sdk";
const o = r({
  setup({ screens: e }) {
    e.register("server-importer", () => import("./chunk.ServerImporterScreen.B7J1EMz-.js"));
  }
});
export {
  o as default
};
