import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statusText, designHref, nextSection, REVEAL_OBSERVERS } from '../shared.js';

test('statusText: open on a weekday morning', () => {
  assert.deepEqual(statusText(1, 10), { open: true, text: 'Abierto ahora, cierra a las 20:30' });
});

test('statusText: before opening says it opens today', () => {
  assert.deepEqual(statusText(1, 6), { open: false, text: 'Cerrado. Abre hoy a las 7:30' });
});

test('statusText: after closing on a weekday says tomorrow', () => {
  assert.deepEqual(statusText(1, 21), { open: false, text: 'Cerrado. Abre mañana a las 7:30' });
});

test('statusText: Saturday at closing time skips closed Sunday', () => {
  assert.deepEqual(statusText(6, 20), { open: false, text: 'Cerrado. Abre el lunes a las 7:30' });
});

test('statusText: Sunday says tomorrow', () => {
  assert.deepEqual(statusText(0, 12), { open: false, text: 'Cerrado. Abre mañana a las 7:30' });
});

test('statusText: Saturday morning open until 20:00', () => {
  assert.deepEqual(statusText(6, 9), { open: true, text: 'Abierto ahora, cierra a las 20:00' });
});

test('designHref: adds the section hash', () => {
  assert.equal(designHref('/calido', 'carta'), '/calido#carta');
});

test('designHref: no hash for the hero', () => {
  assert.equal(designHref('/', 'inicio'), '/');
});

test('designHref: no hash when no section is visible', () => {
  assert.equal(designHref('/calido', null), '/calido');
});

test('nextSection: picks the section with the largest visible ratio', () => {
  assert.equal(nextSection('inicio', new Map([['carta', 0.2], ['trabajar', 0.6]])), 'trabajar');
});

test('nextSection: keeps the last section when none is visible (footer)', () => {
  assert.equal(nextSection('llegar', new Map([['llegar', 0], ['historia', 0]])), 'llegar');
});

test('photos start their reveal as soon as their first pixel enters the screen', () => {
  assert.equal(REVEAL_OBSERVERS.images.threshold, 0);
  assert.equal(REVEAL_OBSERVERS.images.rootMargin, '0px 0px 0px 0px');
});

test('only photos reveal on scroll: no text observer', () => {
  assert.deepEqual(Object.keys(REVEAL_OBSERVERS), ['images']);
});

test('map: the keyed embed only on the live domain, keyless everywhere else', async () => {
  const { mapSrc, MAP_KEYLESS } = await import('../shared.js');
  const keyed = 'https://www.google.com/maps/embed/v1/place?key=abc&q=x';
  assert.equal(mapSrc(keyed, 'cafeteria.sotodev.cl'), keyed);
  assert.equal(mapSrc(keyed, '127.0.0.1'), MAP_KEYLESS);
  assert.equal(mapSrc(keyed, 'localhost'), MAP_KEYLESS);
  assert.equal(mapSrc('...key=__GOOGLE_MAPS_API_KEY__...', 'cafeteria.sotodev.cl'), MAP_KEYLESS);
  assert.ok(!MAP_KEYLESS.includes('key='));
});
