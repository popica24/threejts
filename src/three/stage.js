// Builds the renderer and the world, then drives every module from the shared progress value.
import { Vector3 } from 'three';
import { createRenderer } from './renderer.js';
import { createPost } from './post.js';
import { sampleCamera } from './cameraPath.js';
import { paletteAt } from './palette.js';
import { createSky } from './world/sky.js';
import { createTerrain } from './world/terrain.js';
import { createParticles } from './world/particles.js';
import { createHouse } from './world/house.js';
import { createPanels } from './world/panels.js';
import { createCrew } from './world/crew.js';
import { createEnergy } from './world/energy.js';
import { createIndustrial } from './world/industrial.js';

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

export async function createStage(canvas, quality, { getProgress, onLoad = () => {} }) {
  const gl = createRenderer(canvas, quality);
  if (!gl) return null;
  const { scene, camera, renderer } = gl;

  // Build step by step so the loader can show real progress.
  // Each builder may read what earlier ones put on `world` (e.g. the roof frame).
  const world = {};
  const builders = [
    () => (world.sky = createSky(scene, quality)),
    () => createTerrain(scene, quality),
    () => (world.house = createHouse(scene)),
    () => (world.panels = createPanels(scene, world.house.roof)),
    () => (world.crew = createCrew(scene, quality, { slots: world.panels.slots, panels: world.panels })),
    () => createEnergy(scene, world.house.roof, world.house.windows),
    () => createIndustrial(scene, quality, world.panels),
    () => createParticles(scene, quality),
  ];
  const modules = [];
  for (let i = 0; i < builders.length; i++) {
    modules.push(builders[i]());
    onLoad((i + 1) / (builders.length + 1));
    await nextFrame();
  }

  // Gentle pointer parallax on top of the scroll-driven camera (desktop only).
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  if (matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', (e) => {
      pointer.x = e.clientX / innerWidth - 0.5;
      pointer.y = e.clientY / innerHeight - 0.5;
    }, { passive: true });
  }

  const cam = { pos: new Vector3(), look: new Vector3() };
  const right = new Vector3();
  gl.onFrame((dt, time) => {
    const p = getProgress();
    for (const m of modules) m.update(p, time);
    sampleCamera(p, cam, { portrait: camera.userData.portrait });
    pointer.sx += (pointer.x - pointer.sx) * Math.min(dt * 3, 1);
    pointer.sy += (pointer.y - pointer.sy) * Math.min(dt * 3, 1);
    right.subVectors(cam.look, cam.pos).cross(camera.up).normalize();
    camera.position.copy(cam.pos).addScaledVector(right, pointer.sx * 1.6).add({ x: 0, y: -pointer.sy * 1.0, z: 0 });
    camera.lookAt(cam.look);
    renderer.toneMappingExposure = paletteAt(p).exposure;
  });

  if (quality === 'high') {
    const post = createPost(renderer, innerWidth, innerHeight);
    gl.onResize((w, h) => post.resize(w, h));
    gl.setRender(() => post.render(scene, camera));
  }

  renderer.compile(scene, camera);
  await nextFrame();
  onLoad(1);

  return { ...gl, world, modules };
}
