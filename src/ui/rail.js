// Kage-style progress rail: one marker per chapter, the current one highlighted.
import { chapterAt } from '../scroll/progress.js';

const LABELS = {
  hero: 'Răsărit', casa: 'Rezidențial', montaj: 'Montăm', stocare: 'Stocare',
  scala: 'Proiecte', dece: 'De ce JTS SOLAR', contact: 'Contact',
};

export function createRail(el, scroller) {
  const fill = document.createElement('span');
  fill.className = 'rail__fill';
  const buttons = Object.entries(LABELS).map(([id, label]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rail__mark';
    b.dataset.chapter = id;
    b.innerHTML = `<span class="rail__label">${label}</span>`;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => scroller.scrollToChapter(id));
    return b;
  });
  el.append(fill, ...buttons);

  let current = null;
  return {
    update(p) {
      el.style.setProperty('--p', p.toFixed(4));
      const id = chapterAt(p);
      if (id === current) return;
      current = id;
      for (const b of buttons) b.toggleAttribute('aria-current', b.dataset.chapter === id);
    },
  };
}
