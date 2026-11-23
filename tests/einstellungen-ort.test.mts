// Tests für Einstellungen im Player (reine Logik). Laufen mit: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLAYER_KARTE, einstellungenPfad, imPlayerPalette } from '../src/lib/einstellungen-ort.ts';

test('Im Reiter bleiben die Pfade wie bisher', () => {
  assert.equal(einstellungenPfad('tab', 'farben'), '/farben');
  assert.equal(einstellungenPfad('tab', 'balken-dicke'), '/balken-dicke');
});

test('Im Player liegen die Unterseiten unter /player/', () => {
  assert.equal(einstellungenPfad('player', 'farben'), '/player/farben');
  assert.equal(einstellungenPfad('player', 'player-hintergrund'), '/player/player-hintergrund');
});

test('Player-Palette: Hintergrund transparent, Karten halbtransparent', () => {
  const basis = { hintergrund: '#101010', flaeche: '#1C1C1C', text: '#FFFFFF', akzent: '#00AAFF' };
  const p = imPlayerPalette(basis);
  assert.equal(p.hintergrund, 'transparent');
  assert.equal(p.flaeche, PLAYER_KARTE);
  // Die übrigen Farben bleiben unverändert.
  assert.equal(p.text, '#FFFFFF');
  assert.equal(p.akzent, '#00AAFF');
  // Das Original wird nicht verändert.
  assert.equal(basis.hintergrund, '#101010');
});
