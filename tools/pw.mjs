// Locate a Playwright + Chromium already on this machine. Dev tooling only;
// never shipped in the buyer bundle.
import { createRequire } from 'module';
import fs from 'fs';
const home = process.env.HOME;
const npx = `${home}/.npm/_npx`;
let core;
for (const d of fs.readdirSync(npx)) {
  const p = `${npx}/${d}/node_modules/playwright-core`;
  if (fs.existsSync(p)) { core = p; break; }
}
if (!core) throw new Error('playwright-core not found in ~/.npm/_npx');
const require = createRequire(core + '/package.json');
export const { chromium } = require(core);
const cache = `${home}/Library/Caches/ms-playwright`;
export function executable() {
  for (const d of fs.readdirSync(cache).filter((x) => x.startsWith('chromium-')).sort().reverse()) {
    for (const p of [
      `${cache}/${d}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`,
      `${cache}/${d}/chrome-mac/Chromium.app/Contents/MacOS/Chromium`,
    ]) if (fs.existsSync(p)) return p;
  }
  return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
}
