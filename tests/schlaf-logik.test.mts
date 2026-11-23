// Tests für den Sleep-Timer (reine Logik). Laufen mit: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUSBLENDEN_SEK,
  SCHLAF_MAX_MIN,
  ausblendLautstaerke,
  formatiereRest,
  kapitelEndeFuer,
  verlaengern,
} from '../src/lib/schlaf-logik.ts';

const kapitel = [
  { titel: 'Eins', start_sek: 0, end_sek: 100 },
  { titel: 'Zwei', start_sek: 100, end_sek: 300 },
  { titel: 'Drei', start_sek: 300, end_sek: 400 },
];

test('Restzeit: m:ss unter einer Stunde, sonst h:mm:ss', () => {
  assert.equal(formatiereRest(0), '0:00');
  assert.equal(formatiereRest(9), '0:09');
  assert.equal(formatiereRest(65), '1:05');
  assert.equal(formatiereRest(3599), '59:59');
  assert.equal(formatiereRest(3600), '1:00:00');
  assert.equal(formatiereRest(3725), '1:02:05');
});

test('Restzeit: Bruchteile werden aufgerundet, negative Werte ergeben 0:00', () => {
  assert.equal(formatiereRest(0.2), '0:01');
  assert.equal(formatiereRest(-5), '0:00');
});

test('Ausblenden: volle Lautstärke bis zu den letzten 15 s, dann linear bis 0', () => {
  assert.equal(ausblendLautstaerke(AUSBLENDEN_SEK + 100), 1);
  assert.equal(ausblendLautstaerke(AUSBLENDEN_SEK), 1);
  assert.equal(ausblendLautstaerke(7.5), 0.5);
  assert.equal(ausblendLautstaerke(0), 0);
  assert.equal(ausblendLautstaerke(-3), 0);
});

test('Kapitelende: das Ende des laufenden Kapitels', () => {
  assert.deepEqual(kapitelEndeFuer(kapitel, 40), { ende: 100, start: 0 });
});

test('Kapitelende: weniger als 10 s übrig, dann gilt das nächste Kapitel', () => {
  assert.deepEqual(kapitelEndeFuer(kapitel, 95), { ende: 300, start: 100 });
});

test('Kapitelende: im letzten Kapitel bleibt das eigene Ende', () => {
  assert.deepEqual(kapitelEndeFuer(kapitel, 395), { ende: 400, start: 300 });
});

test('Kapitelende: ohne Kapitel oder außerhalb aller Kapitel gibt es kein Ende', () => {
  assert.equal(kapitelEndeFuer([], 10), null);
  assert.equal(kapitelEndeFuer(kapitel, -1), null);
});

test('Verlängern addiert Minuten und bleibt bei der Obergrenze', () => {
  assert.equal(verlaengern(60, 5), 360);
  assert.equal(verlaengern(SCHLAF_MAX_MIN * 60 - 10, 15), SCHLAF_MAX_MIN * 60);
});
