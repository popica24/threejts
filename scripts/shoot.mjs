// Dev helper: screenshot the running site at given scroll progress values.
// usage: node scripts/shoot.mjs <url> <outDir> [w]x[h] p1 p2 ...
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [url, out, size = '1440x900', ...ps] = process.argv.slice(2);
const [width, height] = size.split('x').map(Number);
mkdirSync(out, { recursive: true });

// Env flags: PHONE=1 (touch + mobile UA), REDUCED=1 (prefers-reduced-motion), NOGL=1 (no WebGL).
const env = process.env;
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--enable-gpu', '--ignore-gpu-blocklist', ...(env.NOGL ? ['--disable-webgl', '--disable-3d-apis'] : [])],
});
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: env.PHONE ? 2 : 1,
  isMobile: !!env.PHONE,
  hasTouch: !!env.PHONE,
  reducedMotion: env.REDUCED ? 'reduce' : 'no-preference',
});
const page = await context.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
for (const p of ps.length ? ps : ['0']) {
  await page.evaluate((p) => {
    if (window.__goto) return window.__goto(Number(p)); // dev server: exact story progress
    const max = document.documentElement.scrollHeight - innerHeight;
    window.scrollTo(0, max * Number(p));
  }, p);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/p${p}.png` });
}
console.log(logs.join('\n') || 'no console output');
await browser.close();
