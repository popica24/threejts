// Sky dome with sun glow, the sun light, hemisphere fill and fog — all driven by paletteAt(p).
import {
  Mesh, SphereGeometry, ShaderMaterial, BackSide, Color, Vector3, DirectionalLight, HemisphereLight, FogExp2,
} from 'three';
import { paletteAt } from '../palette.js';

const DEG = Math.PI / 180;

export function sunDirection(elevationDeg, azimuthDeg, out = new Vector3()) {
  const el = elevationDeg * DEG, az = azimuthDeg * DEG;
  return out.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
}

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = p.xyww;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSun;
  uniform vec3 uSunDir;
  varying vec3 vDir;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;
    vec3 col = mix(uHorizon, uTop, pow(smoothstep(-0.02, 0.65, h), 0.75));
    float s = max(dot(d, uSunDir), 0.0);
    col += uSun * (pow(s, 700.0) * 9.0 + pow(s, 40.0) * 0.9 + pow(s, 5.0) * 0.3);
    // warm haze band right at the horizon, stronger towards the sun
    col = mix(col, uHorizon * 1.04 + uSun * 0.08 * s, smoothstep(0.12, -0.02, h) * 0.65);
    col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createSky(scene, quality) {
  const uniforms = {
    uTop: { value: new Color() },
    uHorizon: { value: new Color() },
    uSun: { value: new Color() },
    uSunDir: { value: new Vector3(0, 0.1, -1) },
  };
  const dome = new Mesh(
    new SphereGeometry(1800, 48, 24),
    new ShaderMaterial({ uniforms, vertexShader, fragmentShader, side: BackSide, depthWrite: false, fog: false }),
  );
  dome.renderOrder = -1;
  dome.frustumCulled = false;
  scene.add(dome);

  scene.fog = new FogExp2('#e8b7a8', 0.0038);

  const hemi = new HemisphereLight('#bcd6f0', '#5d6b3a', 0.9);
  scene.add(hemi);

  const sun = new DirectionalLight('#fff', 2.5);
  sun.castShadow = quality === 'high';
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 400 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);

  const dir = new Vector3();
  let lastP = -1;

  return {
    sunDir: dir,
    update(p) {
      if (p === lastP) return;
      lastP = p;
      const c = paletteAt(p);
      sunDirection(c.sunElevation, c.sunAzimuth, dir);
      uniforms.uTop.value.set(c.sky[0]);
      uniforms.uHorizon.value.set(c.sky[1]);
      uniforms.uSun.value.set(c.sun);
      uniforms.uSunDir.value.copy(dir);
      scene.fog.color.set(c.fog);
      sun.color.set(c.sun);
      const day = Math.min(Math.max(c.sunElevation / 35, 0), 1);
      sun.intensity = 0.9 + 2.4 * day;
      sun.position.copy(dir).multiplyScalar(160);
      hemi.color.set(c.sky[0]).lerp(new Color('#ffffff'), 0.35);
      hemi.intensity = 0.55 + 0.6 * day;
    },
    dispose() {
      dome.geometry.dispose();
      dome.material.dispose();
      scene.remove(dome, hemi, sun, sun.target);
    },
  };
}
