// Pitch credit shown in the footer — fill in or set name to '' to hide.
export const CREDIT = { name: '[Numele tău]', url: '' };

export function detectQuality() {
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;
  const weakCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
  return coarse || weakCpu || window.innerWidth < 768 ? 'low' : 'high';
}
