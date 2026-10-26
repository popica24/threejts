// Headings reveal word by word as their chapter scrolls in; panels fade up. Reduced motion → plain fades.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { interactionsEnabled } from './cursor.js';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function splitReveal(el, { trigger = el, immediate = false } = {}) {
  const text = el.textContent;
  // Touch screens and reduced motion get a plain fade (the spec turns fly-ins off there).
  if (!interactionsEnabled()) {
    gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6, scrollTrigger: immediate ? undefined : { trigger, start: 'top 80%' } });
    return;
  }
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const inners = text.split(/\s+/).filter(Boolean).map((w, i, all) => {
    const word = document.createElement('span');
    word.className = 'word';
    word.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.textContent = w;
    word.append(inner);
    el.append(word, i < all.length - 1 ? ' ' : '');
    return inner;
  });
  gsap.fromTo(inners, { yPercent: 110, rotate: 4 }, {
    yPercent: 0, rotate: 0, duration: 1.1, ease: 'expo.out', stagger: 0.045,
    scrollTrigger: immediate ? undefined : { trigger, start: 'top 75%' },
  });
}

export function revealPanels(sections) {
  const reduced = reducedMotion();
  for (const s of sections) {
    const parts = s.querySelectorAll('.panel > :not(.title)');
    if (!parts.length || s.dataset.chapter === 'hero') continue;
    gsap.fromTo(parts, { opacity: 0, y: reduced || !interactionsEnabled() ? 0 : 28 }, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06,
      scrollTrigger: { trigger: s.querySelector('.panel'), start: 'top 80%' },
    });
  }
}
