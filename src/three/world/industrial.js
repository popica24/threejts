// Commercial & industrial: a flat-roof hall, a dome-roof hall (a nod to the shipyard) and a ground-mounted
// solar field whose rows rise out of the ground as the projects chapter scrolls.
import {
  Group, Mesh, BoxGeometry, CylinderGeometry, MeshStandardMaterial, InstancedMesh, Object3D, Matrix4, Quaternion,
  Vector3, Euler,
} from 'three';
import { CHAPTER_RANGES, local, easeInOut } from '../../scroll/progress.js';

const RISE = 0.07; // each row takes this much progress to rise

export function rowRise(row, p, rows) {
  const [a, b] = CHAPTER_RANGES.scala;
  const step = rows > 1 ? (b - a - RISE) / (rows - 1) : 0;
  const start = a + row * step;
  return easeInOut(local(p, [start, start + RISE]));
}

const PANEL = { w: 1.9, d: 1.15 };

function hallFlat(mats) {
  const g = new Group();
  const body = new Mesh(new BoxGeometry(34, 8, 20), mats.hall);
  body.position.y = 4;
  const band = new Mesh(new BoxGeometry(34.2, 1.2, 20.2), mats.accent);
  band.position.y = 6.8;
  const roof = new Mesh(new BoxGeometry(35, 0.4, 21), mats.roof);
  roof.position.y = 8.2;
  for (const m of [body, band, roof]) { m.castShadow = m.receiveShadow = true; g.add(m); }
  for (let k = 0; k < 4; k++) {
    const door = new Mesh(new BoxGeometry(4, 5, 0.2), mats.door);
    door.position.set(-12 + k * 8, 2.5, 10.05);
    g.add(door);
  }
  return g;
}

function hallDome(mats) {
  const g = new Group();
  const R = 10, L = 30;
  const vault = new Mesh(new CylinderGeometry(R, R, L, 40, 1, false, 0, Math.PI), mats.dome);
  vault.rotation.z = Math.PI / 2;
  vault.position.y = 2;
  vault.castShadow = vault.receiveShadow = true;
  const wall = new Mesh(new BoxGeometry(L, 2, R * 2), mats.hall);
  wall.position.y = 1;
  wall.castShadow = wall.receiveShadow = true;
  g.add(vault, wall);
  return g;
}

// Panel slots: [{pos, quat, row}] for each array; row is used for the staggered rise.
function fieldSlots(origin, rows, cols, tilt) {
  const out = [];
  const q = new Quaternion().setFromEuler(new Euler(tilt, 0, 0)); // faces +z, like the house roof
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({ pos: new Vector3(origin.x + c * (PANEL.w + 0.15), origin.y + 1.2, origin.z + r * 4.2), quat: q, row: r, ground: true });
    }
  }
  return out;
}

function flatRoofSlots(origin, rows, cols, rowOffset) {
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // East–west "tent" layout like the Auchan roofs: alternate panel tilt per column pair.
      const tilt = (c % 2 ? 1 : -1) * 0.18;
      out.push({
        pos: new Vector3(origin.x + c * (PANEL.d + 0.05), origin.y, origin.z + r * (PANEL.w + 0.3)),
        quat: new Quaternion().setFromEuler(new Euler(0, Math.PI / 2, tilt)),
        row: rowOffset + r,
      });
    }
  }
  return out;
}

function domeSlots(center, R, L, rowsAlong, ringCount, rowOffset) {
  const out = [];
  for (let i = 0; i < rowsAlong; i++) {
    for (let k = 0; k < ringCount; k++) {
      const a = -0.75 + (1.5 * k) / (ringCount - 1); // angle from the top of the vault
      const x = center.x - L / 2 + 2 + i * ((L - 4) / (rowsAlong - 1));
      out.push({
        pos: new Vector3(x, center.y + Math.cos(a) * (R + 0.12), center.z + Math.sin(a) * (R + 0.12)),
        quat: new Quaternion().setFromEuler(new Euler(a, 0, 0)),
        row: rowOffset + Math.floor(i / 2),
      });
    }
  }
  return out;
}

export function createIndustrial(scene, quality, panels) {
  const mats = {
    hall: new MeshStandardMaterial({ color: '#e6e8ea', roughness: 0.7 }),
    accent: new MeshStandardMaterial({ color: '#173b63', roughness: 0.6 }),
    roof: new MeshStandardMaterial({ color: '#9aa1a8', roughness: 0.8 }),
    dome: new MeshStandardMaterial({ color: '#c4c9ce', roughness: 0.5, metalness: 0.3 }),
    door: new MeshStandardMaterial({ color: '#7d8791', roughness: 0.6 }),
    post: new MeshStandardMaterial({ color: '#a3a9b0', metalness: 0.7, roughness: 0.4 }),
  };
  const g = new Group();

  const flat = hallFlat(mats);
  flat.position.set(78, 0, -12);
  const dome = hallDome(mats);
  dome.position.set(118, 0, -16);
  g.add(flat, dome);

  const hi = quality === 'high';
  const slots = [
    ...fieldSlots(new Vector3(66, 0, -78), hi ? 9 : 6, hi ? 30 : 20, 0.5),
    ...flatRoofSlots(new Vector3(78 - 15.5, 8.6, -12 - 8), 6, hi ? 26 : 18, 2),
    ...domeSlots(new Vector3(118, 2, -16), 10, 30, hi ? 10 : 6, hi ? 9 : 6, 4),
  ];
  const rows = Math.max(...slots.map((s) => s.row)) + 1;

  const geo = new BoxGeometry(PANEL.w, 0.05, PANEL.d);
  const field = new InstancedMesh(geo, panels.materials.list, slots.length);
  field.castShadow = hi;
  field.receiveShadow = true;

  // Posts for the ground-mounted rows
  const ground = slots.filter((s) => s.ground);
  const postGeo = new CylinderGeometry(0.06, 0.06, 1.4, 6);
  postGeo.translate(0, 0.7, 0);
  const posts = new InstancedMesh(postGeo, mats.post, ground.length);

  // Bounds are computed once, while every panel is still scaled to zero — never cull these.
  field.frustumCulled = false;
  posts.frustumCulled = false;
  g.add(field, posts);
  scene.add(g);

  const m = new Matrix4(), s = new Vector3(), pos = new Vector3(), o = new Object3D();
  let last = -1;

  function layout(p) {
    let gi = 0;
    slots.forEach((slot, i) => {
      const k = rowRise(slot.row, p, rows);
      const sc = Math.max(k, 0.0001);
      pos.copy(slot.pos);
      pos.y -= (1 - k) * (slot.ground ? 1.6 : 0.8);
      m.compose(pos, slot.quat, s.set(sc, sc, sc));
      field.setMatrixAt(i, m);
      if (slot.ground) {
        o.position.set(slot.pos.x, -1.4 * (1 - k), slot.pos.z + 0.25);
        o.scale.set(1, Math.max(k, 0.0001), 1);
        o.updateMatrix();
        posts.setMatrixAt(gi++, o.matrix);
      }
    });
    field.instanceMatrix.needsUpdate = true;
    posts.instanceMatrix.needsUpdate = true;
  }

  return {
    update(p) {
      // Only re-layout while the rise is in progress (or on the first frame / a jump).
      const key = Math.round(p * 2000);
      if (key === last) return;
      last = key;
      layout(p);
    },
    dispose() {
      scene.remove(g);
      g.traverse((x) => { if (x.geometry && x.geometry !== geo) x.geometry.dispose(); });
      geo.dispose();
      for (const mat of Object.values(mats)) mat.dispose();
    },
  };
}
