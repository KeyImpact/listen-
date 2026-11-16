// Tests für den M4B-Leser. Laufen mit: npm test
// Die meisten Tests bauen kleine M4B-Dateien aus Bytes, damit sie ohne echte Bücher funktionieren.
// Der letzte Test liest echte Dateien aus testdaten/, falls dort welche liegen.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { open, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { berechneKapitelEnden, leseM4bMetadaten, type Leser } from '../src/lib/m4b.ts';

// ---- Helfer zum Bauen von MP4-Kästen ----

const encoder = new TextEncoder();

function verbinde(teile: Uint8Array[]): Uint8Array {
  const laenge = teile.reduce((summe, t) => summe + t.length, 0);
  const ergebnis = new Uint8Array(laenge);
  let position = 0;
  for (const teil of teile) {
    ergebnis.set(teil, position);
    position += teil.length;
  }
  return ergebnis;
}

function u32(wert: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, wert);
  return bytes;
}

function u64(wert: bigint): Uint8Array {
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, wert);
  return bytes;
}

// Typ-Text in 4 Bytes. Das © (0xA9) ist ein einzelnes Byte, deshalb charCodeAt.
function typ(text: string): Uint8Array {
  return Uint8Array.from(text, (zeichen) => zeichen.charCodeAt(0));
}

function kasten(typName: string, ...teile: Uint8Array[]): Uint8Array {
  const inhalt = verbinde(teile);
  return verbinde([u32(inhalt.length + 8), typ(typName), inhalt]);
}

// Textfeld wie "©nam": Kasten mit einem "data"-Kind (Typ 1 = Text).
function textFeld(schluessel: string, text: string): Uint8Array {
  return kasten(schluessel, kasten('data', u32(1), u32(0), encoder.encode(text)));
}

function coverFeld(bytes: Uint8Array, datentyp: number): Uint8Array {
  return kasten('covr', kasten('data', u32(datentyp), u32(0), bytes));
}

function mvhdV0(zeitskala: number, dauer: number): Uint8Array {
  return kasten('mvhd', u32(0), u32(0), u32(0), u32(zeitskala), u32(dauer));
}

function mvhdV1(zeitskala: number, dauer: number): Uint8Array {
  // Version 1 steht als erstes Byte: [1, 0, 0, 0] (nicht u32(1), das wäre Version 0).
  return kasten('mvhd', Uint8Array.of(1, 0, 0, 0), u64(0n), u64(0n), u32(zeitskala), u64(BigInt(dauer)));
}

function chapterListe(kapitel: { startSek: number; titel: string }[]): Uint8Array {
  const eintraege = kapitel.map((k) => {
    const name = encoder.encode(k.titel);
    return verbinde([u64(BigInt(Math.round(k.startSek * 10_000_000))), Uint8Array.of(name.length), name]);
  });
  // Version 0, Flags, Anzahl, dann die Einträge.
  return kasten('chpl', u32(0), Uint8Array.of(kapitel.length), ...eintraege);
}

interface BauOptionen {
  titel?: string;
  kuenstler?: string;
  albumKuenstler?: string;
  sprecher?: string;
  cover?: { bytes: Uint8Array; datentyp: number };
  kapitel?: { startSek: number; titel: string }[];
  dauerSek?: number;
  mvhdVersion1?: boolean;
  metaOhneVersion?: boolean;
  ohneUdta?: boolean;
  kapitelSpur?: { startSek: number; titel: string }[];
}

// Baut eine Kapitelspur (QuickTime-Stil): Textspur mit Tabellen, verlinkt über tref/chap.
// Die Textdaten liegen im mdat-Kasten, die Tabellen zeigen auf ihre Stelle (Offset).
function baueKapitelSpur(kapitel: { startSek: number; titel: string }[]) {
  const zeitskala = 1000;
  const namen = kapitel.map((k) => encoder.encode(k.titel));
  const eintraege = namen.map((name) => verbinde([Uint8Array.of(name.length >> 8, name.length & 0xff), name]));
  const textBytes = verbinde(eintraege);

  // Jeder Text-Eintrag dauert bis zum nächsten Kapitel. Das letzte dauert 1 Sekunde.
  const sttsEintraege = kapitel.map((k, i) => {
    const naechsterStart = kapitel[i + 1]?.startSek ?? k.startSek + 1;
    const dauer = Math.round((naechsterStart - k.startSek) * zeitskala);
    return verbinde([u32(1), u32(dauer)]);
  });
  const stts = kasten('stts', u32(0), u32(sttsEintraege.length), ...sttsEintraege);
  const stsc = kasten('stsc', u32(0), u32(1), u32(1), u32(kapitel.length), u32(1));
  const stsz = kasten('stsz', u32(0), u32(0), u32(kapitel.length), ...eintraege.map((e) => u32(e.length)));
  const mdhd = kasten('mdhd', u32(0), u32(0), u32(0), u32(zeitskala), u32(0));

  const traks = (textOffset: number): Uint8Array[] => {
    const stco = kasten('stco', u32(0), u32(1), u32(textOffset));
    const trakHauptspur = kasten(
      'trak',
      kasten('tkhd', u32(0), u32(0), u32(0), u32(1), new Uint8Array(60)),
      kasten('tref', kasten('chap', u32(2))),
    );
    const trakKapitel = kasten(
      'trak',
      kasten('tkhd', u32(0), u32(0), u32(0), u32(2), new Uint8Array(60)),
      kasten('mdia', mdhd, kasten('minf', kasten('stbl', stts, stsc, stsz, stco))),
    );
    return [trakHauptspur, trakKapitel];
  };

  return { textBytes, traks };
}

// Baut eine komplette, kleine M4B-Datei.
function baueM4b(optionen: BauOptionen = {}): Uint8Array {
  const zeitskala = 1000;
  const dauer = Math.round((optionen.dauerSek ?? 3600) * zeitskala);
  const mvhd = optionen.mvhdVersion1 ? mvhdV1(zeitskala, dauer) : mvhdV0(zeitskala, dauer);

  const ilstTeile: Uint8Array[] = [];
  if (optionen.titel) ilstTeile.push(textFeld('©nam', optionen.titel));
  if (optionen.kuenstler) ilstTeile.push(textFeld('©ART', optionen.kuenstler));
  if (optionen.albumKuenstler) ilstTeile.push(textFeld('aART', optionen.albumKuenstler));
  if (optionen.sprecher) ilstTeile.push(textFeld('©wrt', optionen.sprecher));
  if (optionen.cover) ilstTeile.push(coverFeld(optionen.cover.bytes, optionen.cover.datentyp));
  const ilst = kasten('ilst', ...ilstTeile);

  const hdlr = kasten('hdlr', u32(0), u32(0), typ('mdir'), typ('appl'), new Uint8Array(9));
  const metaInhalt = optionen.metaOhneVersion
    ? [hdlr, ilst]
    : [u32(0), hdlr, ilst]; // Ohne "u32(0)" fehlt die Version/Flags-Kopfzeile.
  const meta = kasten('meta', ...metaInhalt);

  const udtaTeile: Uint8Array[] = [meta];
  if (optionen.kapitel) udtaTeile.push(chapterListe(optionen.kapitel));
  const udta = kasten('udta', ...udtaTeile);

  const spur = optionen.kapitelSpur ? baueKapitelSpur(optionen.kapitelSpur) : null;
  const audioDummy = new Uint8Array(64);
  const ftyp = kasten('ftyp', typ('M4B '), u32(0), typ('M4B '), typ('mp42'));

  // Der moov-Kasten hat eine feste Größe. Deshalb bauen wir ihn zweimal:
  // zuerst mit Platzhalter-Offset, um seine Länge zu kennen, dann mit der echten Stelle.
  const moovFuer = (textOffset: number) => {
    const moovTeile: Uint8Array[] = [mvhd];
    if (!optionen.ohneUdta) moovTeile.push(udta);
    if (spur) moovTeile.push(...spur.traks(textOffset));
    return kasten('moov', ...moovTeile);
  };
  const moovLaenge = moovFuer(0).length;
  const textStart = ftyp.length + moovLaenge + 8 + audioDummy.length; // 8 = mdat-Kopf
  const moov = moovFuer(textStart);

  const mdat = kasten('mdat', audioDummy, spur?.textBytes ?? new Uint8Array());
  return verbinde([ftyp, moov, mdat]);
}

function leserAusBytes(bytes: Uint8Array): Leser {
  return {
    groesse: bytes.length,
    lese: async (position, laenge) => bytes.subarray(position, Math.min(position + laenge, bytes.length)),
  };
}

// Ein kleines, erkennbares "Bild" (Bytes mit JPEG-Anfang).
const testBild = Uint8Array.of(0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4);

// ---- Tests ----

test('liest Titel, Autor, Sprecher, Dauer und Cover', async () => {
  const datei = baueM4b({
    titel: 'Der Testfall',
    kuenstler: 'Anna Beispiel',
    sprecher: 'Max Sprecher',
    dauerSek: 3600,
    cover: { bytes: testBild, datentyp: 13 },
  });

  const m = await leseM4bMetadaten(leserAusBytes(datei));

  assert.equal(m.titel, 'Der Testfall');
  assert.equal(m.autor, 'Anna Beispiel');
  assert.equal(m.sprecher, 'Max Sprecher');
  assert.equal(m.dauerSek, 3600);
  assert.equal(m.cover?.endung, 'jpg');
  assert.deepEqual([...(m.cover?.bytes ?? [])], [...testBild]);
});

test('liest Kapitel mit Start und Ende', async () => {
  const datei = baueM4b({
    titel: 'Mit Kapiteln',
    dauerSek: 900,
    kapitel: [
      { startSek: 0, titel: 'Erstes Kapitel' },
      { startSek: 300, titel: 'Zweites Kapitel' },
      { startSek: 600, titel: 'Drittes Kapitel' },
    ],
  });

  const m = await leseM4bMetadaten(leserAusBytes(datei));

  assert.deepEqual(
    m.kapitel.map((k) => ({ nummer: k.nummer, titel: k.titel, startSek: k.startSek, endSek: k.endSek })),
    [
      { nummer: 1, titel: 'Erstes Kapitel', startSek: 0, endSek: 300 },
      { nummer: 2, titel: 'Zweites Kapitel', startSek: 300, endSek: 600 },
      { nummer: 3, titel: 'Drittes Kapitel', startSek: 600, endSek: 900 },
    ],
  );
});

test('liest Kapitel aus einer Kapitelspur (QuickTime-Stil)', async () => {
  const datei = baueM4b({
    titel: 'Spur-Buch',
    dauerSek: 900,
    kapitelSpur: [
      { startSek: 0, titel: 'Prolog' },
      { startSek: 120.5, titel: 'Über Ärger' },
      { startSek: 600, titel: 'Finale' },
    ],
  });

  const m = await leseM4bMetadaten(leserAusBytes(datei));

  assert.equal(m.titel, 'Spur-Buch');
  assert.deepEqual(
    m.kapitel.map((k) => [k.titel, k.startSek, k.endSek]),
    [
      ['Prolog', 0, 120.5],
      ['Über Ärger', 120.5, 600],
      ['Finale', 600, 900],
    ],
  );
});

test('Kapitel mit Umlauten im Namen bleiben lesbar', async () => {
  const datei = baueM4b({ dauerSek: 60, kapitel: [{ startSek: 0, titel: 'Über Ärger und Öl' }] });
  const m = await leseM4bMetadaten(leserAusBytes(datei));
  assert.equal(m.kapitel[0].titel, 'Über Ärger und Öl');
});

test('Datei ohne Kapitel und ohne Cover ergibt leere Felder statt Fehler', async () => {
  const datei = baueM4b({ titel: 'Nur Titel' });
  const m = await leseM4bMetadaten(leserAusBytes(datei));

  assert.equal(m.titel, 'Nur Titel');
  assert.equal(m.autor, null);
  assert.equal(m.sprecher, null);
  assert.equal(m.cover, null);
  assert.deepEqual(m.kapitel, []);
});

test('Datei ohne udta-Kasten (keine Metadaten) ergibt leere Felder', async () => {
  const datei = baueM4b({ ohneUdta: true, dauerSek: 120 });
  const m = await leseM4bMetadaten(leserAusBytes(datei));
  assert.equal(m.titel, null);
  assert.equal(m.dauerSek, 120);
});

test('Album-Künstler dient als Autor, wenn der Künstler fehlt', async () => {
  const datei = baueM4b({ albumKuenstler: 'Album Autor' });
  const m = await leseM4bMetadaten(leserAusBytes(datei));
  assert.equal(m.autor, 'Album Autor');
});

test('Künstler hat Vorrang vor Album-Künstler', async () => {
  const datei = baueM4b({ kuenstler: 'Künstler', albumKuenstler: 'Album' });
  const m = await leseM4bMetadaten(leserAusBytes(datei));
  assert.equal(m.autor, 'Künstler');
});

test('Dauer wird auch aus einem mvhd der Version 1 gelesen', async () => {
  const datei = baueM4b({ dauerSek: 5400, mvhdVersion1: true });
  const m = await leseM4bMetadaten(leserAusBytes(datei));
  assert.equal(m.dauerSek, 5400);
});

test('meta-Kasten ohne Version/Flags wird trotzdem gelesen', async () => {
  const datei = baueM4b({ titel: 'Ohne Versionsfeld', metaOhneVersion: true });
  const m = await leseM4bMetadaten(leserAusBytes(datei));
  assert.equal(m.titel, 'Ohne Versionsfeld');
});

test('PNG-Cover wird als png erkannt', async () => {
  const datei = baueM4b({ cover: { bytes: Uint8Array.of(0x89, 0x50, 0x4e, 0x47), datentyp: 14 } });
  const m = await leseM4bMetadaten(leserAusBytes(datei));
  assert.equal(m.cover?.endung, 'png');
});

test('Datei ohne ftyp wird abgelehnt', async () => {
  const datei = baueM4b({ titel: 'Egal' });
  // Ersten Kasten (ftyp) abschneiden, dann beginnt die Datei mit "moov".
  const ohneFtyp = datei.subarray(new DataView(datei.buffer, datei.byteOffset).getUint32(0));
  await assert.rejects(leseM4bMetadaten(leserAusBytes(ohneFtyp)), /ftyp fehlt/);
});

test('Datei mit kaputtem Kasten-Typ wird mit Fehler abgelehnt', async () => {
  const zufall = Uint8Array.from({ length: 200 }, (_, i) => (i * 37) % 256);
  await assert.rejects(leseM4bMetadaten(leserAusBytes(zufall)));
});

test('berechneKapitelEnden: letztes Kapitel endet an der Gesamtdauer', () => {
  const kapitel = berechneKapitelEnden(
    [
      { startSek: 0, titel: '' },
      { startSek: 10, titel: 'B' },
    ],
    25,
  );
  assert.deepEqual(
    kapitel.map((k) => [k.titel, k.endSek]),
    [
      ['Kapitel 1', 10],
      ['B', 25],
    ],
  );
});

// Echte Dateien aus testdaten/ (nicht im Repo). Ohne Dateien wird der Test übersprungen.
test('echte M4B-Dateien aus testdaten/ lassen sich lesen', async (t) => {
  const ordner = join(process.cwd(), 'testdaten');
  let namen: string[] = [];
  try {
    namen = (await readdir(ordner)).filter((n) => n.toLowerCase().endsWith('.m4b'));
  } catch {
    namen = [];
  }
  if (namen.length === 0) {
    t.skip('keine .m4b-Dateien in testdaten/');
    return;
  }

  for (const name of namen) {
    const handle = await open(join(ordner, name), 'r');
    try {
      const groesse = (await handle.stat()).size;
      const leser: Leser = {
        groesse,
        lese: async (position, laenge) => {
          const puffer = new Uint8Array(Math.min(laenge, groesse - position));
          const { bytesRead } = await handle.read(puffer, 0, puffer.length, position);
          return puffer.subarray(0, bytesRead);
        },
      };
      const m = await leseM4bMetadaten(leser);
      console.log(
        `${name}: Titel="${m.titel}" Autor="${m.autor}" Sprecher="${m.sprecher}" ` +
          `Dauer=${m.dauerSek?.toFixed(0)} s Kapitel=${m.kapitel.length} Cover=${m.cover?.endung ?? 'nein'}`,
      );
      assert.ok(m.dauerSek === null || m.dauerSek > 0);
    } finally {
      await handle.close();
    }
  }
});
