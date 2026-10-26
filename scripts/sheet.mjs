// Dev helper: tile every PNG in a folder into one labelled contact sheet.
// usage: node scripts/sheet.mjs <dir> <out.png> [columns] [tileWidth]
import { chromium } from 'playwright';
import { readdirSync, readFileSync } from 'node:fs';

const [dir, out, cols = '5', tw = '260'] = process.argv.slice(2);
const files = readdirSync(dir).filter((f) => f.endsWith('.png')).sort((a, b) => parseFloat(a.slice(1)) - parseFloat(b.slice(1)));
const tiles = files.map((f) => `<figure><img src="data:image/png;base64,${readFileSync(`${dir}/${f}`).toString('base64')}"><figcaption>${f.replace('.png', '')}</figcaption></figure>`).join('');
const html = `<style>body{margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},${tw}px);gap:6px;padding:6px;width:max-content}
figure{margin:0}img{width:${tw}px;display:block}figcaption{color:#fff;font:12px sans-serif;padding:2px 0}</style>${tiles}`;
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 400, height: 300 } });
await p.setContent(html);
await p.screenshot({ path: out, fullPage: true });
await b.close();
