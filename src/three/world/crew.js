// The JTS installer crew (built from primitives), their ladder, the panel pallet and the branded van.
import {
  Group, Mesh, BoxGeometry, CapsuleGeometry, SphereGeometry, CylinderGeometry, MeshStandardMaterial, Quaternion,
  Vector3, TextureLoader, SRGBColorSpace, PlaneGeometry, MeshBasicMaterial,
} from 'three';
import { crewPlan, pose, palletCount, SITE, CREW_SIZE } from './crewMotion.js';

const SKIN = ['#e9b48f', '#c98d63', '#f1c7a5', '#a8714c'];

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}

function buildInstaller(mats, skin) {
  const root = new Group();
  const hips = new Group();
  hips.position.y = 0.92;
  root.add(hips);

  // Legs: hip pivot → thigh → knee pivot → shin + boot
  const legs = [-0.11, 0.11].map((x) => {
    const hip = new Group();
    hip.position.set(x, 0, 0);
    hip.add(mesh(new CapsuleGeometry(0.085, 0.3, 4, 8), mats.overalls, 0, -0.22, 0));
    const knee = new Group();
    knee.position.y = -0.45;
    knee.add(mesh(new CapsuleGeometry(0.075, 0.28, 4, 8), mats.overalls, 0, -0.2, 0));
    knee.add(mesh(new BoxGeometry(0.15, 0.03, 0.06), mats.stripe, 0, -0.16, 0.07));
    knee.add(mesh(new BoxGeometry(0.15, 0.1, 0.26), mats.boot, 0, -0.42, 0.04));
    hip.add(knee);
    hips.add(hip);
    return { hip, knee };
  });

  // Torso
  const torso = new Group();
  hips.add(torso);
  torso.add(mesh(new BoxGeometry(0.42, 0.56, 0.24), mats.overalls, 0, 0.3, 0));
  torso.add(mesh(new BoxGeometry(0.43, 0.05, 0.25), mats.stripe, 0, 0.42, 0));
  torso.add(mesh(new BoxGeometry(0.16, 0.12, 0.01), mats.patch, 0, 0.36, -0.125)); // logo patch on the back
  torso.add(mesh(new BoxGeometry(0.44, 0.12, 0.26), mats.belt, 0, 0.05, 0));
  const head = new Group();
  head.position.y = 0.72;
  head.add(mesh(new SphereGeometry(0.14, 16, 12), skin, 0, 0, 0));
  head.add(mesh(new SphereGeometry(0.17, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.hat, 0, 0.04, 0));
  head.add(mesh(new CylinderGeometry(0.22, 0.22, 0.025, 20), mats.hat, 0, 0.04, 0.03));
  torso.add(head);

  // Arms: shoulder pivot → upper arm → elbow pivot → forearm + glove
  const arms = [-0.27, 0.27].map((x) => {
    const shoulder = new Group();
    shoulder.position.set(x, 0.53, 0);
    shoulder.add(mesh(new CapsuleGeometry(0.065, 0.22, 4, 8), mats.overalls, 0, -0.15, 0));
    const elbow = new Group();
    elbow.position.y = -0.3;
    elbow.add(mesh(new CapsuleGeometry(0.055, 0.2, 4, 8), skin, 0, -0.13, 0));
    elbow.add(mesh(new SphereGeometry(0.07, 10, 8), mats.glove, 0, -0.28, 0));
    shoulder.add(elbow);
    torso.add(shoulder);
    return { shoulder, elbow };
  });

  return { root, hips, torso, head, legs, arms };
}

function applyPose(rig, P) {
  rig.hips.position.y = 0.92 + P.hipY;
  rig.torso.rotation.x = P.torsoPitch;
  rig.head.rotation.y = P.head;
  const [L, R] = rig.arms;
  L.shoulder.rotation.x = P.armL[0]; L.elbow.rotation.x = -P.armL[1];
  R.shoulder.rotation.x = P.armR[0]; R.elbow.rotation.x = -P.armR[1];
  const [lL, lR] = rig.legs;
  lL.hip.rotation.x = P.legL[0]; lL.knee.rotation.x = P.legL[1];
  lR.hip.rotation.x = P.legR[0]; lR.knee.rotation.x = P.legR[1];
}

function buildLadder(mats) {
  const a = new Vector3(...SITE.ladderBase), b = new Vector3(...SITE.ladderTop).add(new Vector3(0, 0.6, 0.05));
  const len = a.distanceTo(b);
  const g = new Group();
  for (const x of [-0.24, 0.24]) g.add(mesh(new BoxGeometry(0.06, len, 0.08), mats.ladder, x, len / 2, 0));
  for (let y = 0.3; y < len; y += 0.32) g.add(mesh(new CylinderGeometry(0.025, 0.025, 0.48, 6), mats.ladder, 0, y, 0).rotateZ(Math.PI / 2));
  g.position.copy(a);
  g.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return g;
}

function buildVan(mats) {
  const g = new Group();
  g.add(mesh(new BoxGeometry(4.4, 2.1, 2.1), mats.van, 0, 1.45, 0));
  g.add(mesh(new BoxGeometry(1.3, 1.5, 2.05), mats.van, 2.75, 1.15, 0));
  g.add(mesh(new BoxGeometry(0.05, 0.7, 1.8), mats.glassDark, 3.42, 1.55, 0));
  g.add(mesh(new BoxGeometry(5.7, 0.18, 2.12), mats.stripe, 0.6, 0.62, 0));
  for (const x of [-1.4, 2.6]) for (const z of [-1.02, 1.02]) {
    const w = mesh(new CylinderGeometry(0.42, 0.42, 0.3, 16), mats.tyre, x, 0.42, z);
    w.rotation.x = Math.PI / 2;
    g.add(w);
  }
  // Logo on the side facing the camera
  const tex = new TextureLoader().load('/img/logo-wide.png');
  tex.colorSpace = SRGBColorSpace;
  const logo = new Mesh(new PlaneGeometry(3.2, 1.02), new MeshBasicMaterial({ map: tex, toneMapped: false }));
  logo.position.set(-0.1, 1.55, 1.06);
  g.add(logo);
  g.position.set(13.2, 0, 11.2);
  g.rotation.y = -0.42;
  return g;
}

export function createCrew(scene, quality, { slots, panels }) {
  const mats = {
    overalls: new MeshStandardMaterial({ color: '#173b63', roughness: 0.8 }),
    stripe: new MeshStandardMaterial({ color: '#f5c21b', roughness: 0.5, emissive: '#3a2c00' }),
    patch: new MeshStandardMaterial({ color: '#f5c21b', roughness: 0.6 }),
    belt: new MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.7 }),
    hat: new MeshStandardMaterial({ color: '#f5c21b', roughness: 0.35 }),
    boot: new MeshStandardMaterial({ color: '#3b2a1e', roughness: 0.9 }),
    glove: new MeshStandardMaterial({ color: '#8b8f94', roughness: 0.9 }),
    ladder: new MeshStandardMaterial({ color: '#c9ced4', metalness: 0.7, roughness: 0.4 }),
    van: new MeshStandardMaterial({ color: '#f5f6f7', roughness: 0.35, metalness: 0.15 }),
    glassDark: new MeshStandardMaterial({ color: '#1d2a38', roughness: 0.1, metalness: 0.5 }),
    tyre: new MeshStandardMaterial({ color: '#1b1b1b', roughness: 0.9 }),
    pallet: new MeshStandardMaterial({ color: '#b98d5a', roughness: 1 }),
  };
  const skins = SKIN.map((c) => new MeshStandardMaterial({ color: c, roughness: 0.7 }));
  const group = new Group();

  const rigs = Array.from({ length: CREW_SIZE }, (_, k) => {
    const rig = buildInstaller(mats, skins[k]);
    rig.root.scale.setScalar(1.15);
    group.add(rig.root);
    return rig;
  });

  // Panels carried by the crew are stand-ins sharing the rooftop panel geometry/materials.
  const standIns = rigs.map(() => {
    const m = new Mesh(panels.geometry, panels.materials.list);
    m.castShadow = true;
    m.visible = false;
    group.add(m);
    return m;
  });

  // Pallet with the stack of panels still waiting
  const pallet = new Group();
  pallet.position.set(...SITE.pallet);
  pallet.add(mesh(new BoxGeometry(2.3, 0.18, 1.8), mats.pallet, 0, 0.09, 0));
  const stack = slots.map((_, i) => {
    const m = new Mesh(panels.geometry, panels.materials.list);
    m.position.set(0, 0.22 + i * 0.075, 0);
    m.castShadow = true;
    pallet.add(m);
    return m;
  });

  group.add(pallet, buildLadder(mats), buildVan(mats));
  scene.add(group);

  const yawQ = new Quaternion();
  const roofQ = new Quaternion().setFromRotationMatrix(panels.basis);
  const UP = new Vector3(0, 1, 0);
  const tmp = new Vector3();
  const target = new Vector3();

  return {
    update(p, time) {
      const plan = crewPlan(p, slots);
      plan.forEach((m, k) => {
        const rig = rigs[k];
        rig.root.position.set(...m.pos);
        rig.root.rotation.y = m.yaw;
        const t = m.kind === 'idle' || m.kind === 'wave' ? time * (m.kind === 'wave' ? 1.6 : 0.25) + k * 0.31 : m.t;
        const P = pose(m.kind, t);
        applyPose(rig, P);

        const s = standIns[k];
        s.visible = m.carrying !== null;
        if (!s.visible) return;
        // Overhead carry → set down on its roof slot.
        yawQ.setFromAxisAngle(UP, m.yaw);
        tmp.set(m.pos[0], m.pos[1] + 2.18 + P.hipY, m.pos[2]);
        target.set(...slots[m.carrying].pos);
        s.position.lerpVectors(tmp, target, m.place);
        s.quaternion.slerpQuaternions(yawQ, roofQ, m.place);
      });
      const left = palletCount(p, slots.length);
      stack.forEach((m, i) => { m.visible = i < left; });
    },
    dispose() {
      scene.remove(group);
      group.traverse((o) => { if (o.geometry && o.geometry !== panels.geometry) o.geometry.dispose(); });
      for (const m of [...Object.values(mats), ...skins]) { m.map?.dispose(); m.dispose(); }
    },
  };
}
