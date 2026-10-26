// Pure scroll maths. The whole 3D story is a function of one progress value p ∈ [0, 1].

export const CHAPTER_RANGES = {
  hero: [0, 0.1],
  casa: [0.1, 0.22],
  montaj: [0.22, 0.5],
  stocare: [0.5, 0.62],
  scala: [0.62, 0.78],
  dece: [0.78, 0.88],
  contact: [0.88, 1],
};

// Slice of progress during which the crew mounts the panels (inside 'montaj').
export const PANEL_WINDOW = [0.28, 0.46];

const IDS = Object.keys(CHAPTER_RANGES);
const RANGES = Object.values(CHAPTER_RANGES);

export const clamp01 = (v) => Math.min(Math.max(v, 0), 1);

export function local(p, [a, b]) {
  return clamp01((p - a) / (b - a));
}

export function easeInOut(t) {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export function chapterAt(p) {
  const i = RANGES.findIndex(([, b]) => p < b);
  return IDS[i === -1 ? IDS.length - 1 : i];
}

// Maps scrollY to p so each chapter's DOM section spans exactly its CHAPTER_RANGES slot,
// whatever the section heights. `tops` are section offsets (one per chapter), `max` the max scroll.
export function progressFromLayout(y, tops, max) {
  const ends = [...tops.slice(1), max];
  let i = tops.length - 1;
  while (i > 0 && y < tops[i]) i--;
  const span = Math.max(ends[i] - tops[i], 1);
  const [a, b] = RANGES[i];
  return a + (b - a) * clamp01((y - tops[i]) / span);
}

// Inverse of progressFromLayout: the scroll position that shows progress p.
export function scrollForProgress(p, tops, max) {
  const x = clamp01(p);
  let i = RANGES.findIndex(([, b]) => x < b);
  if (i === -1) i = RANGES.length - 1;
  const [a, b] = RANGES[i];
  const end = i < tops.length - 1 ? tops[i + 1] : max;
  return tops[i] + (end - tops[i]) * ((x - a) / (b - a));
}

// Which of the 5 process steps is lit: calculate/offer before the crew starts,
// "Montăm" while panels go up, commission/prosumer once the roof is done.
export function activeStep(p) {
  const [m0, m1] = CHAPTER_RANGES.montaj;
  const [a, b] = PANEL_WINDOW;
  if (p < a) return local(p, [m0, a]) < 0.5 ? 0 : 1;
  if (p < b) return 2;
  return local(p, [b, m1]) < 0.5 ? 3 : 4;
}
