// Tests für Suche und Sortierung der Bibliothek. Laufen mit: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filtereBuecher, sortiereBuecher } from '../src/lib/bibliothek-logik.ts';

const buecher = [
  { titel: 'Zebra-Reise', autor: 'Ute Zimmer' },
  { titel: 'Ärger im Wald', autor: 'Anna Beispiel' },
  { titel: 'Apfelkern', autor: null },
  { titel: 'Berge', autor: 'anna Beispiel' },
];

test('Suche findet Titel, egal ob groß oder klein', () => {
  assert.deepEqual(
    filtereBuecher(buecher, 'ZEBRA').map((b) => b.titel),
    ['Zebra-Reise'],
  );
});

test('Suche findet auch den Autor', () => {
  assert.deepEqual(
    filtereBuecher(buecher, 'anna').map((b) => b.titel),
    ['Ärger im Wald', 'Berge'],
  );
});

test('Leerer Suchtext zeigt alle Bücher', () => {
  assert.equal(filtereBuecher(buecher, '   ').length, buecher.length);
});

test('Suche ohne Treffer ergibt eine leere Liste', () => {
  assert.deepEqual(filtereBuecher(buecher, 'gibt es nicht'), []);
});

test('Sortierung nach Titel A–Z, Umlaut zählt als a', () => {
  assert.deepEqual(
    sortiereBuecher(buecher, 'titel').map((b) => b.titel),
    ['Apfelkern', 'Ärger im Wald', 'Berge', 'Zebra-Reise'],
  );
});

test('Sortierung nach Autor A–Z, Bücher ohne Autor ganz unten', () => {
  assert.deepEqual(
    sortiereBuecher(buecher, 'autor').map((b) => b.titel),
    ['Ärger im Wald', 'Berge', 'Zebra-Reise', 'Apfelkern'],
  );
});

test('Sortierung verändert das Original nicht', () => {
  const kopie = [...buecher];
  sortiereBuecher(buecher, 'titel');
  assert.deepEqual(buecher, kopie);
});
