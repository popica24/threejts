// Renderer, scene, camera, resize and the frame loop.
import {
  WebGLRenderer, Scene, PerspectiveCamera, ACESFilmicToneMapping, SRGBColorSpace, PCFSoftShadowMap, Clock,
} from 'three';

export const clampDt = (dt) => Math.min(dt, 0.1);

export function createRenderer(canvas, quality) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: quality === 'high', powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.shadowMap.enabled = quality === 'high';
  renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.5, 2400);
  const maxDpr = quality === 'high' ? 2 : 1.5;
  const callbacks = [];
  const clock = new Clock();
  let raf = 0;
  let renderFn = () => renderer.render(scene, camera);

  function resize(w = innerWidth, h = innerHeight) {
    renderer.setPixelRatio(Math.min(devicePixelRatio, maxDpr));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Tall phone screens: wider lens, and the subject lifted into the upper part of the frame
    // (the text cards sit at the bottom there).
    const portrait = w / h < 0.8;
    camera.fov = portrait ? 72 : 42;
    if (portrait) camera.setViewOffset(w, h * 1.35, 0, h * 0.35, w, h);
    else camera.clearViewOffset();
    camera.userData.portrait = portrait;
    camera.updateProjectionMatrix();
    for (const cb of resizers) cb(w, h);
  }
  const resizers = [];
  const onResize = () => resize();
  addEventListener('resize', onResize);
  resize();

  function loop() {
    raf = requestAnimationFrame(loop);
    const dt = clampDt(clock.getDelta());
    const time = clock.elapsedTime;
    for (const cb of callbacks) cb(dt, time);
    renderFn();
  }
  raf = requestAnimationFrame(loop);

  return {
    renderer, scene, camera, resize,
    onFrame: (cb) => callbacks.push(cb),
    onResize: (cb) => resizers.push(cb),
    setRender: (fn) => { renderFn = fn; },
    dispose() {
      cancelAnimationFrame(raf);
      removeEventListener('resize', onResize);
      renderer.dispose();
    },
  };
}
