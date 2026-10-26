import './styles/base.css';
import './styles/chapters.css';
import './styles/ui.css';
import content from './content.js';
import { CREDIT } from './config.js';
import { renderChapters } from './dom/chapters.js';
import { createLoader } from './ui/loader.js';
import { createRail } from './ui/rail.js';
import { createScroller } from './scroll/scroller.js';
import { CHAPTER_RANGES, local } from './scroll/progress.js';

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
    const k = local(p, CHAPTER_RANGES.montaj) * steps.length;
    steps.forEach((el, i) => {
      el.classList.toggle('is-active', k >= i && k < i + 1);
      el.classList.toggle('is-past', k >= i + 1);
    });
  },
});
rail = createRail(document.getElementById('rail'), scroller);
rail.update(state.p);
window.__story = state; // dev inspection

loader.setProgress(1);
loader.done();
