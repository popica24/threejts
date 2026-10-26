import './styles/base.css';
import './styles/chapters.css';
import './styles/ui.css';
import content from './content.js';
import { CREDIT, detectQuality } from './config.js';
import { createStage } from './three/stage.js';
import { bootStage } from './three/boot.js';
import { renderChapters } from './dom/chapters.js';
import { createLoader } from './ui/loader.js';
import { createRail } from './ui/rail.js';
import { initCursor } from './ui/cursor.js';
import { initMagnetic } from './ui/magnetic.js';
import { initTilt } from './ui/tilt.js';
import { splitReveal, revealPanels } from './ui/splitReveal.js';
import { createScroller } from './scroll/scroller.js';
import { CHAPTER_RANGES, activeStep } from './scroll/progress.js';

// The story is ~10 screens long; each chapter's height follows its share of the progress range.
const STORY_VH = 1000;

const loader = createLoader(document.getElementById('loader'));
const sections = renderChapters(document.getElementById('chapters'), content, CREDIT);
for (const s of sections) {
  const [a, b] = CHAPTER_RANGES[s.dataset.chapter];
  s.style.setProperty('--h', `${Math.round((b - a) * STORY_VH)}vh`);
}

const steps = [...document.querySelectorAll('.step')];
const state = { p: 0 };
let rail;

const scroller = createScroller({
  sections,
  onProgress(p) {
    state.p = p;
    rail?.update(p);
    const s = activeStep(p);
    steps.forEach((el, i) => {
      el.classList.toggle('is-active', i === s);
      el.classList.toggle('is-past', i < s);
    });
  },
});
rail = createRail(document.getElementById('rail'), scroller);
rail.update(state.p);
if (import.meta.env.DEV) {
  window.__story = state;
  window.__goto = (p) => scroller.scrollToProgress(p, true);
}

const quality = detectQuality();
document.documentElement.dataset.quality = quality;
bootStage(() => createStage(document.getElementById('gl'), quality, {
  getProgress: () => state.p,
  onLoad: (v) => loader.setProgress(v),
}), (stage) => {
  if (!stage) document.documentElement.classList.add('no-webgl');
  loader.done();
  scroller.refresh();
  initInteractions();
});

function initInteractions() {
  initCursor(document.getElementById('cursor'));
  initMagnetic();
  initTilt('.card');
  for (const h of document.querySelectorAll('[data-reveal]')) {
    const hero = h.closest('[data-chapter="hero"]');
    splitReveal(h, { immediate: !!hero, trigger: h.closest('.panel') });
  }
  revealPanels(sections);
}
