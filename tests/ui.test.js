// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ScrollTrigger reads matchMedia when it loads; jsdom has none.
vi.hoisted(() => {
  window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
});
import { interactionsEnabled, initCursor } from '../src/ui/cursor.js';
import { splitReveal } from '../src/ui/splitReveal.js';
import { initTilt } from '../src/ui/tilt.js';

function stubMedia({ coarse = false, reduced = false } = {}) {
  window.matchMedia = vi.fn((q) => ({
    matches: (q.includes('pointer: coarse') && coarse) || (q.includes('reduce') && reduced) || (q.includes('pointer: fine') && !coarse),
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  }));
}

beforeEach(() => {
  document.body.innerHTML = '<div id="cursor" class="cursor"></div><h2 class="title">Lumina de azi, curentul de diseară.</h2><figure class="card"></figure>';
});

describe('interactionsEnabled', () => {
  it('is off on touch screens', () => { stubMedia({ coarse: true }); expect(interactionsEnabled()).toBe(false); });
  it('is off with reduced motion', () => { stubMedia({ reduced: true }); expect(interactionsEnabled()).toBe(false); });
  it('is on for a mouse without reduced motion', () => { stubMedia(); expect(interactionsEnabled()).toBe(true); });
});

describe('initCursor', () => {
  it('leaves the custom cursor hidden on touch screens', () => {
    stubMedia({ coarse: true });
    initCursor(document.getElementById('cursor'));
    expect(document.documentElement.classList.contains('has-cursor')).toBe(false);
  });
  it('turns on the custom cursor for a mouse', () => {
    stubMedia();
    initCursor(document.getElementById('cursor'));
    expect(document.documentElement.classList.contains('has-cursor')).toBe(true);
  });
});

describe('splitReveal', () => {
  it('does not split words with reduced motion', () => {
    stubMedia({ reduced: true });
    const h = document.querySelector('h2');
    splitReveal(h);
    expect(h.querySelectorAll('.word').length).toBe(0);
    expect(h.textContent).toBe('Lumina de azi, curentul de diseară.');
  });
  it('splits into words and keeps the text intact', () => {
    stubMedia();
    const h = document.querySelector('h2');
    splitReveal(h);
    expect(h.querySelectorAll('.word').length).toBe(6);
    expect(h.textContent.replace(/\s+/g, ' ').trim()).toBe('Lumina de azi, curentul de diseară.');
    expect(h.getAttribute('aria-label')).toBe('Lumina de azi, curentul de diseară.');
  });
});

describe('initTilt', () => {
  it('does nothing on touch screens', () => {
    stubMedia({ coarse: true });
    initTilt('.card');
    document.querySelector('.card').dispatchEvent(new MouseEvent('pointermove', { clientX: 5, clientY: 5 }));
    expect(document.querySelector('.card').style.getPropertyValue('--rx')).toBe('');
  });
});
