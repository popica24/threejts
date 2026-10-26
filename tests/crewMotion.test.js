import { describe, it, expect } from 'vitest';
import { pose, crewPlan, CREW_SIZE } from '../src/three/world/crewMotion.js';
import { roofSlots, panelState, panelWindow, PANEL_WINDOW } from '../src/three/world/panelLayout.js';
import { roofFrame } from '../src/three/world/house.js';

const slots = roofSlots(5, 3, roofFrame());
const n = slots.length;
const flat = (o) => Object.values(o).flat();

describe('pose', () => {
  it('walk cycles with period 1', () => {
    const a = flat(pose('walk', 0)), b = flat(pose('walk', 1));
    a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 6));
  });
  it('swings the legs in opposite phase', () => {
    expect(pose('walk', 0.25).legL[0]).toBeCloseTo(-pose('walk', 0.75).legL[0], 9);
    expect(pose('walk', 0.25).legL[0]).toBeCloseTo(-pose('walk', 0.25).legR[0], 9);
  });
  it('raises an arm to wave', () => {
    expect(pose('wave', 0.3).armR[0]).toBeLessThan(-2);
  });
});

describe('crewPlan', () => {
  it('has a crew of four', () => expect(crewPlan(0.1, slots).length).toBe(CREW_SIZE));

  it('stands idle before the montage', () => {
    for (const m of crewPlan(0.1, slots)) {
      expect(m.kind).toBe('idle');
      expect(m.carrying).toBeNull();
    }
  });

  it('has exactly one installer carrying each panel until it is placed', () => {
    for (let i = 0; i < n; i++) {
      const [a, b] = panelWindow(i, n);
      for (const p of [a, (a + b) / 2, b - 1e-6]) {
        const carriers = crewPlan(p, slots).filter((m) => m.carrying === i);
        expect(carriers.length, `panel ${i} at ${p}`).toBe(1);
      }
      expect(panelState(i, b, n).placed).toBe(1);
      expect(crewPlan(b, slots).some((m) => m.carrying === i)).toBe(false);
    }
  });

  it('never has one installer carrying two panels', () => {
    for (let k = 0; k <= 400; k++) {
      const p = 0.2 + (k / 400) * 0.3;
      const carried = crewPlan(p, slots).map((m) => m.carrying).filter((c) => c !== null);
      expect(new Set(carried).size).toBe(carried.length);
    }
  });

  it('waves when the roof is done', () => {
    expect(crewPlan(PANEL_WINDOW[1] + 0.01, slots).filter((m) => m.kind === 'wave').length).toBeGreaterThanOrEqual(3);
  });

  it('is a pure function of p', () => {
    const a = JSON.stringify(crewPlan(0.4, slots));
    crewPlan(0.9, slots);
    expect(JSON.stringify(crewPlan(0.4, slots))).toBe(a);
  });

  it('keeps feet on the ground or the roof (never below ground)', () => {
    for (let k = 0; k <= 200; k++) for (const m of crewPlan(k / 200, slots)) expect(m.pos[1]).toBeGreaterThanOrEqual(0);
  });
});
