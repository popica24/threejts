// Pure layout + schedule for the rooftop panels.
import { easeInOut, local, PANEL_WINDOW } from '../../scroll/progress.js';

export { PANEL_WINDOW };

// Slot centres on the roof plane; bottom row first, each row left → right.
export function roofSlots(cols, rows, roof) {
  const cw = roof.width / cols, rh = roof.height / rows;
  const slots = [];
  for (let r = rows - 1; r >= 0; r--) {
    for (let c = 0; c < cols; c++) {
      const a = (c + 0.5) * cw, b = (r + 0.5) * rh;
      slots.push({
        i: slots.length,
        pos: ['x', 'y', 'z'].map((k) => roof.origin[k] + roof.right[k] * a + roof.down[k] * b),
      });
    }
  }
  return slots;
}

// The progress sub-window in which panel i is carried up and set down.
export function panelWindow(i, n) {
  const [a, b] = PANEL_WINDOW;
  const w = (b - a) / n;
  return [a + i * w, a + (i + 1) * w];
}

export function panelState(i, p, n) {
  return { placed: easeInOut(local(p, panelWindow(i, n))) };
}
