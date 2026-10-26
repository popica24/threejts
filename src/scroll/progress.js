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
