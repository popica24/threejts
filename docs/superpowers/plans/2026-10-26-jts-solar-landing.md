# JTS Solar Kage-style Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A scroll-driven, Kage-style three.js pitch landing page for JTS Solar, in Romanian. A procedural world tells the story: dawn → house → an installer crew mounts panels → energy flows → commercial/industrial → contact.

**Architecture:** Vite static site. A fixed full-screen WebGL canvas sits behind scrolling HTML chapter panels. Lenis smooth scroll + GSAP ScrollTrigger produce one global progress value `p ∈ [0,1]`. **Every 3D element is a pure function of `p` (and `time` for idle motion)** via `update(p, time)`, so jumping or fast-scrolling can never desync state. The scheduling, palette, pose and layout maths live in pure modules with Vitest tests. The three.js modules are thin and are verified visually in the browser.

**Tech Stack:** Vite 5, three 0.170.x, gsap 3.12.x (ScrollTrigger), lenis 1.1.x, Vitest 2 + jsdom, Google Font "Onest".

**Spec:** `docs/superpowers/specs/2026-10-26-jts-solar-landing-design.md`

## Global Constraints

- All visible copy is in Romanian and comes from jtssolar.ro. No invented stats or testimonials.
- Hero headline, verbatim: `Mai multă energie de la soare. Mai puțină din rețea.`
- Contact, verbatim: `0771 504 694`, `0752 080 807`, `contact@jtssolar.ro`, `oferte@jtssolar.ro`, `DN65B, 117141 Geamăna, Argeș`.
- Brand: navy `#173B63`, sun-yellow `#F5C21B`, off-white `#F7F4EE`.
- No 3D model files. All geometry is procedural.
- Installer crew: 3–4 figures with navy overalls and yellow hard hats, animated procedurally.
- Touch devices and `prefers-reduced-motion`: custom cursor, magnetic buttons, tilt and fly-ins are off; content still reveals with simple fades.
- Mobile / low tier: no post pass, fewer particles, pixel ratio ≤ 1.5.
- "Concept by …" credit comes from one constant in `src/config.js`.
- Build order: Tasks 1–7 form the showable vertical slice. Tasks 8–11 are enhancements, and 9–10 are cut first.

## Review Focus

1. **Jumping via the progress rail or dragging the scrollbar fast** must show the exact correct scene state (panels placed, crew position). Every `update` is pure in `p`; tests in Tasks 5–6 call the functions out of order.
2. **Window resize / phone rotation** must keep the canvas filling the viewport and the camera aspect correct, and ScrollTrigger must refresh. Covered in Task 4 (`resize` test) and Task 3 (refresh on resize).
3. **No WebGL available** (old device, disabled GPU): the page still shows all content over a static gradient background, with no blank screen. Covered in Task 4 (`createRenderer` returns null → `body.no-webgl`).
4. **A photo fails to load**: the card keeps its layout with a branded placeholder. Covered in Task 2 (`onerror` fallback test).
5. **The tab is hidden or the user returns after a long time**: no huge `dt` jump in idle animation. Clamp `dt` to ≤ 0.1s, tested in Task 4.

---

## File Structure

```
index.html                     page shell: canvas, loader, cursor, <main id="chapters">
vite.config.js
public/img/                    logo + downloaded jtssolar.ro photos
scripts/fetch-photos.mjs       one-off downloader for jtssolar.ro photos
src/main.js                    bootstrap: loader → renderer → world → scroller → ui
src/config.js                  CREDIT, QUALITY detection
src/content.js                 all Romanian copy + photo mapping (data only)
src/styles/{base,chapters,ui}.css
src/dom/chapters.js            renders content.js into chapter <section>s
src/scroll/progress.js         PURE: chapter ranges, local progress, easing
src/scroll/scroller.js         Lenis + ScrollTrigger → onProgress(p)
src/three/renderer.js          renderer/scene/resize/frame loop, quality tier
src/three/palette.js           PURE: time-of-day palette by p
src/three/cameraPath.js        PURE keyframes + sampleCamera(p)
src/three/world/sky.js         sky dome shader + sun disc
src/three/world/terrain.js     layered hills, fog, trees (instanced)
src/three/world/house.js       house; exposes roof frame
src/three/world/panels.js      panel mesh + cell shader; uses panelLayout.js
src/three/world/panelLayout.js PURE: roof slots, per-panel schedule
src/three/world/crew.js        installer figures (geometry + rig)
src/three/world/crewMotion.js  PURE: poses + choreography by p
src/three/world/energy.js      flowing energy lines/particles
src/three/world/industrial.js  halls + ground solar field
src/three/world/particles.js   dust/pollen Points
src/three/post.js              full-screen post shader pass
src/ui/{loader,cursor,magnetic,splitReveal,tilt,rail}.js
tests/*.test.js
```

Every world module exports `create(scene, quality) -> { update(p, time): void, dispose(): void }`.

---

### Task 1: Scaffold, content data, photos

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.js`, `src/config.js`, `src/content.js`, `scripts/fetch-photos.mjs`, `public/img/*`, `tests/content.test.js`, `.gitignore`

**Interfaces:**
- Produces: `content` (default export of `src/content.js`):
  `{ hero:{ eyebrow, title, cta }, chapters: Array<{ id:'hero'|'casa'|'montaj'|'stocare'|'scala'|'dece'|'contact', kicker, title, body:string[], items?:Array<{title,text,img?}> }>, process: Array<{n:1..5,title,text}>, projects: Array<{name,place,text,img}>, claims: Array<{title,text}>, contact:{ phones:string[], emails:string[], address } }`
- Produces: `CREDIT = { name:'[Numele tău]', url:'' }` and `detectQuality(): 'high'|'low'` from `src/config.js`.

- [ ] **Step 1:** Run `git init`, `npm init -y`, then `npm i three@0.170 gsap@3.12 lenis@1.1` and `npm i -D vite@5 vitest@2 jsdom@25`. Add the scripts `dev`, `build`, `preview`, `test: vitest run`, and add `.gitignore` (node_modules, dist).
- [ ] **Step 2:** Write `scripts/fetch-photos.mjs`. It fetches `https://www.jtssolar.ro/`, reads each `<img>` under `/wp-content/uploads/jts-foto/` together with its `alt`, downloads them to `public/img/`, and prints `file → alt`. Run it with `node scripts/fetch-photos.mjs`, then copy `assets/logo-jts.png`, `assets/panou-fotovoltaic.jpg` and `assets/panou-pe-casa.webp` into `public/img/`.
- [ ] **Step 3: Write the failing test** `tests/content.test.js`:
  - `content.hero.title === 'Mai multă energie de la soare. Mai puțină din rețea.'`
  - `content.process.map(s=>s.title)` deep-equals `['Calculăm','Facem oferta','Montăm','Punem în funcțiune','Prosumator']`
  - `content.contact.phones` deep-equals `['0771 504 694','0752 080 807']`, and `emails` deep-equals `['contact@jtssolar.ro','oferte@jtssolar.ro']`
  - `content.claims.map(c=>c.title)` deep-equals `['Echipe proprii','Toată România','Prosumator','Un singur interlocutor']`
  - `content.chapters.map(c=>c.id)` deep-equals `['hero','casa','montaj','stocare','scala','dece','contact']`
  - every `img` in projects/items exists on disk under `public/img/` (`fs.existsSync`)
- [ ] **Step 4:** Run `npm test`. Expected: FAIL, because content.js is missing.
- [ ] **Step 5:** Write `src/content.js`. Copy the text verbatim from jtssolar.ro (re-fetch the page for exact wording). Map project photos using the alt texts printed in Step 2; if no photo matches, use `panou-fotovoltaic.jpg`. Write `src/config.js`: `detectQuality` returns `'low'` when `matchMedia('(pointer:coarse)')` matches, or `navigator.hardwareConcurrency <= 4`, or the viewport width is under 768.
- [ ] **Step 6:** Run `npm test`. Expected: PASS.
- [ ] **Step 7:** Commit `feat: scaffold, content and photos`.

### Task 2: Page shell, chapter DOM, base styling, loader

**Files:**
- Create: `src/dom/chapters.js`, `src/ui/loader.js`, `src/styles/base.css`, `src/styles/chapters.css`, `tests/chapters.test.js`
- Modify: `index.html`, `src/main.js`

**Interfaces:**
- Consumes: `content`, `CREDIT`
- Produces: `renderChapters(root: HTMLElement, content, credit): HTMLElement[]`, which returns one `<section class="chapter" data-chapter="<id>">` per chapter in order. Process steps render as `.step[data-step="n"]`, projects as `.card` with `<img>`, and the footer as `.credit`.
- Produces: `createLoader(el): { setProgress(0..1): void, done(): Promise<void> }`. The loader text is `Ridicăm panourile… NN%`.

- [ ] **Step 1: Write failing tests** (jsdom):
  - `renderChapters` returns 7 sections whose `data-chapter` order matches `content.chapters` ids.
  - `root.querySelectorAll('.step').length === 5`.
  - `root.querySelector('.credit').textContent` includes `CREDIT.name`.
  - Firing `error` on a card `<img>` adds the class `img-fallback` to its `.card` (Review Focus 4).
  - `createLoader(el).setProgress(0.42)` gives `el.textContent` including `42%`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement both modules. `index.html` contains `<canvas id="gl">`, `#loader` (with the logo), `#cursor`, `<main id="chapters">`, and the Onest font link. CSS: each chapter is at least 100vh, text panels sit on a soft backdrop/gradient for readability, mobile is a single column, and `.no-webgl body` gets a navy→dawn gradient. `.img-fallback` shows a navy box with the logo.
- [ ] **Step 4:** Run `npm test`. Expected: PASS. Then run `npm run dev` and open the page: all copy is readable and the loader shows over it.
- [ ] **Step 5:** Commit `feat: chapter DOM, styles, loader`.

### Task 3: Scroll progress core + rail

**Files:**
- Create: `src/scroll/progress.js`, `src/scroll/scroller.js`, `src/ui/rail.js`, `tests/progress.test.js`

**Interfaces:**
- Produces (pure): `CHAPTER_RANGES: Record<id,[start,end]>`, which covers `[0,1]` contiguously in chapter order: hero `[0,.10]`, casa `[.10,.22]`, montaj `[.22,.50]`, stocare `[.50,.62]`, scala `[.62,.78]`, dece `[.78,.88]`, contact `[.88,1]`.
- Produces: `local(p, [a,b]): number`, clamped to 0..1; `easeInOut(t)` (smoothstep); `chapterAt(p): id`.
- Produces: `createScroller({ onProgress(p) }): { scrollToChapter(id), destroy() }`. Lenis drives `ScrollTrigger.update`; one ScrollTrigger spans `#chapters` start→end; it calls `ScrollTrigger.refresh()` on resize.
- Produces: `createRail(el, scroller): { update(p) }`, which shows 7 markers, highlights `chapterAt(p)`, and calls `scrollToChapter` on click.

- [ ] **Step 1: Write failing tests:** the ranges are contiguous (each end equals the next start, the first is 0, the last is 1); `local(0.36,[.22,.50]) ≈ 0.5`; `local(-1,…) === 0`; `local(2,…) === 1`; `chapterAt(0.55) === 'stocare'`; `chapterAt(1) === 'contact'`; `easeInOut(0)=0`, `easeInOut(1)=1`, `easeInOut(.5)=.5`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. With reduced motion, Lenis is not created and native scroll still feeds ScrollTrigger.
- [ ] **Step 4:** Run `npm test` and check it PASSES. In the browser, log `p`: it goes 0→1 smoothly, and clicking a rail marker jumps to that chapter.
- [ ] **Step 5:** Commit `feat: scroll progress and rail`.

### Task 4: Renderer, palette, sky, terrain, camera path → hero scene

**Files:**
- Create: `src/three/renderer.js`, `src/three/palette.js`, `src/three/cameraPath.js`, `src/three/world/sky.js`, `src/three/world/terrain.js`, `src/three/world/particles.js`, `tests/palette.test.js`, `tests/cameraPath.test.js`, `tests/renderer.test.js`

**Interfaces:**
- Produces: `createRenderer(canvas, quality): { renderer, scene, camera, onFrame(cb:(dt,time)=>void), resize(w,h), dispose() } | null`. It returns null when WebGL context creation fails; `main.js` then adds `no-webgl` to `<html>` and skips 3D (Review Focus 3). The loop clamps `dt` with `Math.min(dt, 0.1)` (Review Focus 5). `resize` sets the camera aspect and renderer size, with pixel ratio `min(devicePixelRatio, quality==='high'?2:1.5)`.
- Produces (pure): `paletteAt(p): { sky:[top,horizon] hex, sun:hex, fog:hex, sunElevation:number(deg), exposure:number }`. Keys: p=0 dawn (sunElevation 2, warm pink/peach horizon); p=.35 midday (sunElevation 55, clear blue); p=.88→1 golden (sunElevation 10, amber). Interpolate between keys.
- Produces (pure): `CAMERA_KEYS: Array<{p, pos:[x,y,z], look:[x,y,z]}>` and `sampleCamera(p): {pos:Vector3, look:Vector3}`, using `CatmullRomCurve3` over the positions and lerped look targets. World layout: the house sits at the origin, the hills at z −40…−200, and the industrial site around x +60…+140.
- World modules use the `create(scene, quality)` contract from File Structure.

- [ ] **Step 1: Write failing tests:**
  - `paletteAt(0).sunElevation < paletteAt(.35).sunElevation` and `paletteAt(.95).sunElevation < paletteAt(.35).sunElevation`.
  - `paletteAt(p)` is continuous: across 200 samples, each step changes sunElevation by less than 3.
  - `sampleCamera(0)` is far from the house and high (y>15); `sampleCamera(local mid of 'montaj')` is within 25 units of the origin; `sampleCamera(.7).pos.x > 30` (looking at industrial).
  - `sampleCamera(p)` is deterministic: calling .9 then .1 gives the same result as calling .1 first (Review Focus 1).
  - renderer test (mock canvas whose `getContext` returns null): `createRenderer` returns null.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Sky: a large inverted sphere with a gradient `ShaderMaterial` and a sun disc with soft glow, driven by `paletteAt`. Terrain: 4–5 layered hill ridges (`PlaneGeometry` displaced with summed sines), `FogExp2` from the palette, and instanced low-poly trees (cone+cylinder, 300 on high / 120 on low). Particles: 1500 high / 400 low drifting `Points`. Lights: hemisphere light plus a directional "sun" placed from `sunElevation`. Wire `main.js`: loader progress → `done()` once the first frame renders; scroller `onProgress` stores `p`; each frame calls `update(p,time)` on all world modules and then `sampleCamera(p)`.
- [ ] **Step 4:** Run the tests and check they PASS. In the browser, the hero shows a dawn sky over misty hills with the headline readable. Scrolling moves the camera and the light shifts toward midday. Resizing and rotating (devtools device mode) keeps the canvas full and undistorted (Review Focus 2).
- [ ] **Step 5:** Commit `feat: renderer, sky, terrain, camera path`.

### Task 5: House + panels with scheduled placement

**Files:**
- Create: `src/three/world/house.js`, `src/three/world/panelLayout.js`, `src/three/world/panels.js`, `tests/panelLayout.test.js`

**Interfaces:**
- Produces: `createHouse(scene) -> { update, dispose, roof: { origin:Vector3, right:Vector3, down:Vector3, normal:Vector3, width:number, height:number } }`. The house has white walls, a terracotta tiled gable roof (echoing `panou-pe-casa.webp`), a chimney, windows (emissive material so Task 9 can light them), and a wooden balcony.
- Produces (pure): `roofSlots(cols=5, rows=3, roof) -> Array<{ i, pos:[x,y,z] }>` in placement order (bottom row first, left→right).
- Produces (pure): `panelState(i, p, n) -> { placed:number /*0..1*/ }`. The placement window for panel `i` is `[.28 + i*w, .28 + (i+1)*w]` with `w = (.46-.28)/n`, eased with `easeInOut`.
- Produces: `createPanels(scene, roof, quality) -> { update(p,time), dispose, slots }`. A panel is a thin box with a cell-grid `ShaderMaterial` (navy cells, silver frame lines, a fresnel sun glint driven by `paletteAt`). When `placed<1` the panel is hidden; Task 6's crew carries visual stand-ins up to the moment of placing.

- [ ] **Step 1: Write failing tests:** `roofSlots(5,3,roof).length === 15`; all slots lie on the roof plane (distance to plane < 1e-6); `panelState(0,.27,15).placed === 0`; `panelState(14,.47,15).placed === 1`; for i<j, `panelState(i,p).placed >= panelState(j,p).placed` for 50 sampled p; out-of-order calls are equal (pure).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the tests and check they PASS. In the browser, with the crew still missing, temporarily force panels visible at `placed` > 0 and confirm they snap to the roof grid in order while scrolling through 'montaj'. Jump with the rail from hero → contact: all 15 are present.
- [ ] **Step 5:** Commit `feat: house and scheduled panels`.

### Task 6: Installer crew (character animation)

**Files:**
- Create: `src/three/world/crewMotion.js`, `src/three/world/crew.js`, `tests/crewMotion.test.js`
- Modify: `src/three/world/panels.js` (stand-in hand-off)

**Interfaces:**
- Consumes: `roofSlots`, `panelState`, `roof`, `local`, `easeInOut`
- Produces (pure): `pose(kind:'idle'|'walk'|'carry'|'place'|'wave', t:number) -> { hipY, torsoPitch, armL:[shoulder,elbow], armR:[shoulder,elbow], legL:[hip,knee], legR:[hip,knee], head }` (radians/units). `walk`/`carry` cycle with period 1 in t. `carry` holds both arms forward-up at ~−1.2 rad shoulder.
- Produces (pure): `crewPlan(p, slots) -> Array<{ id:0..3, pos:[x,y,z], yaw, kind, t, carrying:number|null /* panel index */ }>`. Before 'montaj', the 4 installers stand by a van/pallet at about `[-8,0,6]` (idle). During 'montaj', panel i is carried by installer `i % 4`: the installer walks from the pallet to a ladder at the eave, then (pos y rises) up to the slot, uses `place` at the end of the panel's window, and is released (`carrying=null`) exactly when `panelState(i).placed` reaches 1. After .46, everyone does `wave` for a beat, then idles on the roof edge / ground.
- Produces: `createCrew(scene, quality) -> { update(p,time,plan), dispose }`. Each figure is built from primitives: rounded box torso in navy `#173B63` overalls, a skin-tone head sphere, a yellow `#F5C21B` hard-hat hemisphere with brim, two-segment limbs on pivots, and boots. A carried panel is a stand-in mesh attached to the hands. Idle breathing uses `time`; everything else uses `p`.

- [ ] **Step 1: Write failing tests:**
  - `pose('walk',0)` deep-close to `pose('walk',1)` (cyclic); `pose('walk',.25).legL[0] === -pose('walk',.75).legL[0]` (opposite phase).
  - `crewPlan(.10, slots)`: all `kind==='idle'` and `carrying===null`.
  - For each i and a sample p inside panel i's window before it ends: exactly one installer has `carrying===i`. At p where `panelState(i).placed===1`: nobody has `carrying===i`.
  - `crewPlan(.47, slots)` has at least 3 members with `kind==='wave'`.
  - Purity: `crewPlan(.4)` is the same after calling `crewPlan(.9)` first.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. In `panels.js` the real panel appears exactly when the crew stand-in disappears, so there's no double or missing panel.
- [ ] **Step 4:** Run the tests and check they PASS. In the browser, scroll slowly through 'montaj': installers walk with a natural swing, carry panels up, and each one lands and stays. Scrub backward: everything reverses cleanly. Jump via the rail to any chapter: the state is correct.
- [ ] **Step 5:** Commit `feat: installer crew animation`.

### Task 7: Finale/contact + vertical-slice check

**Files:**
- Modify: `src/three/cameraPath.js` (final wide golden shot keys), `src/dom/chapters.js` (contact CTAs), `src/styles/chapters.css`

**Interfaces:**
- Consumes: everything above. Contact CTAs are `mailto:oferte@jtssolar.ro` ("Solicitați o ofertă") and `tel:0771504694` / `tel:0752080807`. Two crew members wave near the house in the finale (extend `crewPlan` for `p>.88`, and add a test asserting `kind==='wave'` for ≥2 members at p=.95).

- [ ] **Step 1:** Add the finale test to `tests/crewMotion.test.js` and run it. Expected: FAIL.
- [ ] **Step 2:** Implement and run `npm test`. Expected: PASS.
- [ ] **Step 3:** Run `npm run build && npx vite preview`. Use the `run` skill to open it and capture screenshots at p ≈ 0, .15, .36, .47 and .95. Expected: dawn hero, house, mid-assembly, finished roof with waves, golden contact. Commit `feat: finale and contact` — **this is the showable slice.**

### Task 8: Micro-interactions (Framer-style)

**Files:**
- Create: `src/ui/cursor.js`, `src/ui/magnetic.js`, `src/ui/splitReveal.js`, `src/ui/tilt.js`, `src/styles/ui.css`, `tests/ui.test.js`

**Interfaces:**
- Produces: `interactionsEnabled(): boolean` (false if `(pointer:coarse)` or `prefers-reduced-motion: reduce`); `initCursor(el)`, a lerped dot that scales up over `a,button,.card` and shows a label from `data-cursor`; `initMagnetic(selector='[data-magnetic]', strength=.35)`; `splitReveal(el)`, which wraps lines and staggers them in with GSAP when the chapter enters; `initTilt(selector='.card', maxDeg=8)`. Each `init*` is a no-op when `interactionsEnabled()` is false, and `splitReveal` then falls back to a plain fade.

- [ ] **Step 1: Write failing tests** (jsdom, stub `matchMedia`): with coarse pointer, `interactionsEnabled() === false` and `initCursor` leaves `#cursor` hidden; with reduced motion, `splitReveal(h2)` produces no `.line` wrappers.
- [ ] **Step 2:** Run. Expected: FAIL. **Step 3:** Implement. **Step 4:** Run `npm test` and check it PASSES. In the browser (desktop), the cursor reacts, the CTA pulls toward the pointer, and headings reveal line by line. In device mode, none of these appear.
- [ ] **Step 5:** Commit `feat: micro-interactions`.

### Task 9: Energy flow (cut first if short on time)

**Files:** Create `src/three/world/energy.js`; Modify `house.js` (window emissive hook), `tests/progress.test.js`

**Interfaces:** `createEnergy(scene, roof, quality) -> { update(p,time), dispose }`. Glowing tube/line paths run roof → inverter box on the wall → battery cabinet → house. A dash/pulse shader scrolls along them with `time`, and the intensity is `local(p, CHAPTER_RANGES.stocare)`. House windows' emissive goes 0→1 over the same range.

- [ ] **Step 1:** Add a test that `energyIntensity(p)` (exported pure helper) is 0 at .49, 1 at .62, and monotonic in between. Run it: FAIL. **Step 2:** Implement and check it PASSES. Check visually. **Step 3:** Commit `feat: energy flow`.

### Task 10: Commercial & industrial + projects (cut first if short on time)

**Files:** Create `src/three/world/industrial.js`; Modify `src/dom/chapters.js` (project cards with photos and hover tilt)

**Interfaces:** `createIndustrial(scene, quality) -> { update(p,time), dispose }`. Two low halls with roof panel arrays and a ground-mounted solar field of `InstancedMesh` rows (120 high / 50 low) around x +60…+140. Rows rise from the ground with a stagger over `local(p, CHAPTER_RANGES.scala)`. A pure helper `rowRise(row, p, rows)` returns 0..1, staggered.

- [ ] **Step 1:** Test that `rowRise(0,.62,n) === 0`, `rowRise(n-1,.78,n) === 1`, and that earlier rows rise first. Run it: FAIL. **Step 2:** Implement and check it PASSES. Check visually that the project cards show the real photos. **Step 3:** Commit `feat: industrial scene and projects`.

### Task 11: Post-processing + polish

**Files:** Create `src/three/post.js`; Modify `renderer.js`

**Interfaces:** `createPost(renderer, w, h) -> { render(scene, camera, p), resize(w,h), dispose }`. Render to a `WebGLRenderTarget`, then a full-screen `ShaderMaterial` with uniforms `uBloom` (cheap threshold + 9-tap blur, about .3), `uCA` (≈.0015), `uGrain` (≈.02), `uVig` (≈.35), `uExp` (from `paletteAt(p).exposure`), and `uFade` (loader fade-in). Only used when `quality==='high'`.

- [ ] **Step 1:** Implement it and add it to the renderer. **Step 2:** In the browser on high quality the scene has a soft glow around the sun and panel glints, gentle grain and a vignette; on low quality it renders directly. **Step 3:** Check performance in Chrome devtools: ≥55fps on a laptop through the whole scroll, and no long tasks over 50ms after load. **Step 4:** Commit `feat: post-processing`.

### Task 12: Final verification + preview deploy

- [ ] **Step 1:** Run `npm test` and `npm run build`; both should succeed.
- [ ] **Step 2:** Use the `run` skill to screenshot every chapter at desktop 1440×900 and phone 390×844, with reduced motion on. Re-check every Review Focus item by hand.
- [ ] **Step 3:** Ask the user before deploying. Then use `vercel:deploy` (preview) and give them the URL.
- [ ] **Step 4:** Commit `chore: final polish`.
