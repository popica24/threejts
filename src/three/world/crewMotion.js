// Pure choreography for the JTS installer crew: poses and who is where, as a function of scroll progress.
import { local, easeInOut, clamp01 } from '../../scroll/progress.js';
import { panelWindow, PANEL_WINDOW } from './panelLayout.js';
import { roofFrame } from './house.js';

export const CREW_SIZE = 4;

// ---------------------------------------------------------------- poses

const TAU = Math.PI * 2;

// Angles in radians. Shoulder/hip negative = forward/up; knee/elbow positive = bend.
export function pose(kind, t) {
  const s = Math.sin(TAU * t), c = Math.cos(TAU * t);
  const base = { hipY: 0, torsoPitch: 0, armL: [0.08, 0.1], armR: [0.08, 0.1], legL: [0, 0], legR: [0, 0], head: 0 };
  switch (kind) {
    case 'walk':
      return {
        ...base,
        hipY: 0.04 * Math.abs(c),
        torsoPitch: 0.05,
        legL: [0.5 * s, 0.6 * Math.max(0, -c)],
        legR: [-0.5 * s, 0.6 * Math.max(0, c)],
        armL: [-0.45 * s, 0.35],
        armR: [0.45 * s, 0.35],
      };
    case 'carry':
      return {
        ...pose('walk', t),
        torsoPitch: -0.04,
        armL: [-2.75, 0.35],
        armR: [-2.75, 0.35],
      };
    case 'climb':
      return {
        ...base,
        hipY: 0.05 * s,
        legL: [-0.9 + 0.5 * s, 1.2 - 0.4 * s],
        legR: [-0.9 - 0.5 * s, 1.2 + 0.4 * s],
        armL: [-2.75, 0.35],
        armR: [-2.75, 0.35],
      };
    case 'place': {
      const k = clamp01(t);
      return {
        ...base,
        hipY: -0.18 * k,
        torsoPitch: 0.55 * k,
        legL: [-0.5 * k, 0.9 * k],
        legR: [-0.2 * k, 0.6 * k],
        armL: [-2.75 + 1.45 * k, 0.35 - 0.2 * k],
        armR: [-2.75 + 1.45 * k, 0.35 - 0.2 * k],
      };
    }
    case 'wave':
      return { ...base, armR: [-2.9, 0.55 + 0.45 * s], armL: [0.1, 0.15], head: 0.15 * s };
    case 'idle':
    default:
      return { ...base, hipY: 0.008 * s, armL: [0.06 + 0.02 * s, 0.12], armR: [0.06 - 0.02 * s, 0.12], head: 0.06 * Math.sin(TAU * t * 0.37) };
  }
}

// ---------------------------------------------------------------- site

const v3 = (v) => [v.x, v.y, v.z];
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
const yawTo = (a, b) => Math.atan2(b[0] - a[0], b[2] - a[2]);

function defaultSite() {
  const roof = roofFrame();
  const ladderX = 5.9;
  const eave = [ladderX, roof.eave.y + 0.05, roof.eave.z + 0.2];
  return {
    pallet: [9.2, 0, 7.6],
    homes: [[-1.4, 0, 0.9], [1.2, 0, 1.3], [0.3, 0, -1.4], [-1.9, 0, -0.7]],
    ladderBase: [ladderX, 0, roof.eave.z + 1.7],
    ladderTop: eave,
    roofEntry: v3(roof.origin.clone().addScaledVector(roof.right, 10.4 + 0.6).addScaledVector(roof.down, roof.height - 0.2)),
    roof,
    finale: [[2.6, 0, 8.2], [5.2, 0, 7.4]],
    camera: [20, 9, 36],
  };
}
const SITE = defaultSite();

// Where the installer stands to set panel i down: just down-slope of the slot, on the roof plane.
function standPoint(slot, roof) {
  const rh = roof.height / 3;
  return [0, 1, 2].map((k) => slot.pos[k] + ['x', 'y', 'z'].map((a) => roof.down[a])[k] * rh * 0.62);
}

// ---------------------------------------------------------------- choreography

const STRIDE = 1.25;

// Move along a polyline; returns position, facing and a walk-cycle phase from distance travelled.
function along(points, u) {
  const lens = points.slice(1).map((p, i) => dist(points[i], p));
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  let d = clamp01(u) * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const t = lens[i] ? Math.min(d / lens[i], 1) : 1;
      return { pos: lerp3(points[i], points[i + 1], t), yaw: yawTo(points[i], points[i + 1]), phase: (clamp01(u) * total) / STRIDE };
    }
    d -= lens[i];
  }
  return { pos: points.at(-1), yaw: 0, phase: 0 };
}

// Panel i is carried during [a − 2w, b]; the return trip takes the following w.
function spans(i, n) {
  const [a, b] = panelWindow(i, n);
  const w = b - a;
  return { carry: [a - 2 * w, b], back: [b, b + w] };
}

function homeOf(k, site) {
  const h = site.homes[k];
  return [site.pallet[0] + h[0], 0, site.pallet[2] + h[2]];
}

function idle(k, p, site, kind = 'idle') {
  const pos = homeOf(k, site);
  const facing = kind === 'wave' ? yawTo(pos, site.camera) : yawTo(pos, [0, 0, 0]);
  return { id: k, pos, yaw: facing, kind, t: p * 40 + k * 0.31, carrying: null, place: 0 };
}

function carrying(k, i, u, slots, site) {
  const home = homeOf(k, site);
  const stand = standPoint(slots[i], site.roof);
  if (u < 0.35) {
    const m = along([home, site.ladderBase], u / 0.35);
    return { id: k, pos: m.pos, yaw: m.yaw, kind: 'carry', t: m.phase, carrying: i, place: 0 };
  }
  if (u < 0.55) {
    const f = (u - 0.35) / 0.2;
    return { id: k, pos: lerp3(site.ladderBase, site.ladderTop, f), yaw: Math.PI, kind: 'climb', t: f * 3, carrying: i, place: 0 };
  }
  if (u < 0.82) {
    const m = along([site.ladderTop, site.roofEntry, stand], (u - 0.55) / 0.27);
    return { id: k, pos: m.pos, yaw: m.yaw, kind: 'carry', t: m.phase, carrying: i, place: 0 };
  }
  const f = easeInOut((u - 0.82) / 0.18);
  return { id: k, pos: stand, yaw: Math.PI, kind: 'place', t: f, carrying: i, place: f };
}

function returning(k, i, u, slots, site) {
  const stand = standPoint(slots[i], site.roof);
  if (u < 0.35) {
    const m = along([stand, site.roofEntry, site.ladderTop], u / 0.35);
    return { id: k, pos: m.pos, yaw: m.yaw, kind: 'walk', t: m.phase, carrying: null, place: 0 };
  }
  if (u < 0.6) {
    const f = (u - 0.35) / 0.25;
    return { id: k, pos: lerp3(site.ladderTop, site.ladderBase, f), yaw: Math.PI, kind: 'climb', t: -f * 3, carrying: null, place: 0 };
  }
  const m = along([site.ladderBase, homeOf(k, site)], (u - 0.6) / 0.4);
  return { id: k, pos: m.pos, yaw: m.yaw, kind: 'walk', t: m.phase, carrying: null, place: 0 };
}

export function crewPlan(p, slots, site = SITE) {
  const n = slots.length;
  const done = PANEL_WINDOW[1];
  return Array.from({ length: CREW_SIZE }, (_, k) => {
    // Installer k mounts panels k, k+4, k+8…
    for (let i = k; i < n; i += CREW_SIZE) {
      const { carry, back } = spans(i, n);
      if (p >= carry[0] && p < carry[1]) return carrying(k, i, local(p, carry), slots, site);
      if (p >= back[0] && p < back[1]) return returning(k, i, local(p, back), slots, site);
    }
    if (p >= done && p < done + 0.04) return idle(k, p, site, 'wave');
    return idle(k, p, site);
  });
}

// How many panels are still on the pallet at progress p.
export function palletCount(p, n) {
  let left = n;
  for (let i = 0; i < n; i++) if (p >= spans(i, n).carry[0]) left--;
  return left;
}

export { SITE };
