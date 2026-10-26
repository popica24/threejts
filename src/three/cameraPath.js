// Camera choreography: keyframes along a Catmull-Rom curve, sampled purely by scroll progress.
// World layout: house at the origin (roof slope faces +z), hills to −z, industrial site at x≈60…140.
import { CatmullRomCurve3, Vector3 } from 'three';
import { clamp01, easeInOut } from '../scroll/progress.js';

export const CAMERA_KEYS = [
  { p: 0.0, pos: [6, 26, 78], look: [22, 24, -140] }, // dawn over the hills
  { p: 0.1, pos: [26, 13, 38], look: [0, 4, 0] },      // glide down to the house
  { p: 0.22, pos: [27, 9, 31], look: [-2, 3.5, 3] },   // the crew arrives
  { p: 0.36, pos: [18, 13.5, 25], look: [-4, 4.5, 1] }, // panels going up
  { p: 0.5, pos: [8, 12, 26], look: [-2, 4.5, 0] },    // finished roof
  { p: 0.56, pos: [-17, 5, 13], look: [-3, 3, 0] },    // inverter + battery wall
  { p: 0.62, pos: [-6, 22, 46], look: [30, 2, -20] },  // rising up
  { p: 0.7, pos: [48, 34, 46], look: [100, 0, -40] },  // commercial & industrial
  { p: 0.8, pos: [70, 52, 80], look: [70, 0, -30] },   // wide over everything
  { p: 0.88, pos: [40, 22, 64], look: [10, 6, 0] },    // drifting back home
  { p: 1.0, pos: [24, 8, 33], look: [-7, 5.5, 2] },    // golden finale
];

const curve = new CatmullRomCurve3(CAMERA_KEYS.map((k) => new Vector3(...k.pos)), false, 'centripetal');
const N = CAMERA_KEYS.length - 1;

// Key i sits at curve parameter i/N; map p → u piecewise so keys land on their p.
function curveParam(p) {
  let i = 0;
  while (i < N - 1 && p > CAMERA_KEYS[i + 1].p) i++;
  const a = CAMERA_KEYS[i].p, b = CAMERA_KEYS[i + 1].p;
  return { i, t: easeInOut((p - a) / (b - a)) };
}

export function sampleCamera(p, out = { pos: new Vector3(), look: new Vector3() }) {
  const { i, t } = curveParam(clamp01(p));
  curve.getPoint((i + t) / N, out.pos);
  const A = CAMERA_KEYS[i].look, B = CAMERA_KEYS[i + 1].look;
  out.look.set(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  return out;
}
