// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { bootStage } from '../src/three/boot.js';
import { viewportSize } from '../src/three/renderer.js';
import { shouldRefreshOnResize } from '../src/scroll/scroller.js';
import { activeStep } from '../src/scroll/progress.js';
import { PANEL_WINDOW } from '../src/three/world/panelLayout.js';

vi.hoisted(() => {
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
});

describe('bootStage', () => {
  it('falls back (no blank loader) when 3D setup throws', async () => {
    const onReady = vi.fn();
    await bootStage(() => Promise.reject(new Error('context lost')), onReady);
    expect(onReady).toHaveBeenCalledWith(null);
  });
  it('passes the stage through when setup works', async () => {
    const onReady = vi.fn();
    await bootStage(() => Promise.resolve({ ok: 1 }), onReady);
    expect(onReady).toHaveBeenCalledWith({ ok: 1 });
  });
});

describe('viewportSize', () => {
  it('uses the canvas box (100lvh on phones), not innerHeight', () => {
    const c = { clientWidth: 390, clientHeight: 900 };
    expect(viewportSize(c)).toEqual({ w: 390, h: 900 });
  });
});

describe('shouldRefreshOnResize', () => {
  it('ignores a phone toolbar showing/hiding', () => {
    expect(shouldRefreshOnResize({ w: 390, h: 760 }, { w: 390, h: 844 }, true)).toBe(false);
  });
  it('refreshes on rotation or width change', () => {
    expect(shouldRefreshOnResize({ w: 390, h: 844 }, { w: 844, h: 390 }, true)).toBe(true);
  });
  it('always refreshes on desktop', () => {
    expect(shouldRefreshOnResize({ w: 1440, h: 900 }, { w: 1440, h: 860 }, false)).toBe(true);
  });
});

describe('activeStep (montaj steps follow the crew)', () => {
  const [a, b] = PANEL_WINDOW;
  it('is on "Montăm" (index 2) the whole time panels are going up', () => {
    for (let k = 0; k <= 10; k++) expect(activeStep(a + (b - a) * (k / 10) * 0.999)).toBe(2);
  });
  it('shows calculate/offer before and commission/prosumer after', () => {
    expect(activeStep(0.23)).toBe(0);
    expect(activeStep(a - 0.005)).toBe(1);
    expect(activeStep(b + 0.005)).toBe(3);
    expect(activeStep(0.495)).toBe(4);
  });
});

describe('topbar phone', () => {
  it('dials instead of scrolling', () => {
    expect(readFileSync('index.html', 'utf8')).toMatch(/class="btn btn--small"[^>]*href="tel:0771504694"|href="tel:0771504694"[^>]*class="btn btn--small"/);
  });
});
