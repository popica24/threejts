import { describe, it, expect } from 'vitest';
import { CHAPTER_RANGES, local, easeInOut, chapterAt } from '../src/scroll/progress.js';

describe('CHAPTER_RANGES', () => {
  it('covers 0..1 contiguously in story order', () => {
    const ids = Object.keys(CHAPTER_RANGES);
    expect(ids).toEqual(['hero', 'casa', 'montaj', 'stocare', 'scala', 'dece', 'contact']);
    const r = Object.values(CHAPTER_RANGES);
    expect(r[0][0]).toBe(0);
    expect(r.at(-1)[1]).toBe(1);
    for (let i = 1; i < r.length; i++) expect(r[i][0]).toBe(r[i - 1][1]);
  });
});

describe('local', () => {
  it('maps the middle of a range to 0.5', () => expect(local(0.36, [0.22, 0.5])).toBeCloseTo(0.5));
  it('clamps below and above', () => {
    expect(local(-1, [0.22, 0.5])).toBe(0);
    expect(local(2, [0.22, 0.5])).toBe(1);
  });
});

describe('easeInOut', () => {
  it('is a smoothstep fixed at 0, .5 and 1', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBe(0.5);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.1)).toBeLessThan(0.1);
  });
});

describe('chapterAt', () => {
  it('finds the chapter for a progress value', () => {
    expect(chapterAt(0)).toBe('hero');
    expect(chapterAt(0.55)).toBe('stocare');
    expect(chapterAt(1)).toBe('contact');
  });
});

import { progressFromLayout } from '../src/scroll/progress.js';

describe('progressFromLayout', () => {
  // 7 chapters, scroll starts at each section top; last chapter ends at maxScroll.
  const tops = [0, 900, 2000, 4500, 5600, 7800, 8700];
  const max = 9400;
  it('is 0 at the top and 1 at the bottom', () => {
    expect(progressFromLayout(0, tops, max)).toBe(0);
    expect(progressFromLayout(max, tops, max)).toBe(1);
  });
  it('lands on chapter boundaries exactly at section tops', () => {
    expect(progressFromLayout(2000, tops, max)).toBeCloseTo(CHAPTER_RANGES.montaj[0]);
    expect(progressFromLayout(5600, tops, max)).toBeCloseTo(CHAPTER_RANGES.scala[0]);
  });
  it('interpolates inside a chapter', () => {
    expect(progressFromLayout(3250, tops, max)).toBeCloseTo(0.36);
  });
  it('is monotonic', () => {
    let prev = -1;
    for (let y = 0; y <= max; y += 37) { const p = progressFromLayout(y, tops, max); expect(p).toBeGreaterThanOrEqual(prev); prev = p; }
  });
});
