import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (f) => readFileSync(new URL(f, root), 'utf8');

// Things that came from the reference site and must not come back
const FORBIDDEN = ['#31402d', '#242f21', '#f4ede1', '#eae0ce', 'feturbulence', '@keyframes line-up', '1240px'];

// WCAG contrast ratio between two hex colors
export function contrast(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = hex.replace('#', '').match(/../g).map((h) => {
      const c = parseInt(h, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const SITE_FILES = ['index.html', 'styles.css', 'favicon.svg', 'calido.html', 'calido.css'];

test('no reference-site values in any site file', () => {
  for (const f of SITE_FILES) {
    if (!existsSync(new URL(f, root))) continue;
    const src = read(f).toLowerCase();
    for (const bad of FORBIDDEN) assert.ok(!src.includes(bad), `${f} contains ${bad}`);
  }
});

// ---------- Diseño 1 ----------
test('D1 styles use the new palette', () => {
  const css = read('styles.css').toLowerCase();
  for (const c of ['#1e2638', '#eef0f1', '#bf5520', '#e07a3f']) assert.ok(css.includes(c), `missing ${c}`);
});

test('D1 html: theme color, noindex, new hero buttons, no hero meta line', () => {
  const html = read('index.html');
  assert.match(html, /<meta name="theme-color" content="#1E2638">/);
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.ok(!html.includes('class="hero__meta"'));
  assert.ok(html.includes('Ver la carta'));
  assert.ok(html.includes('Pedir para retirar'));
});

test('D1 contrast pairs pass AA', () => {
  assert.ok(contrast('#FFFFFF', '#BF5520') >= 4.5);
  assert.ok(contrast('#EEF0F1', '#1E2638') >= 4.5);
  assert.ok(contrast('#E07A3F', '#1E2638') >= 3);
});

// ---------- Diseño 2 ----------
const IDS = ['inicio', 'carta', 'trabajar', 'pedir', 'historia', 'llegar'];

test('D2 html: structure, hooks shared with D1, noindex', () => {
  const html = read('calido.html');
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  for (const id of IDS) assert.ok(html.includes(`id="${id}"`), `missing id ${id}`);
  assert.ok(html.includes('data-estado'));
  assert.ok(html.includes('id="horario"'));
  assert.ok(html.includes('__GOOGLE_MAPS_API_KEY__'));
  assert.ok(html.includes('<script type="module" src="calido.js"></script>'));
  assert.ok(html.includes('rel="icon" href="favicon.svg"'));
});

test('D2 has no kicker labels', () => {
  assert.ok(!read('calido.html').includes('kicker'));
  assert.ok(!read('calido.css').includes('kicker'));
});

test('D2 section titles from the approved mockup', () => {
  const html = read('calido.html');
  for (const t of ['más sale.', 'un rato largo.', 'Pídelo por WhatsApp y pasa a buscarlo.', 'ferretería.', 'del metro.']) {
    assert.ok(html.includes(t), `missing title text ${t}`);
  }
});

test('D2 menu tabs: exactly two', () => {
  const tabs = [...read('calido.html').matchAll(/<button[^>]*class="[^"]*tabs__btn[^"]*"[^>]*>([^<]*)<\/button>/g)].map((m) => m[1].trim());
  assert.deepEqual(tabs, ['Café y bebidas', 'Para comer']);
});

test('D2 content is visible without JS: hiding rules are scoped to .js', () => {
  const css = read('calido.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  for (const [, sel, body] of rules) {
    if (/opacity:\s*0[;\s]|clip-path:\s*inset\(100%/.test(body) && !/@keyframes|from|to\b/.test(sel)) {
      assert.ok(sel.includes('.js'), `rule hides content without .js: ${sel.trim()}`);
    }
  }
});

test('D2 contrast pairs pass AA', () => {
  const css = read('calido.css');
  for (const c of ['--bg: #EEF1E9', '--muted: #5C6152']) assert.ok(css.includes(c), `missing ${c}`);
  assert.ok(!css.toLowerCase().includes('#fbefe6'), 'old cream background is back');
  assert.ok(contrast('#5C6152', '#EEF1E9') >= 4.5, 'muted on bg');
  assert.ok(contrast('#3A2318', '#F6B48F') >= 4.5, 'brown on peach');
  assert.ok(contrast('#3A2318', '#9DBF9A') >= 4.5, 'brown on sage');
  assert.ok(contrast('#EEF1E9', '#3A2318') >= 4.5, 'bg on brown');
});

// ---------- Audit polish ----------
test('only the hero title carries a highlight; section titles are plain', () => {
  const d2 = read('calido.html');
  assert.equal((d2.match(/class="hl"/g) || []).length, 1);
  assert.match(d2, /<h1[^>]*>[^<]*<span class="hl">/);
});

test('no middle-dot meta strings or arrows in visible copy', () => {
  for (const f of ['index.html', 'calido.html']) {
    const body = read(f).split('<body>')[1];
    assert.ok(!body.includes('·'), `${f} has a middle dot`);
    assert.ok(!/[↓↗→]/.test(body), `${f} has an arrow`);
  }
});

test('scroll motion is photos only: no text reveal, no count-up', () => {
  for (const f of ['main.js', 'calido.js']) assert.ok(!read(f).includes('groups'), `${f} still reveals text`);
  for (const f of ['index.html', 'calido.html']) assert.ok(!read(f).includes('data-count'), `${f} still counts up`);
  for (const f of ['styles.css', 'calido.css']) assert.ok(!/\.js \.reveal \{/.test(read(f)), `${f} still hides text`);
});

test('both designs show the logo mark in nav and footer, and in the favicon', () => {
  for (const f of ['index.html', 'calido.html']) {
    assert.equal((read(f).match(/class="mark"/g) || []).length, 2, `${f}: mark in nav and footer`);
  }
  assert.ok(read('favicon.svg').includes('M7 11h14'), 'favicon uses the cup mark');
});

test('mobile menu: a button that controls the nav links, hidden without JS', () => {
  for (const [html, css] of [['index.html', 'styles.css'], ['calido.html', 'calido.css']]) {
    const h = read(html);
    assert.match(h, /<button class="menu-btn" type="button" aria-expanded="false" aria-controls="nav-links"/);
    assert.ok(h.includes('id="nav-links"'));
    assert.ok(h.includes('data-menu'));
    const c = read(css);
    assert.match(c, /\.menu-btn \{[^}]*display: none/);
    assert.match(c, /\.js \.menu-btn \{ display: grid; \}/);
  }
});

test('touch targets reach 44px on mobile', () => {
  const d1 = read('styles.css');
  assert.match(d1, /\.menu-btn \{[^}]*width: 44px; height: 44px/);
  assert.match(d1, /@media \(max-width: 859px\) \{[\s\S]*?\.switch a \{ min-height: 44px; \}/, 'D1 switch links 44px');
  assert.match(d1, /\.nav__brand \{[^}]*min-height: 44px/);
  const d2 = read('calido.css');
  assert.match(d2, /\.tabs__btn \{[^}]*min-height: 44px/);
  assert.match(d2, /\.nav__logo \{[^}]*min-height: 44px/);
  assert.match(d2, /\.switch \{ padding: 2px; \}\s*\.switch a \{ min-height: 44px;/, 'D2 switch links 44px');
});

// ---------- Design switch ----------
test('both designs carry the switch, current one marked', () => {
  const d1 = read('index.html');
  const d2 = read('calido.html');
  for (const html of [d1, d2]) {
    assert.ok(html.includes('data-design-link="/"'));
    assert.ok(html.includes('data-design-link="/calido"'));
  }
  assert.match(d1, /data-design-link="\/" href="\/" aria-current="page"/);
  assert.match(d2, /data-design-link="\/calido" href="\/calido" aria-current="page"/);
});

test('the nav is fixed in both designs, so the switch is always reachable (no floating copy)', () => {
  for (const f of ['index.html', 'calido.html']) {
    const html = read(f);
    assert.ok(!html.includes('switch--float'), `${f} still has the floating switch`);
    assert.equal((html.match(/data-design-link=/g) || []).length, 2, `${f} should have 2 switch links`);
  }
  assert.match(read('styles.css'), /\.topbar \{[^}]*position: fixed/);
  assert.match(read('calido.css'), /\.nav \{[^}]*position: fixed/);
});

test('every WhatsApp button is WhatsApp green with its icon', () => {
  for (const f of ['index.html', 'calido.html']) {
    const buttons = [...read(f).matchAll(/<a [^>]*js-wa[^>]*>([\s\S]*?)<\/a>/g)];
    assert.ok(buttons.length >= 3, `${f}: expected WhatsApp buttons`);
    for (const [, inner] of buttons) {
      assert.ok(inner.includes('class="wa-icon"'), `${f}: WhatsApp button without icon`);
      assert.equal(inner.replace(/<svg[\s\S]*<\/svg>/, '').trim(), 'Pedir por WhatsApp', `${f}: every WhatsApp button says the same thing`);
    }
  }
  for (const f of ['styles.css', 'calido.css']) {
    const css = read(f);
    assert.match(css, /--wa: #14833E/);
    assert.match(css, /--on-wa: #FFFFFF/);
  }
  assert.ok(contrast('#FFFFFF', '#14833E') >= 4.5);
});

test('focus rings stay visible on the new controls', () => {
  const d1 = read('styles.css');
  const switchRule = d1.match(/\.switch \{[^}]*\}/)[0];
  assert.ok(!/overflow:\s*hidden/.test(switchRule), 'D1 .switch clips the focus outline');
  const d2 = read('calido.css');
  const focus = d2.match(/:focus-visible \{[^}]*\}/)[0];
  assert.ok(!focus.includes('currentColor'), 'D2 focus ring uses currentColor (invisible on pressed tab)');
});

test('CSS and JS revalidate on every visit so a deploy never mixes old styles with new HTML', () => {
  const headers = read('_headers');
  for (const pattern of ['/*.css', '/*.js']) {
    const block = headers.split(pattern)[1].split(/\n\S/)[0];
    assert.match(block, /Cache-Control: public, max-age=0, must-revalidate/, `${pattern} is cached without revalidation`);
  }
});

test('D2 cards stay visible; their photos animate instead', () => {
  const js = read('calido.js');
  assert.ok(!/'\.card'/.test(js), 'cards must not be hidden by the reveal');
  assert.match(js, /initReveal\('[^']*\.card__img/);
});

test('D1 WhatsApp button and design switch use soft 8px corners', () => {
  const css = read('styles.css');
  assert.match(css, /\.btn--wa \{[^}]*border-radius: 8px/);
  assert.match(css, /\.switch \{[^}]*border-radius: 8px/);
});
