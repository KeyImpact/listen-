// Tests für den Player: Spulen, Tempo, Zeitanzeige. Laufen mit: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aktuellesKapitel,
  kapitelSprungZiele,
  formatiereTempo,
  formatiereZeit,
  fortschrittAnteil,
  naechstesTempo,
  spulePosition,
  SPRUNG_SEK,
  kapitelLaenge,
} from '../src/lib/player-logik.ts';

test('Spulen: 15 Sekunden vor und zurück', () => {
  assert.equal(SPRUNG_SEK, 15);
  assert.equal(spulePosition(100, SPRUNG_SEK, 3000), 115);
  assert.equal(spulePosition(100, -SPRUNG_SEK, 3000), 85);
});

test('Spulen: am Anfang bleibt man bei 0, nie negativ', () => {
  assert.equal(spulePosition(5, -SPRUNG_SEK, 3000), 0);
  assert.equal(spulePosition(0, -SPRUNG_SEK, 3000), 0);
});

test('Spulen: am Ende bleibt man bei der Gesamtlänge', () => {
  assert.equal(spulePosition(2990, SPRUNG_SEK, 3000), 3000);
  assert.equal(spulePosition(3000, SPRUNG_SEK, 3000), 3000);
});

test('Spulen: ohne bekannte Länge nur nach unten begrenzt', () => {
  assert.equal(spulePosition(10, SPRUNG_SEK, null), 25);
  assert.equal(spulePosition(10, -SPRUNG_SEK, null), 0);
  assert.equal(spulePosition(10, SPRUNG_SEK, 0), 25);
});

test('Tempo: 0,5er-Schritte nach oben und unten', () => {
  assert.equal(naechstesTempo(1, 1), 1.5);
  assert.equal(naechstesTempo(1, -1), 0.5);
  assert.equal(naechstesTempo(1.5, 1), 2);
});

test('Tempo: bleibt zwischen 0,5× und 2×', () => {
  assert.equal(naechstesTempo(2, 1), 2);
  assert.equal(naechstesTempo(1.5, 1), 2);
  assert.equal(naechstesTempo(0.5, -1), 0.5);
});

test('Tempo: ein Wert, der nicht auf dem Raster liegt, rastet ein', () => {
  assert.equal(naechstesTempo(1.2, 1), 1.5);
  assert.equal(naechstesTempo(1.2, -1), 0.5);
});

test('Tempo: mehrfaches Erhöhen bleibt genau auf dem Raster', () => {
  let tempo = 0.5;
  for (let i = 0; i < 5; i++) tempo = naechstesTempo(tempo, 1);
  assert.equal(tempo, 2);
});

test('Tempo-Anzeige mit deutschem Komma', () => {
  assert.equal(formatiereTempo(1), '1×');
  assert.equal(formatiereTempo(2), '2×');
  assert.equal(formatiereTempo(1.5), '1,5×');
  assert.equal(formatiereTempo(0.5), '0,5×');
  assert.equal(formatiereTempo(2.5), '2,5×');
});

test('Zeit-Anzeige: m:ss und h:mm:ss', () => {
  assert.equal(formatiereZeit(0), '0:00');
  assert.equal(formatiereZeit(5), '0:05');
  assert.equal(formatiereZeit(75), '1:15');
  assert.equal(formatiereZeit(3599), '59:59');
  assert.equal(formatiereZeit(3600), '1:00:00');
  assert.equal(formatiereZeit(48693), '13:31:33');
});

test('Zeit-Anzeige: ungültige Werte zeigen 0:00', () => {
  assert.equal(formatiereZeit(-5), '0:00');
  assert.equal(formatiereZeit(NaN), '0:00');
  assert.equal(formatiereZeit(Infinity), '0:00');
});

test('Kapitel: passendes Kapitel zur Position, auch am Anfang und Ende', () => {
  const kapitel = [
    { titel: 'Eins', start_sek: 0, end_sek: 100 },
    { titel: 'Zwei', start_sek: 100, end_sek: 250 },
    { titel: 'Drei', start_sek: 250, end_sek: 400 },
  ];
  assert.equal(aktuellesKapitel(kapitel, 0)?.titel, 'Eins');
  assert.equal(aktuellesKapitel(kapitel, 99.9)?.titel, 'Eins');
  assert.equal(aktuellesKapitel(kapitel, 100)?.titel, 'Zwei');
  assert.equal(aktuellesKapitel(kapitel, 9999)?.titel, 'Drei');
  assert.equal(aktuellesKapitel(kapitel, 100)?.end_sek, 250);
});

test('Kapitelsprung: vorheriges und nächstes Kapitel', () => {
  const kapitel = [
    { titel: 'Eins', start_sek: 0, end_sek: 100 },
    { titel: 'Zwei', start_sek: 100, end_sek: 250 },
    { titel: 'Drei', start_sek: 250, end_sek: 400 },
  ];
  // Im Kapitel ‚Zwei‘ (ab 100), 50 s drin: zurück geht zum Anfang von Zwei, weiter zu Drei.
  assert.deepEqual(kapitelSprungZiele(kapitel, 150), { zurueck: 100, weiter: 250 });
  // 1 s nach dem Kapitelanfang: zurück geht ins Kapitel davor.
  assert.deepEqual(kapitelSprungZiele(kapitel, 101), { zurueck: 0, weiter: 250 });
  assert.deepEqual(kapitelSprungZiele(kapitel, 0), { zurueck: null, weiter: 100 });
  assert.deepEqual(kapitelSprungZiele(kapitel, 300), { zurueck: 250, weiter: null });
  assert.deepEqual(kapitelSprungZiele(kapitel, 251), { zurueck: 100, weiter: null });
});

test('Kapitelsprung: ohne Kapitel gibt es keine Ziele', () => {
  assert.deepEqual(kapitelSprungZiele([], 10), { zurueck: null, weiter: null });
});

test('Kapitel: ohne Kapitel gibt es keinen Namen', () => {
  assert.equal(aktuellesKapitel([], 10), null);
});

test('Fortschritt: Anteil zwischen 0 und 1', () => {
  assert.equal(fortschrittAnteil(50, 200), 0.25);
  assert.equal(fortschrittAnteil(300, 200), 1);
  assert.equal(fortschrittAnteil(-1, 200), 0);
  assert.equal(fortschrittAnteil(10, 0), 0);
});

test('Kapitellänge: Ende minus Anfang, nie negativ', () => {
  assert.equal(kapitelLaenge({ start_sek: 100, end_sek: 400 }), 300);
  assert.equal(kapitelLaenge({ start_sek: 400, end_sek: 100 }), 0);
});
