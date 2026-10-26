// Energy flowing roof → inverter → battery → house, with a charge bar and glowing windows.
import {
  Group, Mesh, BoxGeometry, MeshStandardMaterial, TubeGeometry, CatmullRomCurve3, Vector3, ShaderMaterial,
  AdditiveBlending, Color,
} from 'three';
import { CHAPTER_RANGES, local, easeInOut } from '../../scroll/progress.js';

export function energyIntensity(p) {
  return easeInOut(local(p, CHAPTER_RANGES.stocare));
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uLength;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float s = vUv.x * uLength;
    float pulse = smoothstep(0.0, 0.25, fract(s * 0.9 - uTime * 1.6)) * smoothstep(1.0, 0.55, fract(s * 0.9 - uTime * 1.6));
    float core = 0.25 + 0.75 * pulse;
    // only lit up to how far the flow has reached
    float reach = smoothstep(vUv.x - 0.04, vUv.x, uIntensity * 1.04);
    gl_FragColor = vec4(uColor * (0.6 + 1.6 * pulse), core * reach);
  }
`;

const X = -6.13; // left gable wall, facing the camera in the storage shot

function flowTube(points, color) {
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)));
  const uniforms = {
    uTime: { value: 0 }, uIntensity: { value: 0 }, uLength: { value: curve.getLength() }, uColor: { value: new Color(color) },
  };
  const mesh = new Mesh(
    new TubeGeometry(curve, 96, 0.05, 8, false),
    new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: AdditiveBlending }),
  );
  return { mesh, uniforms };
}

export function createEnergy(scene, roof, windows) {
  const g = new Group();
  const white = new MeshStandardMaterial({ color: '#eef0f2', roughness: 0.5 });
  const dark = new MeshStandardMaterial({ color: '#2a3340', roughness: 0.4 });
  const led = new MeshStandardMaterial({ color: '#2bd46b', emissive: '#2bd46b', emissiveIntensity: 0 });
  const charge = new MeshStandardMaterial({ color: '#f5c21b', emissive: '#f5c21b', emissiveIntensity: 0.6 });

  const box = (w, h, d, m, x, y, z) => { const b = new Mesh(new BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = true; g.add(b); return b; };
  // Inverter (with display) and battery cabinet on the wall
  box(0.24, 1.0, 0.8, white, X - 0.12, 2.3, 0.4);
  box(0.02, 0.22, 0.34, dark, X - 0.25, 2.5, 0.4);
  const invLed = box(0.03, 0.06, 0.06, led, X - 0.25, 2.05, 0.6);
  box(0.3, 1.3, 0.75, white, X - 0.15, 0.95, -1.0);
  box(0.02, 0.9, 0.12, dark, X - 0.31, 0.95, -1.0);
  const bar = box(0.03, 0.88, 0.1, charge, X - 0.32, 0.95, -1.0);
  bar.geometry.translate(0, 0.44, 0);
  bar.position.y = 0.95 - 0.44;
  const batLed = box(0.03, 0.06, 0.06, led.clone(), X - 0.31, 1.52, -0.7);

  const corner = roof.origin.clone().addScaledVector(roof.down, roof.height).addScaledVector(roof.normal, 0.05);
  const flows = [
    flowTube([[corner.x + 0.3, corner.y, corner.z], [X - 0.1, corner.y - 0.4, corner.z - 0.2], [X - 0.08, 3.4, 2.0], [X - 0.26, 2.8, 0.45]], '#ffd23f'),
    flowTube([[X - 0.26, 1.8, 0.4], [X - 0.3, 1.75, -0.3], [X - 0.32, 1.6, -0.95]], '#ffd23f'),
    flowTube([[X - 0.3, 0.5, -1.35], [X - 0.2, 0.45, -2.2], [X - 0.02, 1.2, -2.9], [X + 0.4, 1.8, -2.9]], '#ffe58a'),
  ];
  for (const f of flows) g.add(f.mesh);
  scene.add(g);

  return {
    update(p, time) {
      const k = energyIntensity(p);
      // Flow reaches the inverter first, then the battery, then the house.
      flows.forEach((f, i) => {
        f.uniforms.uTime.value = time;
        f.uniforms.uIntensity.value = Math.min(Math.max(k * 3 - i, 0), 1);
      });
      bar.scale.y = Math.max(0.02, k);
      invLed.material.emissiveIntensity = k > 0 ? 2 : 0;
      batLed.material.emissiveIntensity = k > 0.6 ? 2 : 0;
      windows.emissiveIntensity = 1.4 * Math.min(Math.max(k * 3 - 2, 0), 1);
    },
    dispose() {
      scene.remove(g);
      g.traverse((o) => { o.geometry?.dispose(); });
      for (const m of [white, dark, led, batLed.material, charge, ...flows.map((f) => f.mesh.material)]) m.dispose();
    },
  };
}
