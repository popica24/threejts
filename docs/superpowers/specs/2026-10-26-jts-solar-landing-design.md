# JTS Solar — Kage-style three.js landing page (pitch demo)

## Intent

A pitch piece. The developer (our user) wants to show JTS Solar (J.T.S Instal Construct S.R.L., jtssolar.ro) what they can build, to win them as a client. Success = the client opens it and says "I want that". It is not a production site: no shop, no forms that submit, no CMS.

The reference for feel and technique is **Kage** (https://mengto.github.io/kage/): a single-page, scroll-driven walk through a procedurally-built three.js world, with chaptered text panels over a fixed WebGL canvas, cinematic post-processing and a loading screen.

## Goals

- The client recognises **their own business**: their logo, their slogan, their services, their process, their real projects, their contact details.
- A cinematic, calm, Kage-like scroll experience that feels premium and smooth on a decent laptop.
- Opens instantly from a link (static site, deployable to Vercel).

## Non-goals

- E-commerce, price calculator, simulator, form submission backend.
- CMS / editable content.
- SEO, analytics, i18n (Romanian only).

## Anti-goals (failure even if it "works")

- Looks like a generic three.js template or a stock "solar" demo.
- Janky scroll, stutter, or a long blank load.
- Broken/ugly on a phone if the client opens the link there.
- Misrepresenting JTS (invented stats, fake testimonials, wrong contact info).

## Constraints

- Language: **Romanian**, content taken from jtssolar.ro (see Content).
- Brand colours from `assets/logo-jts.png`: navy (~#173B63) and sun-yellow (~#F5C21B). White/off-white for text panels.
- Assets supplied: `assets/logo-jts.png`, `assets/panou-fotovoltaic.jpg`, `assets/panou-pe-casa.webp`. Additional real project photos may be downloaded from `https://www.jtssolar.ro/wp-content/uploads/jts-foto/` (e.g. `r03-1080.webp`, `r11-1080.webp`, `b01`, `r01`, `s01`, `p336`, `p049`, `r04`, `p121`, `p337`) and stored locally — it's their own content and this is a pitch to them.
- No external 3D model files required; scene is procedural (as Kage does).

## Decided by the user

- three.js, Kage-style scroll-driven landing page.
- Use the supplied assets and jtssolar.ro's information.
- The scroll story proposed below was accepted ("it's fine").
- **Include the other two references too:**
  - **Character animation** (collectui.com reference): animated JTS installers are part of the experience, most of all in chapter 3.
  - **Framer-style micro-interactions** (coolinteraction.framer.website): rich hover, cursor and reveal interactions on the HTML layer.

## Our calls (not explicitly confirmed by the user)

- **Mood:** calm, cinematic, like Kage; time of day progresses dawn → bright midday → golden finale.
- **Stack:** Vite + vanilla three.js (no React), GSAP + ScrollTrigger for scroll-to-timeline mapping, Lenis for smooth scroll. Post-processing via a custom full-screen shader pass (bloom-ish glow, vignette, subtle grain, slight chromatic aberration), like Kage.
- **Typography:** a clean geometric sans (e.g. "Onest" or "Manrope" from Google Fonts), large display headings.
- **Deploy target:** static build, Vercel preview link to send to the client.
- **Build order (no deadline given):** staged. First a vertical slice that could be shown on its own: loader → hero → house → panels assemble (with the installer crew) → contact, plus the core micro-interactions. Then energy flows, commercial/industrial, the post-processing polish and the progress rail. If time runs short, cut or simplify the commercial/industrial and energy-flow chapters first.
- **Installer characters:** the collectui shot itself couldn't be loaded, so the style is our call. Stylised, friendly low-poly figures built in code from primitives (capsule/box limbs), wearing navy overalls and sun-yellow hard hats in the brand colours, with no model files. Animation is procedural (walk-cycle limb swings, idle breathing, lift/carry poses) and driven by scroll in chapter 3: a small crew walks in carrying panels, climbs or lifts them to the roof, and each panel snaps into place as they set it down. They give a wave or thumbs-up when the roof is done. One or two can reappear in the finale. Keep the crew small (3–4) for performance.
- **Micro-interactions:** a custom cursor that grows or labels over interactive things; magnetic buttons; staggered split-text line reveals on chapter headings; image cards with hover tilt and parallax; a hover lift on project cards; an animated progress counter in the loader. These are all disabled or simplified on touch devices and with `prefers-reduced-motion`.
- **Author credit:** the user didn't answer this. Default: a small, discreet "Concept by …" line in the footer, with the name and contact in one config constant (placeholder until the user fills it in). It's easy to remove.
- **Copy accuracy:** take headlines and claims verbatim from the live jtssolar.ro; match project photos to projects using that site's image alt texts.

## Scroll story (chapters)

A fixed full-screen canvas; HTML chapter panels scroll over it. Scroll progress 0→1 drives a camera along a `CatmullRomCurve3` path and per-chapter animations.

0. **Loader** — logo + "Ridicăm panourile… 0%" style progress readout, fades into the scene.
1. **Hero — Dawn over the hills.** Low sun rising behind stylised Argeș hills, mist/fog, particles. Logo top-left. Headline: "Mai multă energie de la soare. Mai puțină din rețea." Prompt: scroll to begin.
2. **The house.** Camera glides down to a stylised house (white walls, terracotta roof — echoing `panou-pe-casa.webp`). Copy: residential systems, with/without battery, mono/three-phase, backup output.
3. **Panels assemble.** The JTS installer crew carries the solar panels in and sets them onto the roof one by one (the signature moment). Panel surfaces use a procedural cell-grid shader that catches the sun. Copy: the 5-step process (Calculăm → Facem oferta → Montăm → Punem în funcțiune → Prosumator), each step a sub-beat.
4. **Energy flows.** Glowing lines/particles run from roof → inverter → battery/house; windows light up. Copy: storage (Stocare).
5. **Scale up — commercial & industrial.** Camera rises and pulls back; halls and a ground-mounted solar field appear across the landscape, a nod to the shipyard/Auchan projects. Copy: Comercial, Industrial, and selected projects (Șantierul Naval Constanța, Auchan Bradu & Găvana, Auchan Baia Mare & Satu Mare, Secom Turnu Măgurele, Solar Ocean Fish) — with real photos in the HTML panels.
6. **Why JTS.** Four claims: Echipe proprii, Toată România, Prosumator, Un singur interlocutor.
7. **Finale / contact.** Golden-hour wide shot. CTA "Solicitați o ofertă" (links to mailto:oferte@jtssolar.ro / tel:), phones 0771 504 694 · 0752 080 807, emails contact@ / oferte@jtssolar.ro, showroom DN65B, 117141 Geamăna, Argeș.

A thin progress rail with chapter markers (like Kage) allows jumping between chapters.

## Content source

All copy is from jtssolar.ro (Romanian). Do not invent statistics or testimonials. Product kit prices may be omitted (pitch focuses on experience); if shown, copy exactly.

## Quality bar

- 60fps target on a modern laptop; adaptive pixel ratio; reduced effects (no post pass, fewer particles) on mobile / low-end.
- Respect `prefers-reduced-motion` (no fly-ins, simple fades).
- Text remains readable over the 3D (panels with backdrop / gradient).
- Works at phone width (single column, canvas still present).

## Left to the builder

Exact geometry/shading of the procedural world, camera path keyframes, easing, shader details, file/module structure, exact type scale and spacing.
