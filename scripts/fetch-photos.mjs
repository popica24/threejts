// One-off: download JTS's own site photos (960px webp) into public/img/ and print file → alt.
import { writeFile, mkdir } from 'node:fs/promises';

const SITE = 'https://www.jtssolar.ro/';
const OUT = new URL('../public/img/', import.meta.url);

const html = await (await fetch(SITE)).text();
const imgs = [...html.matchAll(/<img[^>]*src="([^"]*\/jts-foto\/([a-z0-9]+)-1080\.webp)"[^>]*alt="([^"]*)"/g)];

await mkdir(OUT, { recursive: true });
const seen = new Set();
for (const [, , id, alt] of imgs) {
  if (seen.has(id)) continue;
  seen.add(id);
  const url = `${SITE}wp-content/uploads/jts-foto/${id}-960.webp`;
  const res = await fetch(url);
  if (!res.ok) { console.warn(`skip ${id}: ${res.status}`); continue; }
  await writeFile(new URL(`${id}.webp`, OUT), Buffer.from(await res.arrayBuffer()));
  console.log(`${id}.webp → ${alt}`);
}
