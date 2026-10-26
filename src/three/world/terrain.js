// Rolling Argeș-style hills, layered distant ridges that melt into fog, and instanced low-poly trees.
import {
  PlaneGeometry, Mesh, MeshStandardMaterial, MeshLambertMaterial, InstancedMesh, ConeGeometry, CylinderGeometry,
  IcosahedronGeometry, Object3D, Color, BufferAttribute,
} from 'three';

export function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (a, b, x) => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t); };

// 0 inside the flat building zones (house yard, industrial site), 1 in open country.
export function wildness(x, z) {
  const house = smooth(26, 46, Math.hypot(x, z * 1.1));
  const dx = Math.max(52 - x, 0, x - 152), dz = Math.max(-104 - z, 0, z - 14);
  const industrial = smooth(4, 26, Math.hypot(dx, dz));
  return Math.min(house, industrial);
}

export function groundHeight(x, z) {
  const rolling = 2.6 * Math.sin(x * 0.031) * Math.cos(z * 0.027) + 1.6 * Math.sin(x * 0.07 + 1.3) * Math.sin(z * 0.052);
  const r = Math.hypot(x, z);
  const hills = smooth(70, 420, r) * (28 + 22 * Math.sin(x * 0.011 + z * 0.006) + 10 * Math.sin(x * 0.023 - z * 0.017));
  return wildness(x, z) * (rolling + 1.5 + hills);
}

function ground() {
  const geo = new PlaneGeometry(1800, 1800, 240, 240);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const a = new Color('#7aa04a'), b = new Color('#4f7a35'), c = new Color('#a8b061'), tmp = new Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = groundHeight(x, z);
    pos.setY(i, y);
    const n = 0.5 + 0.5 * Math.sin(x * 0.09 + Math.sin(z * 0.05) * 2) * Math.cos(z * 0.08);
    tmp.copy(a).lerp(b, n).lerp(c, Math.min(Math.max((y - 18) / 40, 0), 0.6));
    colors.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  geo.setAttribute('color', new BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new Mesh(geo, new MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  mesh.receiveShadow = true;
  return mesh;
}

function ridges() {
  const out = [];
  const layers = [
    { z: -520, base: 6, amp: 42, color: '#3e5f52' },
    { z: -760, base: 24, amp: 70, color: '#4c6a73' },
    { z: -1050, base: 50, amp: 105, color: '#61788c' },
  ];
  layers.forEach((L, k) => {
    const geo = new PlaneGeometry(3600, 400, 220, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      if (pos.getY(i) > 0) {
        const y = L.base + L.amp * (0.55 + 0.25 * Math.sin(x * 0.004 + k) + 0.15 * Math.sin(x * 0.013 + k * 2.1) + 0.05 * Math.sin(x * 0.041));
        pos.setY(i, y);
      } else pos.setY(i, -60);
    }
    geo.computeVertexNormals();
    const m = new Mesh(geo, new MeshLambertMaterial({ color: L.color, flatShading: true }));
    m.position.z = L.z;
    out.push(m);
  });
  return out;
}

function trees(quality) {
  const count = quality === 'high' ? 340 : 130;
  const rand = rng(7);
  const foliageGeo = new ConeGeometry(1.7, 5, 7);
  foliageGeo.translate(0, 3.6, 0);
  const roundGeo = new IcosahedronGeometry(2.1, 0);
  roundGeo.translate(0, 3.4, 0);
  const trunkGeo = new CylinderGeometry(0.18, 0.28, 1.6, 5);
  trunkGeo.translate(0, 0.8, 0);

  const pines = new InstancedMesh(foliageGeo, new MeshStandardMaterial({ color: '#2f5a33', flatShading: true, roughness: 0.9 }), count);
  const rounds = new InstancedMesh(roundGeo, new MeshStandardMaterial({ color: '#5d8a3a', flatShading: true, roughness: 0.9 }), count);
  const trunks = new InstancedMesh(trunkGeo, new MeshStandardMaterial({ color: '#6b4a32', roughness: 1 }), count * 2);
  const o = new Object3D();
  let np = 0, nr = 0, nt = 0;

  const place = (x, z, s) => {
    const y = groundHeight(x, z);
    o.position.set(x, y - 0.1, z);
    o.rotation.set(0, rand() * Math.PI * 2, 0);
    o.scale.setScalar(s);
    o.updateMatrix();
    if (rand() < 0.55) pines.setMatrixAt(np++, o.matrix); else rounds.setMatrixAt(nr++, o.matrix);
    trunks.setMatrixAt(nt++, o.matrix);
  };

  // A few framing trees behind and beside the house.
  for (const [x, z, s] of [[-16, -12, 1.4], [-21, -4, 1.1], [14, -15, 1.25], [19, -8, 0.95], [-12, -19, 1.2], [5, -22, 1.3], [-24, 8, 1]]) place(x, z, s);
  let guard = 0;
  while (np + nr < count && guard++ < count * 20) {
    const ang = rand() * Math.PI * 2;
    const r = 34 + Math.pow(rand(), 0.7) * 380;
    const x = Math.cos(ang) * r, z = Math.sin(ang) * r - 60;
    if (wildness(x, z) < 0.9) continue;
    if (z > 30 && Math.abs(x) < 70) continue; // keep the camera's foreground open
    place(x, z, 0.8 + rand() * 0.9);
  }
  pines.count = np; rounds.count = nr; trunks.count = nt;
  for (const m of [pines, rounds, trunks]) { m.castShadow = true; m.receiveShadow = true; }
  return [pines, rounds, trunks];
}

export function createTerrain(scene, quality) {
  const objects = [ground(), ...ridges(), ...trees(quality)];
  scene.add(...objects);
  return {
    update() {},
    dispose() {
      for (const o of objects) { scene.remove(o); o.geometry.dispose(); o.material.dispose(); }
    },
  };
}
