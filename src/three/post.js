// Cinematic post pass (high quality only): soft bloom, slight chromatic aberration, grain, vignette.
// The scene renders linear HDR into a target; the composite applies tone mapping + sRGB like the screen would.
import {
  WebGLRenderTarget, HalfFloatType, ShaderMaterial, Mesh, PlaneGeometry, OrthographicCamera, Scene, Vector2,
  LinearFilter,
} from 'three';

const quadVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const brightFrag = /* glsl */ `
  uniform sampler2D tInput;
  uniform float uThreshold;
  varying vec2 vUv;
  void main() {
    vec3 c = texture2D(tInput, vUv).rgb;
    float l = max(max(c.r, c.g), c.b);
    float k = smoothstep(uThreshold, uThreshold + 0.6, l);
    gl_FragColor = vec4(c * k, 1.0);
  }
`;

const blurFrag = /* glsl */ `
  uniform sampler2D tInput;
  uniform vec2 uDir;
  varying vec2 vUv;
  void main() {
    vec3 s = texture2D(tInput, vUv).rgb * 0.2270270270;
    s += texture2D(tInput, vUv + uDir * 1.3846153846).rgb * 0.3162162162;
    s += texture2D(tInput, vUv - uDir * 1.3846153846).rgb * 0.3162162162;
    s += texture2D(tInput, vUv + uDir * 3.2307692308).rgb * 0.0702702703;
    s += texture2D(tInput, vUv - uDir * 3.2307692308).rgb * 0.0702702703;
    gl_FragColor = vec4(s, 1.0);
  }
`;

const compositeFrag = /* glsl */ `
  uniform sampler2D tScene;
  uniform sampler2D tBloom;
  uniform float uBloom;
  uniform float uCA;
  uniform float uGrain;
  uniform float uVig;
  uniform float uFade;
  uniform float uTime;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 d = vUv - 0.5;
    vec2 off = d * uCA;
    vec3 c;
    c.r = texture2D(tScene, vUv + off).r;
    c.g = texture2D(tScene, vUv).g;
    c.b = texture2D(tScene, vUv - off).b;
    c += texture2D(tBloom, vUv).rgb * uBloom;
    gl_FragColor = vec4(c, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    float v = smoothstep(0.85, 0.2, length(d * vec2(1.1, 1.0)));
    gl_FragColor.rgb *= mix(1.0 - uVig, 1.0, v);
    gl_FragColor.rgb += (hash(vUv * 1000.0 + fract(uTime) * 61.0) - 0.5) * uGrain;
    gl_FragColor.rgb *= uFade;
  }
`;

function pass(fragmentShader, uniforms) {
  const material = new ShaderMaterial({ uniforms, vertexShader: quadVert, fragmentShader, depthTest: false, depthWrite: false });
  return material;
}

export function createPost(renderer, w, h) {
  const opts = { type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter };
  const sceneRT = new WebGLRenderTarget(w, h, { ...opts, samples: 4 });
  const halfA = new WebGLRenderTarget(1, 1, opts);
  const quarterA = new WebGLRenderTarget(1, 1, opts);
  const quarterB = new WebGLRenderTarget(1, 1, opts);

  const bright = pass(brightFrag, { tInput: { value: sceneRT.texture }, uThreshold: { value: 1.05 } });
  const blur = pass(blurFrag, { tInput: { value: null }, uDir: { value: new Vector2() } });
  const composite = pass(compositeFrag, {
    tScene: { value: sceneRT.texture }, tBloom: { value: quarterA.texture },
    uBloom: { value: 0.3 }, uCA: { value: 0.0015 }, uGrain: { value: 0.02 }, uVig: { value: 0.35 },
    uFade: { value: 0 }, uTime: { value: 0 },
  });
  composite.toneMapped = true;

  const quad = new Mesh(new PlaneGeometry(2, 2), bright);
  quad.frustumCulled = false;
  const qScene = new Scene().add(quad);
  const qCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const draw = (material, target) => {
    quad.material = material;
    renderer.setRenderTarget(target);
    renderer.render(qScene, qCam);
  };

  function resize(width, height) {
    const dpr = renderer.getPixelRatio();
    const W = Math.round(width * dpr), H = Math.round(height * dpr);
    sceneRT.setSize(W, H);
    halfA.setSize(W >> 1, H >> 1);
    quarterA.setSize(W >> 2, H >> 2);
    quarterB.setSize(W >> 2, H >> 2);
  }
  resize(w, h);

  const start = performance.now();
  return {
    render(scene, camera) {
      renderer.setRenderTarget(sceneRT);
      renderer.render(scene, camera);
      draw(bright, halfA);
      const qw = quarterA.width, qh = quarterA.height;
      blur.uniforms.tInput.value = halfA.texture; blur.uniforms.uDir.value.set(1 / qw, 0); draw(blur, quarterB);
      blur.uniforms.tInput.value = quarterB.texture; blur.uniforms.uDir.value.set(0, 1 / qh); draw(blur, quarterA);
      blur.uniforms.tInput.value = quarterA.texture; blur.uniforms.uDir.value.set(2 / qw, 0); draw(blur, quarterB);
      blur.uniforms.tInput.value = quarterB.texture; blur.uniforms.uDir.value.set(0, 2 / qh); draw(blur, quarterA);
      const t = (performance.now() - start) / 1000;
      composite.uniforms.uTime.value = t;
      composite.uniforms.uFade.value = Math.min(t / 1.4, 1);
      draw(composite, null);
    },
    resize,
    dispose() {
      for (const rt of [sceneRT, halfA, quarterA, quarterB]) rt.dispose();
      for (const m of [bright, blur, composite]) m.dispose();
      quad.geometry.dispose();
    },
  };
}
