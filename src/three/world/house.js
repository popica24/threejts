// The family house from panou-pe-casa.webp: white walls, terracotta gable roof, wooden balcony, chimney, hedge.
import {
  Group, Mesh, BoxGeometry, MeshStandardMaterial, CanvasTexture, RepeatWrapping, SRGBColorSpace, Shape, ExtrudeGeometry,
  Vector3, CylinderGeometry, CircleGeometry, Color,
} from 'three';

export const HOUSE = { w: 12, d: 8, wallH: 4.2, rise: 3.4, overhang: 0.7 };
const PITCH = Math.atan2(HOUSE.rise, HOUSE.d / 2);
const RIDGE_Y = HOUSE.wallH + HOUSE.rise;

function tileTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#a9472a';
  g.fillRect(0, 0, 256, 256);
  const rows = 8, cols = 8;
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const x = k * 32, y = r * 32;
      const grad = g.createLinearGradient(x, 0, x + 32, 0);
      const base = 150 + ((r * 7 + k * 13) % 5) * 9;
      grad.addColorStop(0, `rgb(${base - 30},${58},${36})`);
      grad.addColorStop(0.5, `rgb(${base + 28},${86},${52})`);
      grad.addColorStop(1, `rgb(${base - 34},${54},${34})`);
      g.fillStyle = grad;
      g.fillRect(x + 1, y + 2, 31, 28);
    }
    g.fillStyle = 'rgba(40,14,8,0.55)';
    g.fillRect(0, r * 32 + 28, 256, 4);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

const mats = () => ({
  wall: new MeshStandardMaterial({ color: '#f3efe6', roughness: 0.92 }),
  plinth: new MeshStandardMaterial({ color: '#b9b2a6', roughness: 1 }),
  roof: new MeshStandardMaterial({ map: tileTexture(), roughness: 0.8 }),
  roofEdge: new MeshStandardMaterial({ color: '#7d3520', roughness: 0.9 }),
  wood: new MeshStandardMaterial({ color: '#8a5a32', roughness: 0.75 }),
  woodDark: new MeshStandardMaterial({ color: '#5e3a20', roughness: 0.8 }),
  glass: new MeshStandardMaterial({ color: '#2b3e57', roughness: 0.15, metalness: 0.3, emissive: new Color('#ffb35c'), emissiveIntensity: 0 }),
  metal: new MeshStandardMaterial({ color: '#7b6f66', roughness: 0.6, metalness: 0.4 }),
  hedge: new MeshStandardMaterial({ color: '#557f30', roughness: 1, flatShading: true }),
  yard: new MeshStandardMaterial({ color: '#8fae5a', roughness: 1 }),
  stone: new MeshStandardMaterial({ color: '#cfc6b6', roughness: 1 }),
});

function box(w, h, d, mat, x, y, z) {
  const m = new Mesh(new BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  return m;
}

function windowAt(group, m, { x, y, z, w = 1.2, h = 1.4, face = 'z' }) {
  const frame = face === 'z' ? box(w + 0.22, h + 0.22, 0.14, m.wood, x, y, z) : box(0.14, h + 0.22, w + 0.22, m.wood, x, y, z);
  const glass = face === 'z' ? box(w, h, 0.16, m.glass, x, y, z) : box(0.16, h, w, m.glass, x, y, z);
  const sill = face === 'z' ? box(w + 0.4, 0.08, 0.3, m.plinth, x, y - h / 2 - 0.15, z + Math.sign(z) * 0.1) : box(0.3, 0.08, w + 0.4, m.plinth, x + Math.sign(x) * 0.1, y - h / 2 - 0.15, z);
  group.add(frame, glass, sill);
}

export function createHouse(scene) {
  const m = mats();
  const g = new Group();
  const { w, d, wallH, rise, overhang } = HOUSE;

  // Walls + plinth
  g.add(box(w, wallH, d, m.wall, 0, wallH / 2, 0));
  g.add(box(w + 0.1, 0.45, d + 0.1, m.plinth, 0, 0.22, 0));

  // Attic prism (gables), tucked just under the roof slabs to avoid z-fighting.
  const tuck = 0.3;
  const tri = new Shape();
  tri.moveTo(-d / 2, 0); tri.lineTo(d / 2, 0); tri.lineTo(0, rise - tuck); tri.closePath();
  const attic = new Mesh(new ExtrudeGeometry(tri, { depth: w, bevelEnabled: false }), m.wall);
  attic.geometry.rotateY(Math.PI / 2);
  attic.position.set(-w / 2, wallH, 0);
  attic.castShadow = attic.receiveShadow = true;
  g.add(attic);

  // Roof slabs: top surface passes exactly through the ridge → eave line.
  const slopeLen = Math.hypot(d / 2, rise) + overhang;
  const roofW = w + overhang * 2;
  const tex = m.roof.map;
  tex.repeat.set(roofW / 1.6, slopeLen / 1.4);
  const slabs = [1, -1].map((side) => {
    const slab = box(roofW, 0.26, slopeLen, m.roof, 0, 0, 0);
    const dir = new Vector3(0, -Math.sin(PITCH), side * Math.cos(PITCH));
    const n = new Vector3(0, Math.cos(PITCH), side * Math.sin(PITCH));
    slab.position.set(0, RIDGE_Y, 0).addScaledVector(dir, slopeLen / 2).addScaledVector(n, -0.13);
    slab.rotation.x = side * PITCH;
    return slab;
  });
  g.add(...slabs);
  const ridgeCap = new Mesh(new CylinderGeometry(0.22, 0.22, roofW, 8), m.roofEdge);
  ridgeCap.rotation.z = Math.PI / 2;
  ridgeCap.position.set(0, RIDGE_Y + 0.05, 0);
  g.add(ridgeCap);

  // Gutter along the front eave
  const eave = new Vector3(0, RIDGE_Y, 0).addScaledVector(new Vector3(0, -Math.sin(PITCH), Math.cos(PITCH)), slopeLen);
  const gutter = new Mesh(new CylinderGeometry(0.12, 0.12, roofW, 8), m.metal);
  gutter.rotation.z = Math.PI / 2;
  gutter.position.copy(eave).add(new Vector3(0, -0.15, 0.08));
  g.add(gutter);

  // Chimney (back slope, like the photo)
  g.add(box(0.9, 3.2, 0.9, m.metal, 2.6, RIDGE_Y + 0.2, -1.4));
  g.add(box(1.2, 0.15, 1.2, m.woodDark, 2.6, RIDGE_Y + 1.85, -1.4));

  // Front: door + windows
  g.add(box(1.2, 2.3, 0.16, m.woodDark, -1.2, 1.4, d / 2));
  windowAt(g, m, { x: -4, y: 2.2, z: d / 2 });
  windowAt(g, m, { x: 1.6, y: 2.2, z: d / 2 });
  windowAt(g, m, { x: 4.2, y: 2.2, z: d / 2 });
  // Sides + gable window
  windowAt(g, m, { x: w / 2, y: 2.2, z: -1.8, face: 'x' });
  windowAt(g, m, { x: w / 2, y: 2.2, z: 1.8, face: 'x' });
  windowAt(g, m, { x: w / 2, y: wallH + 1.2, z: 0, w: 1, h: 1.1, face: 'x' });
  windowAt(g, m, { x: -w / 2, y: 2.2, z: 2.2, face: 'x' });

  // Wooden balcony on the +x gable
  const bx = w / 2 + 0.85;
  g.add(box(1.7, 0.22, 5.4, m.wood, bx, wallH - 0.05, 0));
  for (let k = 0; k < 13; k++) g.add(box(0.08, 1.0, 0.18, m.wood, bx + 0.8, wallH + 0.5, -2.6 + k * 0.43));
  g.add(box(0.12, 0.12, 5.4, m.woodDark, bx + 0.8, wallH + 1.02, 0));
  g.add(box(1.7, 0.12, 0.12, m.woodDark, bx, wallH + 1.02, 2.7));
  g.add(box(1.7, 0.12, 0.12, m.woodDark, bx, wallH + 1.02, -2.7));
  for (const z of [-2.6, 2.6]) g.add(box(0.18, wallH - 0.2, 0.18, m.woodDark, bx + 0.75, (wallH - 0.2) / 2, z));

  // Yard, path and hedge
  const yard = new Mesh(new CircleGeometry(24, 48), m.yard);
  yard.rotation.x = -Math.PI / 2;
  yard.position.y = 0.02;
  yard.receiveShadow = true;
  g.add(yard);
  for (let k = 0; k < 6; k++) g.add(box(1.3, 0.06, 0.9, m.stone, -1.2, 0.05, d / 2 + 1.2 + k * 1.15));
  g.add(box(10, 1.4, 1.1, m.hedge, -7.6, 0.7, 11.5));
  g.add(box(10, 1.4, 1.1, m.hedge, 5.2, 0.7, 11.5));

  scene.add(g);

  // Front roof slope frame for the panels (surface plane, slightly above the tiles).
  const right = new Vector3(1, 0, 0);
  const down = new Vector3(0, -Math.sin(PITCH), Math.cos(PITCH));
  const normal = new Vector3(0, Math.cos(PITCH), Math.sin(PITCH));
  const roof = {
    origin: new Vector3(-5.2, RIDGE_Y, 0).addScaledVector(down, 0.45).addScaledVector(normal, 0.16),
    right, down, normal,
    width: 10.4,
    height: Math.hypot(d / 2, rise) - 0.45,
    eave: eave.clone(),
    pitch: PITCH,
  };

  return {
    group: g,
    roof,
    windows: m.glass,
    update() {},
    dispose() {
      scene.remove(g);
      g.traverse((o) => o.geometry?.dispose());
      for (const mat of Object.values(m)) { mat.map?.dispose(); mat.dispose(); }
    },
  };
}
