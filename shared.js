// Shared by both designs (index.html = Diseño 1, calido.html = Diseño 2).
// Pure helpers are exported for tests; DOM work only happens inside init* functions.

// Demo site: no phone number on purpose, WhatsApp opens with the message prefilled
// and the visitor picks the contact. For a real client, use https://wa.me/569XXXXXXXX?text=...
const WA_TEXT = 'Hola, quiero hacer un pedido para retirar en Café Andén: ';
export const WA_URL = 'https://wa.me/?text=' + encodeURIComponent(WA_TEXT);

// Opening hours in Santiago time. day: 0 = Sunday
export const HOURS = {
  1: [7.5, 20.5], 2: [7.5, 20.5], 3: [7.5, 20.5], 4: [7.5, 20.5], 5: [7.5, 20.5],
  6: [9, 20],
  0: null,
};
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// Section ids shared by both designs; the design switch keeps the visitor on the same one
const SECTION_IDS = ['inicio', 'carta', 'trabajar', 'pedir', 'historia', 'llegar'];

export const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function fmt(h) {
  const m = Math.round((h % 1) * 60);
  return `${Math.floor(h)}:${String(m).padStart(2, '0')}`;
}

export function statusText(day, hour) {
  const today = HOURS[day];
  if (today && hour >= today[0] && hour < today[1]) {
    return { open: true, text: `Abierto ahora · cierra a las ${fmt(today[1])}` };
  }
  if (today && hour < today[0]) {
    return { open: false, text: `Cerrado · abre hoy a las ${fmt(today[0])}` };
  }
  let d = (day + 1) % 7;
  while (!HOURS[d]) d = (d + 1) % 7;
  const when = d === (day + 1) % 7 ? 'mañana' : `el ${DAY_NAMES[d]}`;
  return { open: false, text: `Cerrado · abre ${when} a las ${fmt(HOURS[d][0])}` };
}

// The section with the largest visible ratio; keeps the previous one when none is
// visible (e.g. the footer at the bottom of the page)
export function nextSection(prev, ratios) {
  let best = null;
  let bestRatio = 0;
  ratios.forEach((r, id) => { if (r > bestRatio) { best = id; bestRatio = r; } });
  return best ?? prev;
}

export function designHref(base, sectionId) {
  return !sectionId || sectionId === 'inicio' ? base : `${base}#${sectionId}`;
}

function santiagoNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, hour: Number(get('hour')) + Number(get('minute')) / 60 };
}

export function initWhatsApp() {
  document.querySelectorAll('.js-wa').forEach((a) => {
    a.href = WA_URL;
    a.target = '_blank';
    a.rel = 'noopener';
  });
}

export function initStatus() {
  const update = () => {
    const { day, hour } = santiagoNow();
    document.querySelectorAll('#horario li[data-days]').forEach((li) => {
      li.classList.toggle('is-today', Number(li.dataset.days) === day);
    });
    const { text, open } = statusText(day, hour);
    document.querySelectorAll('[data-estado]').forEach((el) => {
      el.textContent = text;
      el.classList.add('estado');
      el.classList.toggle('estado--open', open);
      el.classList.toggle('estado--closed', !open);
      el.hidden = false;
    });
  };
  update();
  setInterval(update, 60_000);
}

// Mobile sticky WhatsApp bar: hidden while any of the given sections is on screen
export function initWaBar(hideSelectors) {
  const bar = document.getElementById('wa-bar');
  if (!bar) return;
  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
    const show = visible.size === 0;
    bar.classList.toggle('is-visible', show);
    bar.setAttribute('aria-hidden', String(!show));
    bar.tabIndex = show ? 0 : -1;
  });
  hideSelectors.map((s) => document.querySelector(s)).forEach((s) => s && io.observe(s));
}

// build.mjs injects the key; without it (e.g. a local server) the photo stays.
export function initMap() {
  const mapFrame = document.querySelector('.mapa__frame');
  if (mapFrame && !mapFrame.dataset.src.includes('__GOOGLE_MAPS_API_KEY__')) {
    mapFrame.src = mapFrame.dataset.src;
    mapFrame.closest('.mapa').classList.add('has-map');
  }
}

// Keeps each "Diseño 1 / Diseño 2" link pointing at the section currently on screen,
// and shows the floating copy of the switch once the hero (and its nav) is off screen
export function initDesignSwitch() {
  const links = [...document.querySelectorAll('a[data-design-link]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  let current = null;
  const setSection = (id) => links.forEach((a) => { a.href = designHref(a.dataset.designLink, id); });
  const ratios = new Map();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
    current = nextSection(current, ratios);
    setSection(current);
  }, { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.01, 0.5, 1] });
  SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean).forEach((s) => io.observe(s));

  const float = document.querySelector('.switch--float');
  const hero = document.getElementById('inicio');
  if (float && hero) {
    new IntersectionObserver(([e]) => {
      const show = !e.isIntersecting;
      float.classList.toggle('is-visible', show);
      float.inert = !show;
    }, { threshold: 0 }).observe(hero);
  }
}

// Count-up numbers (formatted es-CL: 1.000)
const nf = new Intl.NumberFormat('es-CL');
function countUp(el) {
  const end = Number(el.dataset.count);
  const pre = el.dataset.prefix || '';
  const suf = el.dataset.suffix || '';
  const dur = 1400;
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min((t - t0) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = pre + nf.format(Math.round(end * eased)) + suf;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// Scroll reveal: siblings in the same group get a staggered delay
export function initReveal({ groups, images }) {
  const targets = [];
  groups.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.setProperty('--d', `${Math.min(i, 8) * 0.08}s`);
      targets.push(el);
    });
  });
  if (images) {
    document.querySelectorAll(images).forEach((el) => {
      el.classList.add('reveal-img');
      targets.push(el);
    });
  }

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
    return targets;
  }
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      e.target.querySelectorAll?.('[data-count]').forEach(countUp);
      if (e.target.matches('[data-count]')) countUp(e.target);
      revealIO.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  targets.forEach((el) => revealIO.observe(el));
  return targets;
}
