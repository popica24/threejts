// All copy is verbatim from https://www.jtssolar.ro (homepage, Oct 2026). Do not invent claims.

const process = [
  { n: 1, title: 'Calculăm', text: 'Pornim de la consum, facturi și acoperiș.' },
  { n: 2, title: 'Facem oferta', text: 'Echipamente potrivite între ele și cu rețeaua.' },
  { n: 3, title: 'Montăm', text: 'Cu echipele JTS, oriunde în țară.' },
  { n: 4, title: 'Punem în funcțiune', text: 'Și vă arătăm cum se folosește aplicația.' },
  { n: 5, title: 'Prosumator', text: 'Pregătim dosarul, unde e inclus în ofertă.' },
];

const projects = [
  { name: 'Șantierul Naval Constanța', img: '/img/proj-santier.jpg', alt: 'Vedere aeriană: sistemul fotovoltaic executat de JTS SOLAR la Șantierul Naval Constanța', place: 'Proiect reprezentativ · Portul Constanța', text: 'Cel mai mare proiect JTS, cu structură adaptată pentru acoperișuri plane și de tip dom.' },
  { name: 'Auchan Bradu și Găvana', img: '/img/proj-auchan-pitesti.jpg', alt: 'Proiect fotovoltaic JTS SOLAR — Auchan Bradu și Găvana', place: 'Pitești', text: 'Două hipermarketuri, montaj cu orientare est-vest, fără perforarea acoperișului.' },
  { name: 'Auchan Baia Mare și Satu Mare', img: '/img/proj-auchan-baia-mare.jpg', alt: 'Proiect fotovoltaic JTS SOLAR — Auchan Baia Mare și Satu Mare', place: 'Baia Mare și Satu Mare', text: 'Sistem de montaj ales pentru a păstra intactă hidroizolația acoperișului tip membrană.' },
  { name: 'Secom', img: '/img/proj-secom.jpg', alt: 'Proiect fotovoltaic JTS SOLAR — Secom', place: 'Turnu Măgurele', text: 'Cinci locații, execuție cu echipă proprie, inclusiv fundații forate acolo unde terenul a cerut-o.' },
  { name: 'Solar Ocean Fish', img: '/img/proj-solar-ocean-fish.jpg', alt: 'Proiect fotovoltaic JTS SOLAR — Solar Ocean Fish', place: 'București', text: 'Sistem montat pe acoperișul clădirii, executat în timpul iernii.' },
];

// Project photos are matched by the site's own alt texts. Photos from the site's "Din teren" gallery, with the site's own alt texts.
const gallery = [
  { img: '/img/r11.webp', alt: 'Panouri fotovoltaice montate de JTS pe acoperișul din țiglă al unei case, cu dealuri în fundal' },
  { img: '/img/p336.webp', alt: 'Panouri fotovoltaice JTS pe un acoperiș plat' },
  { img: '/img/s01.webp', alt: 'Panouri fotovoltaice pe structură la sol, sub cer cu nori' },
  { img: '/img/p337.webp', alt: 'Sistem fotovoltaic JTS pe acoperiș tip terasă' },
  { img: '/img/p121.webp', alt: 'Panouri fotovoltaice JTS pe structură la sol' },
  { img: '/img/r04.webp', alt: 'Panouri fotovoltaice pe ambele pante ale unui acoperiș din țiglă' },
];

const claims = [
  { title: 'Echipe proprii', text: 'montatori și electricieni JTS' },
  { title: 'Toată România', text: 'de la ofertă la punerea în funcțiune' },
  { title: 'Prosumator', text: 'pregătim dosarul, unde e inclus' },
  { title: 'Un singur interlocutor', text: 'de la ofertă la punerea în funcțiune' },
];

const contact = {
  phones: ['0771 504 694', '0752 080 807'],
  emails: ['contact@jtssolar.ro', 'oferte@jtssolar.ro'],
  addressLabel: 'Showroom / punct de lucru',
  address: 'DN65B, 117141 Geamăna, Argeș',
};

const hero = {
  eyebrow: 'Sisteme fotovoltaice la cheie · în toată România',
  title: 'Mai multă energie de la soare. Mai puțină din rețea.',
  lead: 'Proiectăm și montăm sisteme fotovoltaice, cu sau fără baterie, pentru case, firme și industrie. Lucrăm cu echipele noastre de montatori și electricieni, oriunde în țară.',
  cta: 'Solicitați o ofertă',
  tour: 'Vedeți cum lucrăm',
};

const chapters = [
  { id: 'hero', kicker: 'Dimineața · răsărit', title: hero.title, body: [hero.lead] },
  {
    id: 'casa', kicker: 'Rezidențial', title: 'Curentul casei, produs pe acoperișul ei.',
    body: ['Cu sau fără baterie, monofazat sau trifazat. Cu baterie, puteți folosi seara energia stocată.'],
    items: [{ title: 'Lucrare JTS SOLAR', text: 'Sistem fotovoltaic montat de JTS SOLAR pe acoperișul unei case', img: '/img/r03.webp' }],
  },
  {
    id: 'montaj', kicker: 'Sistem complet, cu montaj', title: 'Calculăm, montăm și punem în funcțiune.',
    body: ['Dimensionăm sistemul după consum și racord, îl montăm cu echipele JTS și îl punem în funcțiune.'],
  },
  {
    id: 'stocare', kicker: 'Stocare', title: 'Lumina de azi, curentul de diseară.',
    body: ['Bateria păstrează ce produc panourile în timpul zilei, pentru a folosi energia seara.'],
    items: [
      { title: 'Ziua', text: 'Panourile produc. Casa consumă direct, iar surplusul încarcă bateria.' },
      { title: 'Seara', text: 'Bateria alimentează casa. Rețeaua acoperă consumul pe care bateria nu îl poate susține.', img: '/img/b01.webp', alt: 'Invertor hibrid, tablouri de protecție și baterie montate de JTS' },
    ],
  },
  {
    id: 'scala', kicker: 'Proiecte', title: 'Lucrări executate de echipele JTS SOLAR.',
    body: ['Lucrări reale, montate de oamenii noștri, pe case, firme și hale din toată țara.'],
    items: [
      { title: 'Comercial', text: 'Costul energiei, sub controlul firmei. Producție ziua, când firma consumă. Pe acoperiș sau pe sol, cu ofertă defalcată pe poziții.' },
      { title: 'Industrial', text: 'De la proiect la punerea în funcțiune. Hale, fabrici și centrale pe sol: structură, invertoare și trasee de cablu calculate, executate de echipele JTS.' },
    ],
  },
  {
    id: 'dece', kicker: 'De ce JTS SOLAR', title: 'De la evaluarea consumului la sistemul pus în funcțiune.',
    body: ['Instalăm cu echipele noastre: montatori și electricieni angajați JTS. Așa răspundem direct de fiecare etapă, de la calcul și ofertă la montaj, punerea în funcțiune și dosarul de prosumator, acolo unde e inclus în ofertă.'],
  },
  {
    id: 'contact', kicker: 'Solicitați o ofertă', title: 'Pentru ce tip de proiect doriți o ofertă?',
    body: ['Lucrăm în toată România. Showroomul și punctul de lucru sunt la Geamăna, lângă Pitești.'],
  },
];

export default { hero, chapters, process, projects, gallery, claims, contact };
