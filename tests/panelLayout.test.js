import { describe, it, expect } from 'vitest';
import { Vector3 } from 'three';
import { roofSlots, panelState, PANEL_WINDOW } from '../src/three/world/panelLayout.js';

const up = new Vector3(0, 3.4, -4.5).normalize();
const roof = {
  origin: new Vector3(-5, 7, 0.3),
  right: new Vector3(1, 0, 0),
  down: up.clone().negate(),
  normal: new Vector3(1, 0, 0).cross(up).normalize(),
  width: 10,
  height: 4.6,
};

describe('roofSlots', () => {
  const slots = roofSlots(5, 3, roof);
  it('makes one slot per panel', () => expect(slots.length).toBe(15));
  it('keeps every slot on the roof plane', () => {
    for (const s of slots) {
      const d = new Vector3(...s.pos).sub(roof.origin).dot(roof.normal);
      expect(Math.abs(d)).toBeLessThan(1e-6);
    }
  });
  it('fills the bottom row first, left to right', () => {
    const along = (s) => new Vector3(...s.pos).sub(roof.origin).dot(roof.down);
    const across = (s) => new Vector3(...s.pos).sub(roof.origin).dot(roof.right);
    expect(along(slots[0])).toBeGreaterThan(along(slots[5]));
    expect(across(slots[0])).toBeLessThan(across(slots[1]));
    expect(slots.map((s) => s.i)).toEqual([...Array(15).keys()]);
  });
});

describe('panelState', () => {
  const n = 15;
  it('has nothing placed before the window', () => expect(panelState(0, PANEL_WINDOW[0] - 0.01, n).placed).toBe(0));
  it('has everything placed after the window', () => expect(panelState(n - 1, PANEL_WINDOW[1] + 0.01, n).placed).toBe(1));
  it('places earlier panels no later than later ones', () => {
    for (let k = 0; k <= 50; k++) {
      const p = PANEL_WINDOW[0] + (PANEL_WINDOW[1] - PANEL_WINDOW[0]) * (k / 50);
      for (let i = 1; i < n; i++) expect(panelState(i - 1, p, n).placed).toBeGreaterThanOrEqual(panelState(i, p, n).placed);
    }
  });
  it('is a pure function of p', () => {
    const a = panelState(7, 0.37, n);
    panelState(7, 0.9, n);
    expect(panelState(7, 0.37, n)).toEqual(a);
  });
});
