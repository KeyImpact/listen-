// Verbindet Ordner, M4B-Leser und Datenbank: Liest alle neuen Bücher eines Ordners ein.
// Bereits bekannte Dateien werden übersprungen, deshalb entstehen keine Doppelten.

import type { SQLiteDatabase } from 'expo-sqlite';
import { holeBekannteDateien, setzeCoverPfad, speichereBuch } from './datenbank';
import { leseM4bMetadaten, type Leser } from './m4b';
import { dateinamenOhneEndung, findeM4bDateien, oeffneZumLesen, speichereCover } from './ordner';

type LeseHandle = ReturnType<typeof oeffneZumLesen>;

export interface EinleseErgebnis {
  neu: number;
  bereitsBekannt: number;
  fehler: string[];
}

export async function ordnerEinlesen(
  db: SQLiteDatabase,
  ordnerUri: string,
  fortschritt?: (verarbeitet: number, gesamt: number) => void,
): Promise<EinleseErgebnis> {
  const alle = await findeM4bDateien(ordnerUri);
  const bekannt = await holeBekannteDateien(db);
  const neue = alle.filter((uri) => !bekannt.has(uri));

  let neu = 0;
  const fehler: string[] = [];
  for (let i = 0; i < neue.length; i++) {
    const uri = neue[i];
    try {
      await leseUndSpeichere(db, uri);
      neu++;
    } catch (fehlerObjekt) {
      const grund = fehlerObjekt instanceof Error ? fehlerObjekt.message : 'unbekannter Fehler';
      fehler.push(`${dateinamenOhneEndung(uri)}: ${grund}`);
    }
    fortschritt?.(i + 1, neue.length);
  }

  return { neu, bereitsBekannt: alle.length - neue.length, fehler };
}

async function leseUndSpeichere(db: SQLiteDatabase, uri: string): Promise<void> {
  const handle = oeffneZumLesen(uri);
  let metadaten;
  try {
    metadaten = await leseM4bMetadaten(leserAusHandle(handle));
  } finally {
    handle.close();
  }

  const buchId = await speichereBuch(db, {
    datei_uri: uri,
    titel: metadaten.titel ?? dateinamenOhneEndung(uri),
    autor: metadaten.autor,
    sprecher: metadaten.sprecher,
    dauer_sek: metadaten.dauerSek,
    kapitel: metadaten.kapitel,
  });

  if (metadaten.cover) {
    const pfad = await speichereCover(buchId, metadaten.cover);
    await setzeCoverPfad(db, buchId, pfad);
  }
}

// Macht aus der Datei-Schnittstelle den schlanken Leser, den der M4B-Leser braucht.
function leserAusHandle(handle: LeseHandle): Leser {
  return {
    groesse: handle.size ?? 0,
    lese: async (position, laenge) => {
      handle.offset = position;
      return handle.readBytes(laenge);
    },
  };
}
