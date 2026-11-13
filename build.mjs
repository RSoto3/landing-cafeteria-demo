// Static build: copies the site to dist/ and injects the Google Maps key.
// Key comes from the GOOGLE_MAPS_API_KEY env var (Cloudflare Pages) or a local .env file.
// Without a key the placeholder stays and main.js shows a photo instead of the map.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const OUT = 'dist';
const PAGES = ['index.html', 'calido.html'];
const FILES = [...PAGES, 'styles.css', 'main.js', 'shared.js', 'calido.css', 'calido.js', 'favicon.svg', '_headers', 'img'];

function readDotEnv() {
  if (!existsSync('.env')) return {};
  return Object.fromEntries(
    readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
      }),
  );
}

const key = process.env.GOOGLE_MAPS_API_KEY || readDotEnv().GOOGLE_MAPS_API_KEY || '';

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const f of FILES) cpSync(f, `${OUT}/${f}`, { recursive: true });

for (const page of PAGES) {
  let html = readFileSync(page, 'utf8');
  if (key) html = html.replaceAll('__GOOGLE_MAPS_API_KEY__', encodeURIComponent(key));
  writeFileSync(`${OUT}/${page}`, html);
}
if (key) console.log('Map: key injected');
else console.warn('Map: GOOGLE_MAPS_API_KEY not set, photo fallback will be shown');
console.log(`Built to ${OUT}/`);
