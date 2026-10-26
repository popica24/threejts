// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { createRenderer, clampDt } from '../src/three/renderer.js';

describe('createRenderer', () => {
  it('returns null when WebGL is unavailable', () => {
    const canvas = document.createElement('canvas');
    canvas.getContext = () => null;
    expect(createRenderer(canvas, 'high')).toBeNull();
  });
});

describe('clampDt', () => {
  it('caps long frame gaps (hidden tab) at 0.1s', () => {
    expect(clampDt(12)).toBe(0.1);
    expect(clampDt(0.016)).toBe(0.016);
  });
});
