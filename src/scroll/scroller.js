// Lenis smooth scroll + ScrollTrigger, reporting one global progress value p ∈ [0, 1].
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { progressFromLayout, scrollForProgress } from './progress.js';

gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export function createScroller({ sections, onProgress }) {
  const reduced = prefersReducedMotion();
  let tops = [];
  let max = 1;

  // A chapter starts when its section's top crosses the middle of the viewport.
  const measure = () => {
    const lead = innerHeight * 0.5;
    tops = sections.map((s, i) => (i === 0 ? 0 : Math.max(0, s.getBoundingClientRect().top + scrollY - lead)));
    max = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
  };
  const emit = (y = scrollY) => onProgress(progressFromLayout(y, tops, max));

  let lenis = null;
  const tick = (t) => lenis.raf(t * 1000);
  if (!reduced) {
    lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9 });
    lenis.on('scroll', ({ scroll }) => { ScrollTrigger.update(); emit(scroll); });
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
  } else {
    addEventListener('scroll', () => emit(), { passive: true });
  }

  const onResize = () => { measure(); ScrollTrigger.refresh(); emit(); };
  addEventListener('resize', onResize);
  ScrollTrigger.addEventListener('refresh', () => { measure(); emit(); });

  const byId = (id) => sections.find((s) => s.dataset.chapter === id);
  const scrollToChapter = (id) => {
    const el = byId(id);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { duration: 2.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else el.scrollIntoView();
  };

  // In-page anchors (#contact, #casa…) go through the smooth scroller.
  const onClick = (e) => {
    const a = e.target.closest?.('a[href^="#"]');
    if (!a || !byId(a.getAttribute('href').slice(1))) return;
    e.preventDefault();
    scrollToChapter(a.getAttribute('href').slice(1));
  };
  document.addEventListener('click', onClick);

  measure();
  emit();

  const scrollToProgress = (p, immediate = false) => {
    const y = scrollForProgress(p, tops, max);
    if (lenis) lenis.scrollTo(y, { immediate, force: true });
    else scrollTo(0, y);
  };

  return {
    scrollToChapter,
    scrollToProgress,
    refresh: onResize,
    destroy() {
      removeEventListener('resize', onResize);
      document.removeEventListener('click', onClick);
      if (lenis) { gsap.ticker.remove(tick); lenis.destroy(); }
    },
  };
}
