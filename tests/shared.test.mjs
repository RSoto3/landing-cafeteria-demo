import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statusText, designHref, nextSection } from '../shared.js';

test('statusText: open on a weekday morning', () => {
  assert.deepEqual(statusText(1, 10), { open: true, text: 'Abierto ahora · cierra a las 20:30' });
});

test('statusText: before opening says it opens today', () => {
  assert.deepEqual(statusText(1, 6), { open: false, text: 'Cerrado · abre hoy a las 7:30' });
});

test('statusText: after closing on a weekday says tomorrow', () => {
  assert.deepEqual(statusText(1, 21), { open: false, text: 'Cerrado · abre mañana a las 7:30' });
});

test('statusText: Saturday at closing time skips closed Sunday', () => {
  assert.deepEqual(statusText(6, 20), { open: false, text: 'Cerrado · abre el lunes a las 7:30' });
});

test('statusText: Sunday says tomorrow', () => {
  assert.deepEqual(statusText(0, 12), { open: false, text: 'Cerrado · abre mañana a las 7:30' });
});

test('statusText: Saturday morning open until 20:00', () => {
  assert.deepEqual(statusText(6, 9), { open: true, text: 'Abierto ahora · cierra a las 20:00' });
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
