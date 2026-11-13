import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const SITE = ['build.mjs', 'index.html', 'styles.css', 'main.js', 'shared.js', 'calido.html', 'calido.css', 'calido.js', 'favicon.svg', '_headers', 'img'];

// Build in a temp copy without .env so the "no key" run is reliable
function buildCopy(key) {
  const dir = mkdtempSync(join(tmpdir(), 'anden-build-'));
  for (const f of SITE) cpSync(join(root, f), join(dir, f), { recursive: true });
  const env = { ...process.env, GOOGLE_MAPS_API_KEY: key };
  execFileSync(process.execPath, ['build.mjs'], { cwd: dir, env, stdio: 'pipe' });
  return dir;
}

test('build with a key injects it into both designs and copies D2 files', () => {
  const dir = buildCopy('TESTKEY');
  try {
    for (const f of ['index.html', 'calido.html']) {
      const html = readFileSync(join(dir, 'dist', f), 'utf8');
      assert.ok(html.includes('key=TESTKEY'), `${f} missing key`);
      assert.ok(!html.includes('__GOOGLE_MAPS_API_KEY__'), `${f} still has placeholder`);
    }
    for (const f of ['calido.css', 'calido.js', 'shared.js']) assert.ok(existsSync(join(dir, 'dist', f)), `dist/${f} missing`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('build without a key keeps the placeholder in both designs', () => {
  const dir = buildCopy('');
  try {
    for (const f of ['index.html', 'calido.html']) {
      assert.ok(readFileSync(join(dir, 'dist', f), 'utf8').includes('__GOOGLE_MAPS_API_KEY__'));
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
