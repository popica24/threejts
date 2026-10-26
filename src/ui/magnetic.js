// Buttons and links that lean towards the pointer.
import { interactionsEnabled } from './cursor.js';

export function initMagnetic(selector = '[data-magnetic]', strength = 0.35) {
  if (!interactionsEnabled()) return;
  for (const el of document.querySelectorAll(selector)) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${(e.clientX - (r.left + r.width / 2)) * strength}px`);
      el.style.setProperty('--my', `${(e.clientY - (r.top + r.height / 2)) * strength}px`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
    });
  }
}
