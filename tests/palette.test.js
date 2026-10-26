import { describe, it, expect } from 'vitest';
import { paletteAt } from '../src/three/palette.js';

describe('paletteAt', () => {
  it('rises from dawn to midday and sinks to golden hour', () => {
    expect(paletteAt(0).sunElevation).toBeLessThan(paletteAt(0.35).sunElevation);
    expect(paletteAt(0.95).sunElevation).toBeLessThan(paletteAt(0.35).sunElevation);
    expect(paletteAt(0).sunElevation).toBeCloseTo(2);
  });

  it('changes continuously with scroll', () => {
    let prev = paletteAt(0);
    for (let i = 1; i <= 200; i++) {
      const cur = paletteAt(i / 200);
      expect(Math.abs(cur.sunElevation - prev.sunElevation)).toBeLessThan(3);
      prev = cur;
    }
  });

  it('returns hex colour strings', () => {
    const c = paletteAt(0.5);
    for (const v of [c.sky[0], c.sky[1], c.sun, c.fog]) expect(v).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('clamps outside 0..1', () => {
    expect(paletteAt(-1)).toEqual(paletteAt(0));
    expect(paletteAt(2)).toEqual(paletteAt(1));
  });
});
