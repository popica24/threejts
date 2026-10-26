// Pitch credit in the footer ("Concept by …"). Empty name = hidden; the demo shows only JTS copy.
export const CREDIT = { name: '', url: '' };

export function detectQuality() {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const weakCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
  return coarse || weakCpu || window.innerWidth < 768 ? 'low' : 'high';
}
