// Demo site: no phone number on purpose, WhatsApp opens with the message prefilled
// and the visitor picks the contact. For a real client, use https://wa.me/569XXXXXXXX?text=...
const WA_TEXT = 'Hola, quiero hacer un pedido para retirar en Café Andén: ';
const WA_URL = 'https://wa.me/?text=' + encodeURIComponent(WA_TEXT);

document.querySelectorAll('.js-wa').forEach((a) => {
  a.href = WA_URL;
  a.target = '_blank';
  a.rel = 'noopener';
});

// Opening hours in Santiago time. day: 0 = Sunday
const HOURS = {
  1: [7.5, 20.5], 2: [7.5, 20.5], 3: [7.5, 20.5], 4: [7.5, 20.5], 5: [7.5, 20.5],
  6: [9, 20],
  0: null,
};
const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

function fmt(h) {
  const m = Math.round((h % 1) * 60);
  return `${Math.floor(h)}:${String(m).padStart(2, '0')}`;
}

function santiagoNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Santiago', weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, hour: Number(get('hour')) + Number(get('minute')) / 60 };
}

function updateStatus() {
  const { day, hour } = santiagoNow();
  document.querySelectorAll('#horario li').forEach((li) => {
    li.classList.toggle('is-today', Number(li.dataset.days) === day);
  });

  const el = document.getElementById('estado');
  const today = HOURS[day];
  let text;
  let open = false;

  if (today && hour >= today[0] && hour < today[1]) {
    open = true;
    text = `Abierto ahora · cierra a las ${fmt(today[1])}`;
  } else if (today && hour < today[0]) {
    text = `Cerrado · abre hoy a las ${fmt(today[0])}`;
  } else {
    let d = (day + 1) % 7;
    while (!HOURS[d]) d = (d + 1) % 7;
    const when = d === (day + 1) % 7 ? 'mañana' : `el ${DAY_NAMES[d]}`;
    text = `Cerrado · abre ${when} a las ${fmt(HOURS[d][0])}`;
  }

  el.textContent = text;
  el.className = 'estado ' + (open ? 'estado--open' : 'estado--closed');
  el.hidden = false;
}

updateStatus();
setInterval(updateStatus, 60_000);

// Mobile sticky WhatsApp bar: hidden over the hero, the order section and the footer
const bar = document.getElementById('wa-bar');
const hidingSections = ['.hero', '#pedir', '.footer'].map((s) => document.querySelector(s));
const visible = new Set();

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
  const show = visible.size === 0;
  bar.classList.toggle('is-visible', show);
  bar.setAttribute('aria-hidden', String(!show));
  bar.tabIndex = show ? 0 : -1;
});
hidingSections.forEach((s) => s && io.observe(s));

// ---------- Map ----------
// build.mjs injects the key; without it (e.g. opening index.html directly) the photo stays.
const mapFrame = document.querySelector('.mapa__frame');
if (mapFrame && !mapFrame.dataset.src.includes('__GOOGLE_MAPS_API_KEY__')) {
  mapFrame.src = mapFrame.dataset.src;
  mapFrame.closest('.mapa').classList.add('has-map');
}

// ---------- Motion ----------
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Mark elements to reveal; siblings in the same group get a staggered delay
const REVEAL_GROUPS = [
  '.sec-head > *',
  '.prod figcaption',
  '.menu__title, .menu__list li',
  '.bleed__content > .h2, .bleed__lead',
  '.datos li',
  '.pedir__text > *',
  '.historia__text > *',
  '.llegar__info > *',
];
const IMG_REVEAL = '.prod, .historia__foto, .pedir__foto';

const targets = [];
REVEAL_GROUPS.forEach((sel) => {
  document.querySelectorAll(sel).forEach((el, i) => {
    el.classList.add('reveal');
    el.style.setProperty('--d', `${Math.min(i, 8) * 0.08}s`);
    targets.push(el);
  });
});
document.querySelectorAll(IMG_REVEAL).forEach((el) => {
  el.classList.add('reveal-img');
  targets.push(el);
});
document.querySelectorAll('.prod figcaption').forEach((el) => el.style.setProperty('--d', '.3s'));

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

if (reduceMotion || !('IntersectionObserver' in window)) {
  targets.forEach((el) => el.classList.add('is-in'));
} else {
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

  // Parallax on full-bleed photos (only while on screen)
  const layers = [...document.querySelectorAll('.hero__img, .bleed__img')].map((img) => ({
    img, box: img.parentElement, active: false,
  }));
  const parallaxIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const l = layers.find((x) => x.box === e.target);
      if (l) l.active = e.isIntersecting;
    });
  });
  layers.forEach((l) => parallaxIO.observe(l.box));

  let ticking = false;
  const vh = () => window.innerHeight;
  function parallax() {
    ticking = false;
    layers.forEach(({ img, box, active }) => {
      if (!active) return;
      const r = box.getBoundingClientRect();
      // -1 when the section enters from below, +1 when it leaves at the top
      const progress = (vh() / 2 - (r.top + r.height / 2)) / (vh() / 2 + r.height / 2);
      img.style.translate = `0 ${(progress * 8).toFixed(2)}%`;
      img.style.scale = img.classList.contains('hero__img') ? '' : '1.18';
    });
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
  }, { passive: true });
  parallax();
}
