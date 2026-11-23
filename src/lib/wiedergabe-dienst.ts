// Der Wiedergabe-Dienst läuft im Hintergrund, auch wenn die App nicht offen ist.
// Hier landen die Knöpfe von Sperrbildschirm, Benachrichtigung und Kopfhörern. Hier merken wir uns auch jede Pause (Smart Rewind).
import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';
import TrackPlayer, { Event, State } from 'react-native-track-player';

import { holeEinstellung, setzeEinstellung } from '@/lib/datenbank';
import { rueckspringenFuerPause } from '@/lib/smart-rewind-logik';

// Schlüssel in der Einstellungstabelle: der Stand der letzten Pause und das Merkzeichen „Sleep-Timer hat gestoppt“.
export const PAUSE_MERKER = 'pause_merker';
export const SCHLAF_STOPP_FLAG = 'schlaf_stopp';

let datenbank: SQLiteDatabase | null = null;
function holeDatenbank(): SQLiteDatabase {
  if (!datenbank) datenbank = openDatabaseSync('listen.db');
  return datenbank;
}

// Der Zustand, den wir beim letzten Ereignis gesehen haben. Daran erkennen wir: Ging es von „spielt“ auf „Pause“?
let vorher: State | null = null;

// Merkt sich den Moment und die Stelle einer Pause. Der Sleep-Timer setzt vorher ein Zeichen.
async function merkePause(): Promise<void> {
  const db = holeDatenbank();
  const fortschritt = await TrackPlayer.getProgress();
  const schlaf = (await holeEinstellung(db, SCHLAF_STOPP_FLAG)) === '1';
  if (schlaf) await setzeEinstellung(db, SCHLAF_STOPP_FLAG, '');
  await setzeEinstellung(
    db,
    PAUSE_MERKER,
    JSON.stringify({ zeit: Date.now(), position: fortschritt.position, schlaf }),
  );
}

// Beim Weiterspielen: Ist eine Pause gemerkt, springen wir je nach Dauer ein Stück zurück.
async function rueckspringenBeimStart(): Promise<void> {
  const db = holeDatenbank();
  const roh = await holeEinstellung(db, PAUSE_MERKER);
  if (!roh) return;
  // Die Pause ist damit verbraucht. Ein zweiter Start springt nicht noch einmal.
  await setzeEinstellung(db, PAUSE_MERKER, '');
  const merker = JSON.parse(roh) as { zeit: number; position: number; schlaf: boolean };
  const fortschritt = await TrackPlayer.getProgress();
  const rueck = rueckspringenFuerPause({
    pauseSek: (Date.now() - merker.zeit) / 1000,
    pausePosition: merker.position,
    jetztPosition: fortschritt.position,
    nachSchlafStopp: merker.schlaf,
  });
  if (rueck > 0) await TrackPlayer.seekTo(Math.max(0, fortschritt.position - rueck));
}

// Startet die Wiedergabe. Zuerst wird ggf. zurückgesprungen, erst dann läuft der Ton.
// So hört man den Abschnitt nicht noch einmal kurz, bevor der Sprung passiert.
export async function startenMitRueckspruung(): Promise<void> {
  try {
    await rueckspringenBeimStart();
  } catch (fehler) {
    console.warn('Zurückspringen fehlgeschlagen:', fehler);
  }
  await TrackPlayer.play();
}

export async function wiedergabeDienst(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    void startenMitRueckspruung();
  });
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    void TrackPlayer.pause();
  });
  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    void TrackPlayer.pause();
  });
  TrackPlayer.addEventListener(Event.RemoteSeek, (e) => {
    void TrackPlayer.seekTo(e.position);
  });
  // Vor und Zurück in der Benachrichtigung springen um die eingestellte Spulzeit.
  TrackPlayer.addEventListener(Event.RemoteJumpForward, (e) => {
    void TrackPlayer.seekBy(e.interval);
  });
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, (e) => {
    void TrackPlayer.seekBy(-e.interval);
  });
  // Smart Rewind: Jede Pause wird gemerkt, und beim Weiterspielen springen wir ggf. zurück.
  TrackPlayer.addEventListener(Event.PlaybackState, (e) => {
    const war = vorher;
    vorher = e.state;
    if (e.state === State.Paused && war === State.Playing) {
      void merkePause().catch((fehler) => console.warn('Pause konnte nicht gemerkt werden:', fehler));
    } else if (e.state === State.Playing && war !== State.Playing) {
      void rueckspringenBeimStart().catch((fehler) => console.warn('Zurückspringen fehlgeschlagen:', fehler));
    }
  });
}
