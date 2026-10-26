// Renders content.js into the scrolling chapter sections that sit over the WebGL canvas.

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('data')) el.setAttribute(k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`), v);
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c != null) el.append(c);
  return el;
}

const tel = (phone) => `tel:${phone.replace(/\s/g, '')}`;

function photoCard({ img, alt, title, text }, cls = '') {
  const image = h('img', { src: img, alt: alt ?? text ?? title ?? '', loading: 'lazy', decoding: 'async' });
  const card = h('figure', { class: `card ${cls}`.trim() },
    h('div', { class: 'card__media' }, image),
    title || text ? h('figcaption', {}, title && h('strong', {}, title), text && h('span', {}, text)) : null,
  );
  image.addEventListener('error', () => card.classList.add('img-fallback'), { once: true });
  return card;
}

function textCard({ title, text, place, img, alt }, cls = 'tile') {
  const media = img && h('div', { class: 'tile__media' }, h('img', { src: img, alt: alt ?? title, loading: 'lazy', decoding: 'async' }));
  if (media) media.firstChild.addEventListener('error', () => media.classList.add('img-fallback'), { once: true });
  return h('article', { class: cls },
    media,
    place && h('span', { class: 'tile__meta' }, place),
    h('h3', {}, title),
    h('p', {}, text),
  );
}

function header(ch, level = 'h2') {
  return [
    h('p', { class: 'kicker' }, ch.kicker),
    h(level, { class: 'title', dataReveal: '' }, ch.title),
    ...ch.body.map((p) => h('p', { class: 'lead' }, p)),
  ];
}

const builders = {
  hero(ch, c) {
    return [
      h('p', { class: 'kicker' }, c.hero.eyebrow),
      h('h1', { class: 'title title--hero', dataReveal: '' }, ch.title),
      h('p', { class: 'lead' }, ch.body[0]),
      h('div', { class: 'actions' },
        h('a', { class: 'btn btn--primary', href: '#contact', dataMagnetic: '' }, c.hero.cta),
        h('a', { class: 'btn btn--ghost', href: '#montaj', dataMagnetic: '' }, c.hero.tour),
      ),
      h('ul', { class: 'badges' }, c.claims.slice(0, 3).map((k) => h('li', {}, h('strong', {}, k.title), h('span', {}, k.text)))),
    ];
  },
  casa: (ch) => [...header(ch), h('div', { class: 'cards' }, ch.items.map((i) => photoCard(i)))],
  montaj: (ch, c) => [
    ...header(ch),
    h('ol', { class: 'steps' }, c.process.map((s) =>
      h('li', { class: 'step', dataStep: String(s.n) },
        h('span', { class: 'step__n' }, String(s.n).padStart(2, '0')),
        h('div', {}, h('h3', {}, s.title), h('p', {}, s.text))))),
  ],
  stocare: (ch) => [...header(ch), h('div', { class: 'cards cards--split' },
    ch.items.map((i) => (i.img ? photoCard(i) : textCard(i))))],
  scala: (ch, c) => [
    ...header(ch),
    // One container so phones can show solutions + projects as a single swipe row.
    h('div', { class: 'works' },
      h('div', { class: 'tiles' }, ch.items.map((i) => textCard(i))),
      h('div', { class: 'projects' }, c.projects.map((p) => textCard({ title: p.name, text: p.text, place: p.place, img: p.img, alt: p.alt }, 'tile tile--project'))),
    ),
    h('div', { class: 'gallery' }, c.gallery.map((g) => photoCard(g, 'card--gallery'))),
  ],
  dece: (ch, c) => [...header(ch), h('div', { class: 'tiles tiles--claims' }, c.claims.map((k) => textCard(k, 'tile tile--claim')))],
  contact: (ch, c) => [
    ...header(ch),
    h('div', { class: 'actions' },
      h('a', { class: 'btn btn--primary btn--big', href: `mailto:${c.contact.emails[1]}`, dataMagnetic: '' }, c.hero.cta),
    ),
    h('dl', { class: 'contact' },
      h('div', {}, h('dt', {}, 'Telefon'), h('dd', {}, c.contact.phones.map((p) => h('a', { href: tel(p), dataMagnetic: '' }, p)))),
      h('div', {}, h('dt', {}, 'Email'), h('dd', {}, c.contact.emails.map((e) => h('a', { href: `mailto:${e}` }, e)))),
      h('div', {}, h('dt', {}, c.contact.addressLabel), h('dd', {}, c.contact.address)),
    ),
  ],
};

export function renderChapters(root, content, credit) {
  const sections = content.chapters.map((ch) =>
    h('section', { class: `chapter chapter--${ch.id}`, id: ch.id, dataChapter: ch.id },
      h('div', { class: 'panel' }, builders[ch.id](ch, content))));
  root.append(...sections);

  const foot = h('footer', { class: 'footer' },
    h('p', {}, 'JTS SOLAR este brandul J.T.S Instal Construct S.R.L.'),
    credit?.name ? h('p', { class: 'credit' }, 'Concept by ',
      credit.url ? h('a', { href: credit.url }, credit.name) : credit.name) : null,
  );
  sections.at(-1).append(foot);
  return sections;
}
