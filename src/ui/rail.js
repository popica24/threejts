// Kage-style progress rail: one marker per chapter, the current one highlighted.
import { chapterAt } from '../scroll/progress.js';

const LABELS = {
  hero: 'Răsărit', casa: 'Casa', montaj: 'Montaj', stocare: 'Stocare',
  scala: 'Proiecte', dece: 'De ce JTS', contact: 'Contact',
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
      fill.style.transform = `scaleY(${p})`;
      const id = chapterAt(p);
      if (id === current) return;
      current = id;
      for (const b of buttons) b.toggleAttribute('aria-current', b.dataset.chapter === id);
    },
  };
}
