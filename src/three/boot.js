// Starts the 3D stage; any setup failure falls back to the no-WebGL page instead of a stuck loader.
export async function bootStage(factory, onReady) {
  let stage = null;
  try {
    stage = await factory();
  } catch (err) {
    console.warn('3D scene disabled:', err);
  }
  onReady(stage);
  return stage;
}
