import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import content from '../src/content.js';

describe('content (verbatim from jtssolar.ro)', () => {
  it('uses the exact hero slogan', () => {
    expect(content.hero.title).toBe('Mai multă energie de la soare. Mai puțină din rețea.');
  });

  it('lists the five process steps in order', () => {
    expect(content.process.map((s) => s.title)).toEqual([
      'Calculăm', 'Facem oferta', 'Montăm', 'Punem în funcțiune', 'Prosumator',
    ]);
  });

  it('has the exact contact details', () => {
    expect(content.contact.phones).toEqual(['0771 504 694', '0752 080 807']);
    expect(content.contact.emails).toEqual(['contact@jtssolar.ro', 'oferte@jtssolar.ro']);
    expect(content.contact.address).toBe('DN65B, 117141 Geamăna, Argeș');
  });

  it('lists the four claims', () => {
    expect(content.claims.map((c) => c.title)).toEqual([
      'Echipe proprii', 'Toată România', 'Prosumator', 'Un singur interlocutor',
    ]);
  });

  it('orders the chapters as the scroll story', () => {
    expect(content.chapters.map((c) => c.id)).toEqual([
      'hero', 'casa', 'montaj', 'stocare', 'scala', 'dece', 'contact',
    ]);
  });

  it('only references images that exist in public/img', () => {
    const imgs = [
      ...content.projects, ...content.gallery,
      ...content.chapters.flatMap((c) => c.items ?? []),
    ].map((x) => x.img).filter(Boolean);
    expect(imgs.length).toBeGreaterThan(0);
    for (const img of imgs) expect(existsSync(`public${img}`), img).toBe(true);
  });
});
