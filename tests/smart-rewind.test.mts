// Tests für Smart Rewind (reine Logik). Laufen mit: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SCHLAF_RUECKSPRUNG_MIN_SEK,
  rueckspringenFuerPause,
  staffelRueckSek,
} from '../src/lib/smart-rewind-logik.ts';

test('Staffel: Grenzwerte liegen in der richtigen Stufe', () => {
  assert.equal(staffelRueckSek(0.5), 0);
  assert.equal(staffelRueckSek(1), 2);
  assert.equal(staffelRueckSek(59), 2);
  assert.equal(staffelRueckSek(60), 5);
  assert.equal(staffelRueckSek(299), 5);
  assert.equal(staffelRueckSek(300), 10);
  assert.equal(staffelRueckSek(1799), 10);
  assert.equal(staffelRueckSek(1800), 20);
  assert.equal(staffelRueckSek(7199), 20);
  assert.equal(staffelRueckSek(7200), 30);
  assert.equal(staffelRueckSek(100000), 30);
});

const ohneManuell = { pausePosition: 100, jetztPosition: 100, nachSchlafStopp: false };

test('Kurze Pause unter 1 s: kein Rücksprung', () => {
  assert.equal(rueckspringenFuerPause({ ...ohneManuell, pauseSek: 0.4 }), 0);
});

test('Pause von 2 Min springt 5 s zurück', () => {
  assert.equal(rueckspringenFuerPause({ ...ohneManuell, pauseSek: 120 }), 5);
});

test('Manuell verschoben (Position weicht ab): kein Rücksprung', () => {
  assert.equal(
    rueckspringenFuerPause({ pauseSek: 120, pausePosition: 100, jetztPosition: 250, nachSchlafStopp: false }),
    0,
  );
});

test('Kleine Abweichung bis zur Toleranz zählt noch nicht als manuell', () => {
  assert.equal(
    rueckspringenFuerPause({ pauseSek: 120, pausePosition: 100, jetztPosition: 101.2, nachSchlafStopp: false }),
    5,
  );
});

test('Nach Sleep-Timer: mindestens 30 s, auch bei kurzer Pause', () => {
  assert.equal(SCHLAF_RUECKSPRUNG_MIN_SEK, 30);
  assert.equal(rueckspringenFuerPause({ ...ohneManuell, pauseSek: 120, nachSchlafStopp: true }), 30);
});

test('Nach Sleep-Timer: bei sehr langer Pause zählt die Staffel', () => {
  assert.equal(rueckspringenFuerPause({ ...ohneManuell, pauseSek: 8000, nachSchlafStopp: true }), 30);
});
