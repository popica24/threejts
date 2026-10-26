// Photo cards tilt towards the pointer in 3D.
import { interactionsEnabled } from './cursor.js';

export function initTilt(selector = '.card', maxDeg = 8) {
  if (!interactionsEnabled()) return;
  for (const el of document.querySelectorAll(selector)) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty('--rx', `${(-y * maxDeg).toFixed(2)}deg`);
      el.style.setProperty('--ry', `${(x * maxDeg).toFixed(2)}deg`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  }
}
