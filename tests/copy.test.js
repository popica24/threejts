// @vitest-environment jsdom
// Every word a visitor can see or hear must come from jtssolar.ro (snapshot: tests/fixtures/jtssolar-home.txt,
// refreshed by `node scripts/fetch-photos.mjs`). Only numbers and punctuation are allowed on top.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import content from '../src/content.js';
import { renderChapters } from '../src/dom/chapters.js';
import { createRail } from '../src/ui/rail.js';
import { createLoader } from '../src/ui/loader.js';

const norm = (s) => s.replace(/\s+/g, ' ').trim();
const SITE = readFileSync('tests/fixtures/jtssolar-home.txt', 'utf8');
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// A whole phrase from the site: it must start at a line start or after a sentence/label end (". ", ": ")
// and end at a line end, at a ":" label, or with its own sentence punctuation. Spaces may span line breaks.
function onSite(s) {
  const body = escape(s).replace(/ /g, '\\s+');
  const end = /[.?!:]$/.test(s) ? '' : '(?=\\n|:|$)';
  return new RegExp(`(?:^|\\n|[.?!:] )${body}${end}`).test(SITE);
}
const isNeutral = (s) => /^[\d\s.,:%·→↓↗—–-]*$/.test(s);

// Every string shown in `root`: text nodes, alt texts, aria-labels, titles.
function strings(root) {
  const out = [];
  const walker = root.ownerDocument.createTreeWalker(root, 4 /* SHOW_TEXT */);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.parentElement?.closest('script, style')) continue;
    out.push(n.textContent);
  }
  for (const el of root.querySelectorAll('[alt], [aria-label], [title], [data-cursor]')) {
    for (const a of ['alt', 'aria-label', 'title', 'data-cursor']) if (el.hasAttribute(a)) out.push(el.getAttribute(a));
  }
  return out.map(norm).filter((s) => s && !isNeutral(s));
}

function notOnSite(list) {
  // Strip arrows/separators we add around site phrases (e.g. "Vedeți cum lucrăm ↓").
  return [...new Set(list)].filter((s) => !onSite(s.replace(/\s*[↓→]\s*$/, '')));
}

describe('all copy comes from jtssolar.ro', () => {
  it('chapters (no pitch credit)', () => {
    document.body.innerHTML = '<main id="c"></main>';
    const root = document.getElementById('c');
    renderChapters(root, content, { name: '' });
    expect(notOnSite(strings(root))).toEqual([]);
  });

  it('page shell: title, meta description, header, loader', () => {
    const doc = new DOMParser().parseFromString(readFileSync('index.html', 'utf8'), 'text/html');
    const list = [...strings(doc.body), norm(doc.title), doc.querySelector('meta[name="description"]').content];
    expect(notOnSite(list)).toEqual([]);
  });

  it('chapter rail labels', () => {
    const el = document.createElement('nav');
    createRail(el, { scrollToChapter() {} });
    expect(notOnSite(strings(el))).toEqual([]);
  });

  it('loader shows only a percentage', () => {
    const el = document.createElement('div');
    createLoader(el).setProgress(0.5);
    expect(el.textContent.trim()).toBe('50%');
  });
});
