import { copyFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const assets = [
  ["svg/favicon.svg", "favicon.svg"],
  ["svg/quantflow-mark.svg", "quantflow-mark.svg"],
  ["svg/quantflow-mark-white.svg", "quantflow-mark-white.svg"],
  ["png/apple-touch-icon-180.png", "apple-touch-icon.png"],
  ["png/pwa-icon-192.png", "pwa-icon-192.png"],
  ["png/pwa-icon-512.png", "pwa-icon-512.png"],
  ["png/pwa-maskable-192.png", "pwa-maskable-192.png"],
  ["png/pwa-maskable-512.png", "pwa-maskable-512.png"],
];

for (const app of ["web", "admin"]) {
  const output = join(root, "apps", app, "public", "brand");
  mkdirSync(output, { recursive: true });
  for (const [source, name] of assets) {
    copyFileSync(join(root, "assets", "brand", source), join(output, name));
  }
}

console.log(`Synced ${assets.length} brand assets to web and admin.`);
