// Custom cursor: a lerped dot that grows (and can show a label) over interactive things.

export function interactionsEnabled() {
  const mq = (q) => window.matchMedia?.(q).matches ?? false;
  return !mq('(pointer: coarse)') && !mq('(prefers-reduced-motion: reduce)');
}

const HOVER = 'a, button, .card, .tile, [data-magnetic], [data-cursor]';

export function initCursor(el) {
  if (!el || !interactionsEnabled()) return;
  document.documentElement.classList.add('has-cursor');
  const label = el.querySelector('.cursor__label');
  const pos = { x: innerWidth / 2, y: innerHeight / 2 }, cur = { ...pos };

  addEventListener('pointermove', (e) => {
    pos.x = e.clientX; pos.y = e.clientY;
    el.classList.add('is-visible');
  }, { passive: true });
  document.addEventListener('pointerleave', () => el.classList.remove('is-visible'));
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest?.(HOVER);
    el.classList.toggle('is-hover', !!t);
    const text = t?.dataset.cursor ?? '';
    el.classList.toggle('has-label', !!text);
    if (label) label.textContent = text;
  });
  document.addEventListener('pointerdown', () => el.classList.add('is-down'));
  document.addEventListener('pointerup', () => el.classList.remove('is-down'));

  (function tick() {
    cur.x += (pos.x - cur.x) * 0.2;
    cur.y += (pos.y - cur.y) * 0.2;
    el.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0)`;
    requestAnimationFrame(tick);
  })();
}
