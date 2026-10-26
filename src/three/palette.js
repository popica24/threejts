// Time of day as a pure function of scroll: dawn → midday → golden hour.
import { clamp01, easeInOut } from '../scroll/progress.js';

const KEYS = [
  { p: 0.0, sky: ['#2f4f80', '#f7b29b'], sun: '#ffc89a', fog: '#e8b7a8', sunElevation: 2, sunAzimuth: 24, exposure: 0.92 },
  { p: 0.16, sky: ['#3f74b4', '#f6d3b6'], sun: '#ffdcaa', fog: '#dcd9dc', sunElevation: 22, sunAzimuth: 20, exposure: 1.0 },
  { p: 0.36, sky: ['#2b6fc4', '#bfe0f6'], sun: '#fff4dc', fog: '#cfe2f1', sunElevation: 55, sunAzimuth: 15, exposure: 1.05 },
  { p: 0.62, sky: ['#3378c8', '#d3e6f3'], sun: '#fff1d2', fog: '#d4e4ef', sunElevation: 44, sunAzimuth: 35, exposure: 1.05 },
  { p: 0.8, sky: ['#4670b0', '#f3d2a2'], sun: '#ffd28a', fog: '#e6d2b8', sunElevation: 22, sunAzimuth: 50, exposure: 1.0 },
  { p: 1.0, sky: ['#36457c', '#ffab66'], sun: '#ffa94f', fog: '#eeb48a', sunElevation: 7, sunAzimuth: 62, exposure: 0.98 },
];

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const rgbToHex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const mixHex = (a, b, t) => {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A.map((v, i) => v + (B[i] - v) * t));
};
const mix = (a, b, t) => a + (b - a) * t;

export function paletteAt(p) {
  const x = clamp01(p);
  let i = 0;
  while (i < KEYS.length - 2 && x > KEYS[i + 1].p) i++;
  const A = KEYS[i], B = KEYS[i + 1];
  const t = easeInOut((x - A.p) / (B.p - A.p));
  return {
    sky: [mixHex(A.sky[0], B.sky[0], t), mixHex(A.sky[1], B.sky[1], t)],
    sun: mixHex(A.sun, B.sun, t),
    fog: mixHex(A.fog, B.fog, t),
    sunElevation: mix(A.sunElevation, B.sunElevation, t),
    sunAzimuth: mix(A.sunAzimuth, B.sunAzimuth, t),
    exposure: mix(A.exposure, B.exposure, t),
  };
}
