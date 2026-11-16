// Zugriff auf den Hörbuch-Ordner und die Cover-Bilder auf dem Handy.
// Android-spezifisch: Der Ordner wird über den Systemdialog gewählt (Storage Access Framework).

import { Directory, File, FileMode, Paths } from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import type { Cover } from './m4b';

// Öffnet den Systemdialog. Gibt die Adresse des gewählten Ordners zurück oder null bei Abbruch.
export async function waehleOrdner(): Promise<string | null> {
  const ergebnis = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  return ergebnis.granted ? ergebnis.directoryUri : null;
}

// Sucht alle .m4b-Dateien im Ordner und in allen Unterordnern.
export async function findeM4bDateien(ordnerUri: string): Promise<string[]> {
  const gefunden: string[] = [];
  await sammleM4b(ordnerUri, gefunden, 0);
  return gefunden;
}

async function sammleM4b(uri: string, gefunden: string[], tiefe: number): Promise<void> {
  // Eine Obergrenze schützt vor endlosen Schleifen bei seltsamen Ordnerstrukturen.
  if (tiefe > 10) return;

  let kinder: string[];
  try {
    kinder = await StorageAccessFramework.readDirectoryAsync(uri);
  } catch {
    return; // Keine Ordner: Das ist eine Datei, also nichts zu durchsuchen.
  }

  for (const kind of kinder) {
    if (istM4bDatei(kind)) {
      gefunden.push(kind);
    } else {
      await sammleM4b(kind, gefunden, tiefe + 1);
    }
  }
}

function istM4bDatei(uri: string): boolean {
  return dekodiere(uri).toLowerCase().endsWith('.m4b');
}

// Dateiname aus der Adresse, für den Titel, falls das Buch keinen Titel hat.
export function dateinamenOhneEndung(uri: string): string {
  const name = dekodiere(uri).split('/').pop() ?? uri;
  return name.replace(/\.m4b$/i, '');
}

function dekodiere(uri: string): string {
  try {
    return decodeURIComponent(uri);
  } catch {
    return uri;
  }
}

// Öffnet eine Datei zum Lesen. Der Aufrufer muss handle.close() aufrufen.
export function oeffneZumLesen(uri: string) {
  return new File(uri).open(FileMode.ReadOnly);
}

// Speichert das Cover im App-Speicher unter dem Namen der Buch-Nummer. Gibt den Pfad zurück.
export async function speichereCover(buchId: number, cover: Cover): Promise<string> {
  const ordner = new Directory(Paths.document, 'cover');
  ordner.create({ idempotent: true, intermediates: true });
  const datei = new File(ordner, `${buchId}.${cover.endung}`);
  await datei.write(cover.bytes);
  return datei.uri;
}
