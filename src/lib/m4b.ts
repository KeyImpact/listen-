// M4B-Leser: liest Titel, Autor, Sprecher, Dauer, Cover und Kapitel aus einer
// M4B-Datei (MP4-Format). Der Leser holt nur die Teile, die Metadaten enthalten,
// und lädt nie die ganze Datei (das Hörbuch selbst bleibt unberührt).
//
// Hinweis: Dieses Modul hat keine Imports, damit es auch mit Node testbar ist.

// Ein "Leser" liefert Bytes aus der Datei an einer bestimmten Stelle.
export interface Leser {
  groesse: number;
  lese(position: number, laenge: number): Promise<Uint8Array>;
}

export interface Kapitel {
  nummer: number;
  titel: string;
  startSek: number;
  endSek: number;
}

export interface Cover {
  bytes: Uint8Array;
  endung: 'jpg' | 'png';
}

export interface M4bMetadaten {
  titel: string | null;
  autor: string | null;
  sprecher: string | null;
  dauerSek: number | null;
  kapitel: Kapitel[];
  cover: Cover | null;
}

// Ein "Kasten" (Box, Atom) im MP4-Format: Typ (z. B. "moov") plus Lage in der Datei.
interface Kasten {
  typ: string;
  inhaltStart: number;
  ende: number;
}

// iTunes-Schlüssel für die Textfelder. Das © ist das Zeichen 0xA9.
const TAG_TITEL = '©nam';
const TAG_KUENSTLER = '©ART';
const TAG_ALBUM_KUENSTLER = 'aART';
const TAG_KOMPONIST = '©wrt'; // Hier steht bei Hörbüchern oft der Sprecher.
const TAG_COVER = 'covr';

const DATENTYP_JPEG = 13;
const DATENTYP_PNG = 14;

export async function leseM4bMetadaten(leser: Leser): Promise<M4bMetadaten> {
  const oberste = await findeKaesten(leser, 0, leser.groesse);
  const ftyp = oberste.find((k) => k.typ === 'ftyp');
  if (!ftyp) {
    throw new Error('Keine gültige M4B-Datei (ftyp fehlt)');
  }
  const moov = oberste.find((k) => k.typ === 'moov');
  if (!moov) {
    throw new Error('Keine gültige M4B-Datei (moov fehlt)');
  }

  const kindVonMoov = await findeKaesten(leser, moov.inhaltStart, moov.ende);
  const mvhd = kindVonMoov.find((k) => k.typ === 'mvhd');
  const udta = kindVonMoov.find((k) => k.typ === 'udta');

  const dauerSek = mvhd ? await leseDauer(leser, mvhd) : null;

  const metadaten: M4bMetadaten = {
    titel: null,
    autor: null,
    sprecher: null,
    dauerSek,
    kapitel: [],
    cover: null,
  };

  const kinderVonUdta = udta ? await findeKaesten(leser, udta.inhaltStart, udta.ende) : [];

  const meta = kinderVonUdta.find((k) => k.typ === 'meta');
  if (meta) {
    await leseMetaTags(leser, meta, metadaten);
  }

  // Kapitel gibt es in zwei Formen: "chpl" (Nero-Stil) oder eine Kapitelspur (QuickTime-Stil).
  // Zuerst "chpl" probieren, sonst die Kapitelspur.
  let rohKapitel: RohKapitel[] | null = null;
  const chpl = kinderVonUdta.find((k) => k.typ === 'chpl');
  if (chpl) {
    rohKapitel = await leseKapitel(leser, chpl);
  }
  if (!rohKapitel || rohKapitel.length === 0) {
    rohKapitel = await leseKapitelSpur(leser, kindVonMoov);
  }
  if (rohKapitel && rohKapitel.length > 0) {
    metadaten.kapitel = berechneKapitelEnden(rohKapitel, dauerSek);
  }

  return metadaten;
}

// Liest alle Kästen zwischen start und ende, ohne deren Inhalt zu laden.
async function findeKaesten(leser: Leser, start: number, ende: number): Promise<Kasten[]> {
  const kaesten: Kasten[] = [];
  let position = start;
  while (position + 8 <= ende) {
    const kopf = await leser.lese(position, Math.min(16, ende - position));
    const ansicht = new DataView(kopf.buffer, kopf.byteOffset, kopf.byteLength);
    let groesse = ansicht.getUint32(0);
    const typ = leseText(kopf, 4, 4);
    let kopfLaenge = 8;

    if (groesse === 1) {
      // 64-Bit-Größe steht direkt nach dem Typ.
      if (kopf.length < 16) break;
      groesse = Number(ansicht.getBigUint64(8));
      kopfLaenge = 16;
    } else if (groesse === 0) {
      // Größe 0 heißt: bis zum Ende des Bereichs.
      groesse = ende - position;
    }

    if (groesse < kopfLaenge || position + groesse > ende) {
      break; // Ungültiger Kasten, weiterlesen hätte keinen Sinn.
    }

    kaesten.push({ typ, inhaltStart: position + kopfLaenge, ende: position + groesse });
    position += groesse;
  }
  return kaesten;
}

async function leseDauer(leser: Leser, mvhd: Kasten): Promise<number | null> {
  // "mvhd" beginnt mit Version (1 Byte) und Flags (3 Bytes).
  const version = (await leser.lese(mvhd.inhaltStart, 1))[0];
  const bereich = mvhd.inhaltStart;
  if (version === 1) {
    const daten = await leser.lese(bereich + 20, 12); // Zeitskala (4) + Dauer (8)
    const ansicht = new DataView(daten.buffer, daten.byteOffset, daten.byteLength);
    const zeitskala = ansicht.getUint32(0);
    const dauer = Number(ansicht.getBigUint64(4));
    return zeitskala > 0 ? dauer / zeitskala : null;
  }
  const daten = await leser.lese(bereich + 12, 8); // Zeitskala (4) + Dauer (4)
  const ansicht = new DataView(daten.buffer, daten.byteOffset, daten.byteLength);
  const zeitskala = ansicht.getUint32(0);
  const dauer = ansicht.getUint32(4);
  return zeitskala > 0 ? dauer / zeitskala : null;
}

async function leseMetaTags(leser: Leser, meta: Kasten, ziel: M4bMetadaten): Promise<void> {
  // "meta" ist ein "Full Box": nach dem Kopf stehen 4 Bytes Version/Flags.
  // Manche Dateien lassen sie weg. Dann folgt direkt "hdlr".
  let start = meta.inhaltStart;
  const erkennung = await leser.lese(start + 4, 4);
  if (leseText(erkennung, 0, 4) !== 'hdlr') {
    start += 4;
  }

  const kinder = await findeKaesten(leser, start, meta.ende);
  const ilst = kinder.find((k) => k.typ === 'ilst');
  if (!ilst) return;

  const eintraege = await findeKaesten(leser, ilst.inhaltStart, ilst.ende);
  for (const eintrag of eintraege) {
    if (eintrag.typ === TAG_COVER) {
      if (!ziel.cover) {
        ziel.cover = await leseCover(leser, eintrag);
      }
      continue;
    }
    const text = await leseTextWert(leser, eintrag);
    if (text === null) continue;

    if (eintrag.typ === TAG_TITEL) ziel.titel = text;
    if (eintrag.typ === TAG_KUENSTLER && ziel.autor === null) ziel.autor = text;
    if (eintrag.typ === TAG_ALBUM_KUENSTLER && ziel.autor === null) ziel.autor = text;
    if (eintrag.typ === TAG_KOMPONIST) ziel.sprecher = text;
  }
}

// Ein Eintrag enthält ein "data"-Kind mit Datentyp, Sprache und dem eigentlichen Wert.
async function holeDatenKasten(leser: Leser, eintrag: Kasten): Promise<{ typ: number; inhalt: Uint8Array } | null> {
  const kinder = await findeKaesten(leser, eintrag.inhaltStart, eintrag.ende);
  const daten = kinder.find((k) => k.typ === 'data');
  if (!daten) return null;
  const kopf = await leser.lese(daten.inhaltStart, 8); // Datentyp (4) + Sprache (4)
  const ansicht = new DataView(kopf.buffer, kopf.byteOffset, kopf.byteLength);
  const typ = ansicht.getUint32(0) & 0x00ffffff;
  const laenge = daten.ende - (daten.inhaltStart + 8);
  if (laenge <= 0) return null;
  const inhalt = await leser.lese(daten.inhaltStart + 8, laenge);
  return { typ, inhalt };
}

async function leseTextWert(leser: Leser, eintrag: Kasten): Promise<string | null> {
  const wert = await holeDatenKasten(leser, eintrag);
  if (!wert) return null;
  const text = new TextDecoder('utf-8').decode(wert.inhalt).trim();
  return text.length > 0 ? text : null;
}

async function leseCover(leser: Leser, eintrag: Kasten): Promise<Cover | null> {
  const wert = await holeDatenKasten(leser, eintrag);
  if (!wert) return null;
  if (wert.typ === DATENTYP_JPEG) return { bytes: wert.inhalt, endung: 'jpg' };
  if (wert.typ === DATENTYP_PNG) return { bytes: wert.inhalt, endung: 'png' };
  return null;
}

interface RohKapitel {
  startSek: number;
  titel: string;
}

// Kapitel im Format "chpl" (Nero-Stil), wie es viele M4B-Tools schreiben.
async function leseKapitel(leser: Leser, chpl: Kasten): Promise<RohKapitel[]> {
  const version = (await leser.lese(chpl.inhaltStart, 1))[0];
  let position = chpl.inhaltStart + 4; // Version und Flags überspringen
  if (version !== 0) {
    position += 4; // Bei Version 1 folgen 4 unbenutzte Bytes.
  }
  const anzahl = (await leser.lese(position, 1))[0];
  position += 1;

  const kapitel: RohKapitel[] = [];
  for (let i = 0; i < anzahl; i++) {
    if (position + 9 > chpl.ende) break;
    const kopf = await leser.lese(position, 9); // Startzeit (8) + Namenslänge (1)
    const ansicht = new DataView(kopf.buffer, kopf.byteOffset, kopf.byteLength);
    const startEinheiten = ansicht.getBigUint64(0); // Einheit: 100 Nanosekunden
    const namenLaenge = kopf[8];
    position += 9;
    const name = namenLaenge > 0 ? await leser.lese(position, namenLaenge) : new Uint8Array();
    position += namenLaenge;
    kapitel.push({
      startSek: Number(startEinheiten) / 10_000_000,
      titel: new TextDecoder('utf-8').decode(name).trim(),
    });
  }
  return kapitel;
}

// Kapitelspur (QuickTime-Stil): Eine Textspur liefert pro Kapitel einen kleinen Text-Eintrag.
// Die Spur wird über "tref/chap" vom Hörbuch-Spur aus verlinkt. Die Lage der Einträge
// steht in den Tabellen der Spur (stts = Zeiten, stsc/stsz/stco = Lage in der Datei).
async function leseKapitelSpur(leser: Leser, moovKinder: Kasten[]): Promise<RohKapitel[] | null> {
  const traks = moovKinder.filter((k) => k.typ === 'trak');

  // 1. Welche Spur-IDs sind Kapitel? Das steht im "chap"-Kasten unter "tref".
  const kapitelIds: number[] = [];
  for (const trak of traks) {
    const kinder = await findeKaesten(leser, trak.inhaltStart, trak.ende);
    const tref = kinder.find((k) => k.typ === 'tref');
    if (!tref) continue;
    const verweise = await findeKaesten(leser, tref.inhaltStart, tref.ende);
    const chap = verweise.find((k) => k.typ === 'chap');
    if (!chap) continue;
    const bytes = await leseTabelle(leser, chap);
    for (let i = 0; i + 4 <= bytes.length; i += 4) {
      kapitelIds.push(leseU32(bytes, i));
    }
  }
  if (kapitelIds.length === 0) return null;

  // 2. Die Spur mit einer dieser IDs suchen und ihre Tabellen lesen.
  for (const trak of traks) {
    const kinder = await findeKaesten(leser, trak.inhaltStart, trak.ende);
    const tkhd = kinder.find((k) => k.typ === 'tkhd');
    if (!tkhd) continue;
    const id = await leseTrackId(leser, tkhd);
    if (!kapitelIds.includes(id)) continue;
    return await leseTextSpur(leser, kinder);
  }
  return null;
}

async function leseTrackId(leser: Leser, tkhd: Kasten): Promise<number> {
  // Track-ID steht bei Version 0 an Byte 12, bei Version 1 an Byte 20 (ab Inhaltsbeginn).
  const version = (await leser.lese(tkhd.inhaltStart, 1))[0];
  const bytes = await leser.lese(tkhd.inhaltStart + (version === 1 ? 20 : 12), 4);
  return leseU32(bytes, 0);
}

async function leseTextSpur(leser: Leser, trakKinder: Kasten[]): Promise<RohKapitel[] | null> {
  const mdia = trakKinder.find((k) => k.typ === 'mdia');
  if (!mdia) return null;
  const mdiaKinder = await findeKaesten(leser, mdia.inhaltStart, mdia.ende);

  const mdhd = mdiaKinder.find((k) => k.typ === 'mdhd');
  if (!mdhd) return null;
  const mdhdVersion = (await leser.lese(mdhd.inhaltStart, 1))[0];
  const zeitskala = leseU32(await leser.lese(mdhd.inhaltStart + (mdhdVersion === 1 ? 20 : 12), 4), 0);
  if (zeitskala === 0) return null;

  const minf = mdiaKinder.find((k) => k.typ === 'minf');
  if (!minf) return null;
  const minfKinder = await findeKaesten(leser, minf.inhaltStart, minf.ende);
  const stbl = minfKinder.find((k) => k.typ === 'stbl');
  if (!stbl) return null;
  const tabellen = await findeKaesten(leser, stbl.inhaltStart, stbl.ende);

  const sttsKasten = tabellen.find((k) => k.typ === 'stts');
  const stscKasten = tabellen.find((k) => k.typ === 'stsc');
  const stszKasten = tabellen.find((k) => k.typ === 'stsz');
  const stcoKasten = tabellen.find((k) => k.typ === 'stco');
  const co64Kasten = tabellen.find((k) => k.typ === 'co64');
  if (!sttsKasten || !stscKasten || !stszKasten || (!stcoKasten && !co64Kasten)) return null;

  // Zeiten jedes Eintrags (in Einheiten der Zeitskala).
  const zeiten = leseSttsZeiten(await leseTabelle(leser, sttsKasten));
  // Größe jedes Eintrags.
  const groessen = leseStszGroessen(await leseTabelle(leser, stszKasten));
  // Wo die Chunks (Blöcke) in der Datei beginnen.
  const chunkStarts = co64Kasten
    ? leseOffsetsU64(await leseTabelle(leser, co64Kasten))
    : leseOffsetsU32(await leseTabelle(leser, stcoKasten!));
  // Wie viele Einträge in jedem Chunk liegen.
  const stsc = leseStscEintraege(await leseTabelle(leser, stscKasten));

  const roh: RohKapitel[] = [];
  let eintrag = 0;
  for (let chunk = 1; chunk <= chunkStarts.length && eintrag < zeiten.length; chunk++) {
    const proChunk = stscAnzahlFuer(stsc, chunk);
    let position = chunkStarts[chunk - 1];
    for (let j = 0; j < proChunk && eintrag < zeiten.length; j++) {
      const groesse = groessen[eintrag];
      const text = await leseSpurText(leser, position, groesse);
      roh.push({ startSek: zeiten[eintrag] / zeitskala, titel: text });
      position += groesse;
      eintrag++;
    }
  }
  return roh;
}

// Liest den Inhalt eines Tabellen-Kastens. Größenlimit, damit nichts Riesiges geladen wird.
async function leseTabelle(leser: Leser, kasten: Kasten): Promise<Uint8Array> {
  const laenge = kasten.ende - kasten.inhaltStart;
  if (laenge <= 0 || laenge > 10_000_000) return new Uint8Array();
  return leser.lese(kasten.inhaltStart, laenge);
}

// Ein Kapitel-Eintrag: 2 Bytes Textlänge (Big-Endian), danach der UTF-8-Text.
async function leseSpurText(leser: Leser, position: number, groesse: number): Promise<string> {
  if (groesse < 2) return '';
  const kopf = await leser.lese(position, 2);
  const textLaenge = Math.min((kopf[0] << 8) | kopf[1], groesse - 2);
  if (textLaenge <= 0) return '';
  const text = await leser.lese(position + 2, textLaenge);
  return new TextDecoder('utf-8').decode(text).trim();
}

// stts: Liste aus (Anzahl, Dauer) je Eintrag. Ergebnis: Startzeit jedes Eintrags.
function leseSttsZeiten(bytes: Uint8Array): number[] {
  const anzahl = leseU32(bytes, 4);
  const zeiten: number[] = [];
  let zeit = 0;
  for (let i = 0; i < anzahl; i++) {
    const wiederholungen = leseU32(bytes, 8 + i * 8);
    const dauer = leseU32(bytes, 12 + i * 8);
    for (let k = 0; k < wiederholungen; k++) {
      zeiten.push(zeit);
      zeit += dauer;
    }
  }
  return zeiten;
}

// stsz: Größe jedes Eintrags. Ist die feste Größe 0, steht jede Größe einzeln in der Tabelle.
function leseStszGroessen(bytes: Uint8Array): number[] {
  const festeGroesse = leseU32(bytes, 4);
  const anzahl = leseU32(bytes, 8);
  const groessen: number[] = [];
  for (let i = 0; i < anzahl; i++) {
    groessen.push(festeGroesse !== 0 ? festeGroesse : leseU32(bytes, 12 + i * 4));
  }
  return groessen;
}

interface StscEintrag {
  ersterChunk: number;
  proChunk: number;
}

// stsc: ab welchem Chunk wie viele Einträge liegen.
function leseStscEintraege(bytes: Uint8Array): StscEintrag[] {
  const anzahl = leseU32(bytes, 4);
  const eintraege: StscEintrag[] = [];
  for (let i = 0; i < anzahl; i++) {
    eintraege.push({ ersterChunk: leseU32(bytes, 8 + i * 12), proChunk: leseU32(bytes, 12 + i * 12) });
  }
  return eintraege;
}

function stscAnzahlFuer(eintraege: StscEintrag[], chunk: number): number {
  let ergebnis = 0;
  for (const e of eintraege) {
    if (e.ersterChunk <= chunk) ergebnis = e.proChunk;
  }
  return ergebnis;
}

function leseOffsetsU32(bytes: Uint8Array): number[] {
  const anzahl = leseU32(bytes, 4);
  const offsets: number[] = [];
  for (let i = 0; i < anzahl; i++) offsets.push(leseU32(bytes, 8 + i * 4));
  return offsets;
}

function leseOffsetsU64(bytes: Uint8Array): number[] {
  const anzahl = leseU32(bytes, 4);
  const ansicht = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const offsets: number[] = [];
  for (let i = 0; i < anzahl; i++) offsets.push(Number(ansicht.getBigUint64(8 + i * 8)));
  return offsets;
}

function leseU32(bytes: Uint8Array, position: number): number {
  if (position + 4 > bytes.length) return 0;
  return ((bytes[position] << 24) | (bytes[position + 1] << 16) | (bytes[position + 2] << 8) | bytes[position + 3]) >>> 0;
}

// Jedes Kapitel endet dort, wo das nächste beginnt. Das letzte endet am Buchende.
export function berechneKapitelEnden(roh: RohKapitel[], dauerSek: number | null): Kapitel[] {
  return roh.map((k, index) => {
    const naechster = roh[index + 1];
    const endSek = naechster ? naechster.startSek : dauerSek ?? k.startSek;
    return {
      nummer: index + 1,
      titel: k.titel || `Kapitel ${index + 1}`,
      startSek: k.startSek,
      endSek,
    };
  });
}

function leseText(bytes: Uint8Array, start: number, laenge: number): string {
  let text = '';
  for (let i = start; i < start + laenge && i < bytes.length; i++) {
    text += String.fromCharCode(bytes[i]);
  }
  return text;
}
