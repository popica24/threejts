// Dev helper: screenshot the running site at given scroll progress values.
// usage: node scripts/shoot.mjs <url> <outDir> [w]x[h] p1 p2 ...
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [url, out, size = '1440x900', ...ps] = process.argv.slice(2);
const [width, height] = size.split('x').map(Number);
mkdirSync(out, { recursive: true });

let browser;
try { browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu'] }); }
catch { browser = await chromium.launch({ channel: 'chrome' }); }
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
for (const p of ps.length ? ps : ['0']) {
  await page.evaluate((p) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    window.scrollTo(0, max * Number(p));
  }, p);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/p${p}.png` });
}
console.log(logs.join('\n') || 'no console output');
await browser.close();
