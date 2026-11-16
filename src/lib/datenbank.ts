// Lokale Datenbank (SQLite) für Bücher, Kapitel und Einstellungen.
// Alles bleibt auf dem Handy. Es gibt keinen Server und kein Konto.

import type { SQLiteDatabase } from 'expo-sqlite';
import type { Kapitel } from './m4b';

export interface BuchZeile {
  id: number;
  datei_uri: string;
  titel: string;
  autor: string | null;
  sprecher: string | null;
  dauer_sek: number | null;
  cover_pfad: string | null;
}

export interface NeuesBuch {
  datei_uri: string;
  titel: string;
  autor: string | null;
  sprecher: string | null;
  dauer_sek: number | null;
  kapitel: Kapitel[];
}

// Legt die Tabellen an, falls sie noch nicht da sind. Wird beim Start aufgerufen.
export async function schemaAnlegen(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS buch (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      datei_uri TEXT NOT NULL UNIQUE,
      titel TEXT NOT NULL,
      autor TEXT,
      sprecher TEXT,
      dauer_sek REAL,
      cover_pfad TEXT,
      hinzugefuegt_am TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kapitel (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buch_id INTEGER NOT NULL REFERENCES buch(id) ON DELETE CASCADE,
      nummer INTEGER NOT NULL,
      titel TEXT NOT NULL,
      start_sek REAL NOT NULL,
      end_sek REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS einstellung (
      schluessel TEXT PRIMARY KEY,
      wert TEXT NOT NULL
    );
  `);
}

export async function holeBuecher(db: SQLiteDatabase): Promise<BuchZeile[]> {
  return db.getAllAsync<BuchZeile>(
    'SELECT id, datei_uri, titel, autor, sprecher, dauer_sek, cover_pfad FROM buch ORDER BY id',
  );
}

export interface KapitelKurz {
  titel: string;
  start_sek: number;
  end_sek: number;
}

// Die Kapitel eines Buches, in der richtigen Reihenfolge.
export async function holeKapitel(db: SQLiteDatabase, buchId: number): Promise<KapitelKurz[]> {
  return db.getAllAsync<KapitelKurz>(
    'SELECT titel, start_sek, end_sek FROM kapitel WHERE buch_id = ? ORDER BY nummer',
    [buchId],
  );
}

export async function holeBekannteDateien(db: SQLiteDatabase): Promise<Set<string>> {
  const zeilen = await db.getAllAsync<{ datei_uri: string }>('SELECT datei_uri FROM buch');
  return new Set(zeilen.map((z) => z.datei_uri));
}

// Speichert ein Buch mit seinen Kapiteln in einer Transaktion.
// Eine Transaktion heißt: Entweder klappt alles, oder nichts wird gespeichert.
// Gibt die neue Buch-Nummer zurück.
export async function speichereBuch(db: SQLiteDatabase, buch: NeuesBuch): Promise<number> {
  let buchId = 0;
  await db.withTransactionAsync(async () => {
    const ergebnis = await db.runAsync(
      'INSERT INTO buch (datei_uri, titel, autor, sprecher, dauer_sek) VALUES (?, ?, ?, ?, ?)',
      buch.datei_uri,
      buch.titel,
      buch.autor,
      buch.sprecher,
      buch.dauer_sek,
    );
    buchId = ergebnis.lastInsertRowId;

    for (const kapitel of buch.kapitel) {
      await db.runAsync(
        'INSERT INTO kapitel (buch_id, nummer, titel, start_sek, end_sek) VALUES (?, ?, ?, ?, ?)',
        buchId,
        kapitel.nummer,
        kapitel.titel,
        kapitel.startSek,
        kapitel.endSek,
      );
    }
  });
  return buchId;
}

export async function setzeCoverPfad(db: SQLiteDatabase, buchId: number, pfad: string): Promise<void> {
  await db.runAsync('UPDATE buch SET cover_pfad = ? WHERE id = ?', pfad, buchId);
}

export async function holeEinstellung(db: SQLiteDatabase, schluessel: string): Promise<string | null> {
  const zeile = await db.getFirstAsync<{ wert: string }>(
    'SELECT wert FROM einstellung WHERE schluessel = ?',
    schluessel,
  );
  return zeile?.wert ?? null;
}

export async function setzeEinstellung(db: SQLiteDatabase, schluessel: string, wert: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO einstellung (schluessel, wert) VALUES (?, ?) ON CONFLICT(schluessel) DO UPDATE SET wert = excluded.wert',
    schluessel,
    wert,
  );
}
