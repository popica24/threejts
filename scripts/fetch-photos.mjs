// One-off: download JTS's own photos into public/img/ and snapshot the homepage text into
// tests/fixtures/jtssolar-home.txt (the copy test checks every on-page string against it).
import { writeFile, mkdir } from 'node:fs/promises';

const SITE = 'https://www.jtssolar.ro/';
const OUT = new URL('../public/img/', import.meta.url);
const FIXTURE = new URL('../tests/fixtures/', import.meta.url);

const html = await (await fetch(SITE)).text();
await mkdir(OUT, { recursive: true });

async function save(url, name, alt) {
  const res = await fetch(url);
  if (!res.ok) { console.warn(`skip ${name}: ${res.status}`); return; }
  await writeFile(new URL(name, OUT), Buffer.from(await res.arrayBuffer()));
  console.log(`${name} → ${alt}`);
}

// "Din teren" gallery photos (960px webp)
const seen = new Set();
for (const [, id, alt] of html.matchAll(/<img[^>]*src="[^"]*\/jts-foto\/([a-z0-9]+)-1080\.webp"[^>]*alt="([^"]*)"/g)) {
  if (seen.has(id)) continue;
  seen.add(id);
  await save(`${SITE}wp-content/uploads/jts-foto/${id}-960.webp`, `${id}.webp`, alt);
}

// Project photos, matched to projects by the site's own alt text
const PROJECTS = {
  'Vedere aeriană: sistemul fotovoltaic executat de JTS SOLAR la Șantierul Naval Constanța': 'proj-santier.jpg',
  'Proiect fotovoltaic JTS SOLAR — Auchan Bradu și Găvana': 'proj-auchan-pitesti.jpg',
  'Proiect fotovoltaic JTS SOLAR — Auchan Baia Mare și Satu Mare': 'proj-auchan-baia-mare.jpg',
  'Proiect fotovoltaic JTS SOLAR — Secom': 'proj-secom.jpg',
  'Proiect fotovoltaic JTS SOLAR — Solar Ocean Fish': 'proj-solar-ocean-fish.jpg',
};
for (const tag of html.match(/<img[^>]+>/g)) {
  const alt = tag.match(/alt="([^"]*)"/)?.[1];
  const src = (tag.match(/data-src="([^"]*)"/) ?? tag.match(/\ssrc="([^"]*)"/))?.[1];
  if (alt && PROJECTS[alt] && src) { await save(src, PROJECTS[alt], alt); delete PROJECTS[alt]; }
}

// Text snapshot: title, meta description, alt texts and visible text, whitespace-collapsed.
const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8211;/g, '–').replace(/&#8217;/g, '’')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&quot;/g, '"');
const title = html.match(/<title>([^<]*)/)[1];
const meta = html.match(/<meta name="description" content="([^"]*)"/)[1];
const alts = [...html.matchAll(/alt="([^"]+)"/g)].map((m) => m[1]);
const body = html
  .replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/g, ' ')
  .replace(/<[^>]+>/g, '\n');
const lines = decode([title, meta, ...alts, body].join('\n')).split('\n').map((l) => l.trim()).filter(Boolean);
await mkdir(FIXTURE, { recursive: true });
await writeFile(new URL('jtssolar-home.txt', FIXTURE), lines.join('\n') + '\n');
console.log(`snapshot: ${lines.length} lines`);
