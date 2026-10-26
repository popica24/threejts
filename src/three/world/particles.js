// Drifting pollen / dust motes that catch the low sun.
import { BufferGeometry, Float32BufferAttribute, Points, ShaderMaterial, AdditiveBlending, Color } from 'three';
import { rng } from './terrain.js';
import { paletteAt } from '../palette.js';

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.y = mod(p.y + uTime * (0.25 + aSeed * 0.35), 34.0);
    p.x += sin(uTime * 0.3 + aSeed * 40.0) * 1.6;
    p.z += cos(uTime * 0.25 + aSeed * 30.0) * 1.2;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.5 + aSeed) * (60.0 / -mv.z);
    vAlpha = smoothstep(0.0, 4.0, p.y) * smoothstep(34.0, 26.0, p.y) * (0.4 + 0.6 * fract(aSeed * 7.0));
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(uColor, a * vAlpha * uOpacity);
  }
`;

export function createParticles(scene, quality) {
  const count = quality === 'high' ? 1500 : 400;
  const rand = rng(11);
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos.set([(rand() - 0.5) * 140, rand() * 34, (rand() - 0.5) * 120 - 10], i * 3);
    seed[i] = rand();
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new Float32BufferAttribute(seed, 1));
  const uniforms = {
    uTime: { value: 0 }, uSize: { value: quality === 'high' ? 5 : 4 },
    uColor: { value: new Color() }, uOpacity: { value: 1 },
  };
  const mat = new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: AdditiveBlending });
  const points = new Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  return {
    update(p, time) {
      const c = paletteAt(p);
      uniforms.uTime.value = time;
      uniforms.uColor.value.set(c.sun);
      // Most visible in low, raking light (dawn and golden hour).
      uniforms.uOpacity.value = 0.25 + 0.45 * (1 - Math.min(c.sunElevation / 45, 1));
    },
    dispose() { scene.remove(points); geo.dispose(); mat.dispose(); },
  };
}
