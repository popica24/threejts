// Rooftop PV panels (cell-grid texture, clearcoat glint) that appear as each one is set down.
import {
  Mesh, BoxGeometry, MeshPhysicalMaterial, MeshStandardMaterial, CanvasTexture, SRGBColorSpace, Matrix4, Group,
} from 'three';
import { roofSlots, panelState, PANEL_WINDOW } from './panelLayout.js';

export const PANEL_COLS = 5;
export const PANEL_ROWS = 3;

export function cellTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 384;
  const g = c.getContext('2d');
  g.fillStyle = '#c9ced6';
  g.fillRect(0, 0, 512, 384);
  g.fillStyle = '#0b1d36';
  g.fillRect(10, 10, 492, 364);
  const cols = 12, rows = 8, cw = 492 / cols, rh = 364 / rows;
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const x = 10 + k * cw, y = 10 + r * rh;
      const grad = g.createLinearGradient(x, y, x + cw, y + rh);
      grad.addColorStop(0, '#1d4278');
      grad.addColorStop(1, '#13305a');
      g.fillStyle = grad;
      g.fillRect(x + 1.5, y + 1.5, cw - 3, rh - 3);
      g.fillStyle = 'rgba(200,210,225,0.35)';
      g.fillRect(x + cw * 0.33, y + 1.5, 1, rh - 3);
      g.fillRect(x + cw * 0.66, y + 1.5, 1, rh - 3);
    }
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function createPanelMaterials() {
  const frame = new MeshStandardMaterial({ color: '#c3c8cf', metalness: 0.85, roughness: 0.35 });
  const cells = new MeshPhysicalMaterial({
    map: cellTexture(), roughness: 0.22, metalness: 0.25, clearcoat: 1, clearcoatRoughness: 0.06,
  });
  // BoxGeometry groups: +x, −x, +y (front face), −y, +z, −z
  return { frame, cells, list: [frame, frame, cells, frame, frame, frame] };
}

export function createPanels(scene, roof) {
  const slots = roofSlots(PANEL_COLS, PANEL_ROWS, roof);
  const n = slots.length;
  const pw = roof.width / PANEL_COLS - 0.1, ph = roof.height / PANEL_ROWS - 0.1;
  const geo = new BoxGeometry(pw, 0.07, ph);
  const mats = createPanelMaterials();
  const basis = new Matrix4().makeBasis(roof.right, roof.normal, roof.down);

  const group = new Group();
  const meshes = slots.map((s) => {
    const m = new Mesh(geo, mats.list);
    m.position.set(...s.pos);
    m.quaternion.setFromRotationMatrix(basis);
    m.castShadow = m.receiveShadow = true;
    m.visible = false;
    group.add(m);
    return m;
  });

  // Mounting rails go on first, just before the crew starts carrying panels.
  const railGeo = new BoxGeometry(roof.width, 0.06, 0.08);
  const railMat = new MeshStandardMaterial({ color: '#aeb4bb', metalness: 0.8, roughness: 0.4 });
  const rails = [];
  for (let r = 0; r < PANEL_ROWS; r++) {
    for (const f of [0.25, 0.75]) {
      const rail = new Mesh(railGeo, railMat);
      rail.position.copy(roof.origin)
        .addScaledVector(roof.right, roof.width / 2)
        .addScaledVector(roof.down, (r + f) * (roof.height / PANEL_ROWS))
        .addScaledVector(roof.normal, -0.06);
      rail.quaternion.setFromRotationMatrix(basis);
      rail.castShadow = true;
      rails.push(rail);
      group.add(rail);
    }
  }
  scene.add(group);

  return {
    slots,
    geometry: geo,
    materials: mats,
    basis,
    update(p) {
      const railsOn = p >= PANEL_WINDOW[0] - 0.03;
      for (const r of rails) r.visible = railsOn;
      for (let i = 0; i < n; i++) meshes[i].visible = panelState(i, p, n).placed >= 1;
    },
    dispose() {
      scene.remove(group);
      geo.dispose(); railGeo.dispose(); railMat.dispose();
      mats.frame.dispose(); mats.cells.map.dispose(); mats.cells.dispose();
    },
  };
}
