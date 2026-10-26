import { describe, it, expect } from 'vitest';
import { sampleCamera } from '../src/three/cameraPath.js';
import { CHAPTER_RANGES } from '../src/scroll/progress.js';

const mid = ([a, b]) => (a + b) / 2;

describe('sampleCamera', () => {
  it('opens high and far from the house', () => {
    const { pos } = sampleCamera(0);
    expect(pos.y).toBeGreaterThan(15);
    expect(pos.length()).toBeGreaterThan(50);
  });

  it('is close to the house while the panels go up', () => {
    expect(sampleCamera(mid(CHAPTER_RANGES.montaj)).pos.length()).toBeLessThan(25);
  });

  it('looks over the industrial site in the projects chapter', () => {
    expect(sampleCamera(0.7).pos.x).toBeGreaterThan(30);
  });

  it('is a pure function of p', () => {
    const a = sampleCamera(0.1).pos.clone();
    sampleCamera(0.9);
    expect(sampleCamera(0.1).pos.equals(a)).toBe(true);
  });
});
