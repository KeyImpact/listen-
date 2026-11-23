// Tests für den Cover-Hintergrund (reine Logik). Laufen mit: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ABDUNKEL_STANDARD,
  KONTRAST_TEXT_MIN,
  abdunkeln,
  abdunklungFuer,
  farbeAusPalette,
  hexZuRgb,
  kontrast,
  normalisiereFarbe,
  relativeHelligkeit,
  verlaufFuer,
} from '../src/lib/cover-thema-logik.ts';

const helligkeitVon = (hex: string) => {
  const { r, g, b } = hexZuRgb(hex);
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2 / 255;
};

const saettigungVon = (hex: string) => {
  const { r, g, b } = hexZuRgb(hex);
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  if (max === min) return 0;
  return l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
};

test('Normalisieren: sehr helle Farbe wird auf höchstens 40 % Helligkeit gedrückt', () => {
  const ergebnis = normalisiereFarbe('#ffd0a0');
  assert.ok(helligkeitVon(ergebnis) <= 0.4 + 0.01, ergebnis);
});

test('Normalisieren: sehr dunkle Farbe wird auf mindestens 25 % Helligkeit angehoben', () => {
  const ergebnis = normalisiereFarbe('#050a10');
  assert.ok(helligkeitVon(ergebnis) >= 0.25 - 0.01, ergebnis);
});

test('Normalisieren: neongrelle Farbe wird nicht über 70 % Sättigung gehoben', () => {
  const ergebnis = normalisiereFarbe('#00ff66');
  assert.ok(saettigungVon(ergebnis) <= 0.7 + 0.01, ergebnis);
});

test('Normalisieren: graue Cover bleiben grau', () => {
  const ergebnis = normalisiereFarbe('#808080');
  const { r, g, b } = hexZuRgb(ergebnis);
  assert.ok(Math.abs(r - g) <= 1 && Math.abs(g - b) <= 1, ergebnis);
});

test('Kontrast: Weiß auf Schwarz ist 21:1', () => {
  assert.ok(Math.abs(kontrast('#ffffff', '#000000') - 21) < 0.01);
  assert.ok(Math.abs(relativeHelligkeit('#000000')) < 1e-9);
});

test('Abdunkelung: dunkler Hintergrund behält die gewählte Stärke', () => {
  assert.equal(abdunklungFuer(ABDUNKEL_STANDARD, '#101820'), ABDUNKEL_STANDARD);
});

test('Abdunkelung: helles Cover wird so weit abgedunkelt, dass Text lesbar ist', () => {
  const alpha = abdunklungFuer(0.2, '#f5f5f0');
  assert.ok(alpha > 0.2, 'muss nachgezogen werden');
  assert.ok(kontrast('#ffffff', abdunkeln('#f5f5f0', alpha)) >= KONTRAST_TEXT_MIN);
});

test('Abdunkelung: wird nie über 75 % erhöht', () => {
  assert.ok(abdunklungFuer(0.2, '#ffffff') <= 0.75 + 1e-9);
});

test('Verlauf: Cover-Farbe oben, App-Farbe ab 65 % und unten', () => {
  const v = verlaufFuer('#2a6fb0', '#1a1a1a');
  assert.deepEqual(v.stellen, [0, 0.65, 1]);
  assert.equal(v.farben[1], '#1a1a1a');
  assert.equal(v.farben[2], '#1a1a1a');
});

test('Farbe für den Verlauf: vibrant vor dominant vor muted, sonst Akzent', () => {
  assert.equal(farbeAusPalette({ vibrant: '#111111', dominant: '#222222', muted: '#333333' }, '#444444'), '#111111');
  assert.equal(farbeAusPalette({ dominant: '#222222', muted: '#333333' }, '#444444'), '#222222');
  assert.equal(farbeAusPalette({ muted: '#333333' }, '#444444'), '#333333');
  assert.equal(farbeAusPalette(null, '#444444'), '#444444');
});
