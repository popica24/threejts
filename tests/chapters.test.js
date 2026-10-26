// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import content from '../src/content.js';
import { renderChapters } from '../src/dom/chapters.js';
import { createLoader } from '../src/ui/loader.js';

const credit = { name: 'Ana Test', url: '' };
let root;
beforeEach(() => { document.body.innerHTML = '<main id="chapters"></main>'; root = document.getElementById('chapters'); });

describe('renderChapters', () => {
  it('renders one section per chapter, in story order', () => {
    const sections = renderChapters(root, content, credit);
    expect(sections.map((s) => s.dataset.chapter)).toEqual(content.chapters.map((c) => c.id));
    expect(root.querySelectorAll('section.chapter').length).toBe(7);
  });

  it('renders the five process steps', () => {
    renderChapters(root, content, credit);
    expect(root.querySelectorAll('.step').length).toBe(5);
    expect(root.querySelector('.step[data-step="3"]').textContent).toContain('Montăm');
  });

  it('shows the pitch credit', () => {
    renderChapters(root, content, credit);
    expect(root.querySelector('.credit').textContent).toContain('Ana Test');
  });

  it('hides the credit when the name is empty', () => {
    renderChapters(root, content, { name: '' });
    expect(root.querySelector('.credit')).toBeNull();
  });

  it('links the contact CTAs', () => {
    renderChapters(root, content, credit);
    const hrefs = [...root.querySelectorAll('[data-chapter="contact"] a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('mailto:oferte@jtssolar.ro');
    expect(hrefs).toContain('tel:0771504694');
    expect(hrefs).toContain('tel:0752080807');
  });

  it('falls back to a branded placeholder when a photo fails', () => {
    renderChapters(root, content, credit);
    const img = root.querySelector('.card img');
    img.dispatchEvent(new Event('error'));
    expect(img.closest('.card').classList.contains('img-fallback')).toBe(true);
  });
});

describe('createLoader', () => {
  it('shows progress as a percentage', () => {
    const el = document.createElement('div');
    createLoader(el).setProgress(0.42);
    expect(el.textContent).toContain('42%');
  });
});
