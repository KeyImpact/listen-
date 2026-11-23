import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import TrackPlayer, { Capability, Event, State } from 'react-native-track-player';
import { useSQLiteContext } from 'expo-sqlite';

import {
  holeEinstellung,
  setzeEinstellung,
  holeFortschritt,
  holeKapitel,
  holeLetzterStand,
  speichereFortschritt,
  type BuchZeile,
  type KapitelKurz,
} from '@/lib/datenbank';
import {
  aktuellesKapitel,
  balkenDickeFuer,
  KAPITEL_TOLERANZ_SEK,
  STANDARD_BALKEN,
  kapitelSprungZiele,
  rasteTempo,
  sperrbildschirmDaten,
  spulePosition,
  STANDARD_SPRUNG_SEK,
} from '@/lib/player-logik';
import { ausblendLautstaerke, kapitelEndeFuer, verlaengern } from '@/lib/schlaf-logik';
import { SCHLAF_STOPP_FLAG, startenMitRueckspruung } from '@/lib/wiedergabe-dienst';
import {
  ABDUNKEL_STANDARD,
  HINTERGRUND_STANDARD,
  type HintergrundModus,
} from '@/lib/cover-thema-logik';

const EINSTELLUNG_HINTERGRUND = 'player_hintergrund';
const EINSTELLUNG_ABDUNKEL = 'player_abdunkel';

// Die Spulzeiten für die beiden Knöpfe: „zurueck“ für −, „vor“ für +.
export type SpulRichtung = 'zurueck' | 'vor';
export interface Spulzeiten {
  zurueck: number;
  vor: number;
}
const EINSTELLUNG_SPULZEIT: Record<SpulRichtung, string> = {
  zurueck: 'spulzeit_zurueck',
  vor: 'spulzeit_vor',
};
// Das zuletzt benutzte Tempo. Es gilt für alle Bücher und ist am Anfang 1×.
const EINSTELLUNG_TEMPO = 'tempo';
// Die beiden äußeren Knöpfe (ganz links und ganz rechts). Sie sind aus, bis man sie einschaltet.
// Die beiden äußeren Knöpfe gehen nur gemeinsam an oder aus. Jeder hat aber seine eigene Spulzeit.
const EINSTELLUNG_AUSSEN_SEK: Record<SpulRichtung, string> = {
  zurueck: 'spulzeit_aussen_zurueck',
  vor: 'spulzeit_aussen_vor',
};
const EINSTELLUNG_AUSSEN_AKTIV = 'knopf_aussen_aktiv';
const STANDARD_AUSSEN_SEK = 30;
const EINSTELLUNG_BALKEN = 'balken_dicke';

// Der Abschnitt ist das aktuelle Kapitel. Hat das Buch keine Kapitel, ist es das ganze Buch.
// Der Zeitstrahl und das Antippen beziehen sich auf den Abschnitt.
export interface Abschnitt {
  titel: string | null;
  start: number;
  laenge: number;
}

// Optionen beim Öffnen eines Buches.
export interface OeffneOptionen {
  // Startstelle in Sekunden. Ohne Angabe wird die gemerkte Stelle genommen (oder 0).
  position?: number;
  // true: Das Buch wird nur geladen und steht an der Stelle, ohne zu spielen.
  pausiert?: boolean;
}

// Der Player gehört der ganzen App: Mini-Player, Bibliothek und Player-Bildschirm sehen dieselbe Wiedergabe.
interface PlayerWert {
  buch: BuchZeile | null;
  abschnitt: Abschnitt;
  position: number; // Position im ganzen Buch, in Sekunden (bei einem Sprung schon das Ziel)
  dauer: number; // Länge des ganzen Buches, in Sekunden
  spielt: boolean;
  tempo: number;
  oeffneBuch: (buch: BuchZeile, optionen?: OeffneOptionen) => Promise<void>;
  umschalten: () => void;
  spulen: (sekunden: number) => void;
  springeInAbschnitt: (anteil: number) => void; // anteil zwischen 0 und 1
  springeZu: (sekunden: number) => void;
  // Startzeiten des vorherigen und nächsten Kapitels, null wenn es keins gibt.
  kapitelSprung: { zurueck: number | null; weiter: number | null };
  tempoSetzen: (wert: number) => void; // Setzt das Tempo auf einen Wert. Er wird auf das Raster gerundet.
  spulzeiten: Spulzeiten;
  setzeSpulzeit: (richtung: SpulRichtung, sekunden: number) => void;
  // Die äußeren Knöpfe: an/aus und Spulzeit.
  aussenAktiv: boolean;
  setzeAussenAktiv: (an: boolean) => void;
  aussenSek: Record<SpulRichtung, number>;
  setzeAussenSek: (richtung: SpulRichtung, sekunden: number) => void;
  // Dicke des Fortschrittsbalkens: der gespeicherte Schlüssel und die Dicke in Pixel.
  balkenWahl: string;
  balkenDicke: number;
  setzeBalkenDicke: (schluessel: string) => void;
  // Hintergrund des Players: Modus (Standard, unscharf, Farbverlauf) und Abdunkelung (Anteil 0 bis 1).
  hintergrund: HintergrundModus;
  setzeHintergrund: (modus: HintergrundModus) => void;
  abdunkel: number;
  setzeAbdunkel: (wert: number) => void;
  // Sleep-Timer: Anzeige, Start (Minuten oder 'kapitel', null = aus) und Verlängern um Minuten.
  schlaf: SchlafAnzeige;
  hatKapitel: boolean;
  setzeSchlaf: (wahl: number | 'kapitel' | null) => void;
  verlaengereSchlaf: (minuten: number) => void;
}

// Knöpfe, die Sperrbildschirm und Benachrichtigung zeigen. Vor und Zurück springen um die Spulzeit.
const KNOEPFE = [Capability.Play, Capability.Pause, Capability.JumpBackward, Capability.JumpForward, Capability.SeekTo];

// Richtet den Player einmal ein. Die Funktion merkt sich das Ergebnis, damit nichts doppelt läuft.
let einrichtung: Promise<void> | null = null;
function sicherEingerichtet(): Promise<void> {
  if (!einrichtung) {
    einrichtung = (async () => {
      try {
        // autoHandleInterruptions: Der Player pausiert, wenn eine andere App (z. B. Spotify) den Ton übernimmt.
        await TrackPlayer.setupPlayer({ autoHandleInterruptions: true });
      } catch {
        // Der Player ist schon eingerichtet (zum Beispiel nach einem Neuladen der Oberfläche).
      }
      await TrackPlayer.updateOptions(optionenFuer(STANDARD_SPRUNG_SEK, STANDARD_SPRUNG_SEK));
    })();
  }
  return einrichtung;
}

// Alle Optionen des Players. updateOptions ersetzt die Einstellungen komplett. Fehlt eine, verschwindet sie.
// Deshalb schicken wir immer alles zusammen, auch wenn sich nur die Spulzeit ändert.
function optionenFuer(vor: number, zurueck: number) {
  return {
    capabilities: KNOEPFE,
    notificationCapabilities: KNOEPFE,
    forwardJumpInterval: vor,
    backwardJumpInterval: zurueck,
    progressUpdateEventInterval: 0.5,
  };
}

// Titel, Künstler und Cover für die Benachrichtigung. Titel ist das Kapitel, sonst das Buch.
function metadatenFuer(buch: BuchZeile, kapitelTitel: string | null) {
  const daten = sperrbildschirmDaten(buch, kapitelTitel);
  return { title: daten.title, artist: daten.artist, artwork: daten.artworkUrl };
}

// Der Sleep-Timer: aus, nach einer Dauer oder bis zum Kapitelende. restSek gibt es nur bei einer Dauer.
export type SchlafModus = 'aus' | 'dauer' | 'kapitel';
export interface SchlafAnzeige {
  modus: SchlafModus;
  restSek: number | null;
}

const PlayerKontext = createContext<PlayerWert | null>(null);

// Setzt die Lautstärke des Players nur, wenn sie sich merklich ändert. Stufen von 0,05 reichen für ein sanftes Ausblenden.
function lautstaerkeAnwenden(merker: { lautstaerke: number }, wert: number) {
  const gerundet = Math.round(wert * 20) / 20;
  if (merker.lautstaerke === gerundet) return;
  merker.lautstaerke = gerundet;
  TrackPlayer.setVolume(gerundet).catch(() => {});
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();

  const [buch, setBuch] = useState<BuchZeile | null>(null);
  const [kapitel, setKapitel] = useState<KapitelKurz[]>([]);
  const [tempo, setTempo] = useState(1);
  // Der Zustand des Players (Laden, Spielen, Pause ...) und die letzte gemeldete Stelle.
  const [zustand, setZustand] = useState<State>(State.None);
  const [spieltAbsicht, setSpieltAbsicht] = useState(false);
  const [fortschritt, setFortschritt] = useState({ position: 0, duration: 0 });
  // Das Ziel eines Sprungs. Die App zeigt es, bis der Player dort angekommen ist.
  const [sprungZiel, setSprungZielState] = useState<number | null>(null);
  // Play wurde gedrückt, während das Buch noch lädt. Dann zeigt die Anzeige schon „Pause“.
  const [ladeSpielen, setLadeSpielen] = useState(false);
  const [spulzeiten, setSpulzeiten] = useState<Spulzeiten>({ zurueck: STANDARD_SPRUNG_SEK, vor: STANDARD_SPRUNG_SEK });
  const [aussenAktiv, setAussenAktiv] = useState(false);
  const [aussenSek, setAussenSek] = useState<Record<SpulRichtung, number>>({
    zurueck: STANDARD_AUSSEN_SEK,
    vor: STANDARD_AUSSEN_SEK,
  });
  const [balkenWahl, setBalkenWahl] = useState<string>(STANDARD_BALKEN);
  const [hintergrund, setHintergrund] = useState<HintergrundModus>(HINTERGRUND_STANDARD);
  const [abdunkel, setAbdunkel] = useState(ABDUNKEL_STANDARD);

  // Die Anzeige von Play/Pause folgt der Absicht, nicht jedem Zwischenzustand. Beim Springen meldet der Player
  // kurz „Buffering“. Dann bleibt die Anzeige, wie sie war (kein Flackern).
  const spielt = spieltAbsicht;
  const istGeladen = [State.Ready, State.Playing, State.Paused, State.Buffering].includes(zustand);
  const gesamtDauer = fortschritt.duration > 0 ? fortschritt.duration : (buch?.dauer_sek ?? 0);
  // Die Position, die wir anzeigen und speichern: das Sprungziel, sonst die gemeldete Stelle.
  const effektivPosition = sprungZiel ?? fortschritt.position;

  const sprungZielRef = useRef<number | null>(null);
  // Setzt das Sprungziel und merkt es im Ref, damit der Listener es ohne Verzögerung sieht.
  const sprungZeitRef = useRef(0);
  // Erst wenn der Sprung abgeschlossen ist (seekTo ist fertig), darf das Ziel verschwinden.
  const sprungBestaetigtRef = useRef(false);
  const setSprungZiel = useCallback((ziel: number | null) => {
    sprungZielRef.current = ziel;
    sprungZeitRef.current = Date.now();
    sprungBestaetigtRef.current = false;
    setSprungZielState(ziel);
  }, []);

  // Führt einen Sprung aus. Nach Abschluss zeigt die Anzeige das Ziel, bis der Player es bestätigt.
  const sprungAusfuehren = useCallback(
    (ziel: number) => {
      setSprungZiel(ziel);
      TrackPlayer.seekTo(ziel)
        .then(() => {
          if (sprungZielRef.current === ziel) {
            sprungBestaetigtRef.current = true;
            setFortschritt((alt) => ({ ...alt, position: ziel }));
          }
        })
        .catch((fehler: unknown) => console.warn('Sprung fehlgeschlagen:', fehler));
    },
    [setSprungZiel],
  );

  // Werte für Zeitgeber und App-Zustand. Ein Ref ändert nichts am Bildschirm, deshalb ist er hier passend.
  const aktuelles = useRef({ buchId: null as number | null, position: 0, tempo: 1, spielt: false, bereit: false });
  // Startstelle, die nach dem Laden des Buches gesetzt wird.
  const ausstehend = useRef<{ position: number; pausiert: boolean } | null>(null);
  const gestartet = useRef(false);

  useEffect(() => {
    aktuelles.current.position = effektivPosition;
    aktuelles.current.tempo = tempo;
    aktuelles.current.spielt = spielt;
  }, [effektivPosition, tempo, spielt]);

  // Speichert die aktuelle Stelle. Solange ein Buch noch lädt, wird nichts gespeichert,
  // sonst würde die alte Stelle mit 0 überschrieben.
  const speichereStand = useCallback(async () => {
    const a = aktuelles.current;
    if (a.buchId === null || !a.bereit) return;
    try {
      await speichereFortschritt(db, a.buchId, a.position, a.tempo);
    } catch (fehler) {
      // Ein Fehler darf die Wiedergabe nicht stoppen. Wir melden ihn aber, damit man ihn sieht.
      console.warn('Stelle konnte nicht gespeichert werden:', fehler);
    }
  }, [db]);

  // Beim Pausieren, Ende und Neuladen speichern.
  useEffect(() => {
    if (!spielt) void speichereStand();
  }, [spielt, speichereStand]);

  // Beim Hören alle 5 Sekunden speichern, damit bei einem Absturz kaum etwas verloren geht.
  useEffect(() => {
    const id = setInterval(() => {
      if (aktuelles.current.spielt) void speichereStand();
    }, 5000);
    return () => clearInterval(id);
  }, [speichereStand]);

  // Wenn die App in den Hintergrund geht, speichern wir die Stelle.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (zustandApp) => {
      if (zustandApp !== 'active') void speichereStand();
    });
    return () => sub.remove();
  }, [speichereStand]);

  // Meldungen des Players: Zustand, Stelle und Fehler.
  // Sobald das neue Buch bereit ist (State.Ready), springen wir an die Startstelle und pausieren ggf.
  useEffect(() => {
    const subZustand = TrackPlayer.addEventListener(Event.PlaybackState, (e) => {
      setZustand(e.state);
      // Spielt es, zeigen wir Pause. Stoppt es, zeigen wir Play. Kurze Ladezustände ändern nichts.
      if (e.state === State.Playing) setSpieltAbsicht(true);
      else if (e.state !== State.Buffering && e.state !== State.Loading) setSpieltAbsicht(false);
      // Läuft die Wiedergabe, ist die Absicht aus dem Laden erledigt.
      if (e.state === State.Playing) setLadeSpielen(false);

      const a = ausstehend.current;
      if (!a || e.state !== State.Ready) return;
      ausstehend.current = null;
      void (async () => {
        try {
          await TrackPlayer.setRate(aktuelles.current.tempo);
          await TrackPlayer.seekTo(a.position);
          if (a.pausiert) {
            await TrackPlayer.pause();
            setLadeSpielen(false);
          } else {
            await TrackPlayer.play();
          }
          if (sprungZielRef.current === a.position) sprungBestaetigtRef.current = true;
          aktuelles.current.bereit = true;
        } catch (fehler) {
          console.warn('Start des Buches fehlgeschlagen:', fehler);
        }
      })();
    });

    const subFortschritt = TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (e) => {
      setFortschritt({ position: e.position, duration: e.duration });
      // Das Ziel bleibt stehen, bis die Wiedergabe dort angekommen ist. Sonst würde die Anzeige kurz ins alte Kapitel springen.
      // Notbremse nach 30 Sekunden, damit die Anzeige nie hängen bleibt.
      const ziel = sprungZielRef.current;
      if (ziel !== null && sprungBestaetigtRef.current) {
        const angekommen = e.position >= ziel - KAPITEL_TOLERANZ_SEK;
        const zuLange = Date.now() - sprungZeitRef.current > 30000;
        if (angekommen || zuLange) setSprungZiel(null);
      }
    });

    const subFehler = TrackPlayer.addEventListener(Event.PlaybackError, (e) => {
      console.warn('Wiedergabefehler:', e);
    });

    return () => {
      subZustand.remove();
      subFortschritt.remove();
      subFehler.remove();
    };
  }, [setSprungZiel]);

  const oeffneBuch = useCallback(
    async (neu: BuchZeile, optionen: OeffneOptionen = {}) => {
      // Ist genau dieses Buch schon geladen und bereit (zum Beispiel das letzte Buch aus dem App-Start),
      // laden wir nichts neu. Wir springen nur, wenn eine bestimmte Stelle gewünscht ist.
      if (aktuelles.current.buchId === neu.id && aktuelles.current.bereit && !ausstehend.current) {
        setBuch(neu);
        if (optionen.position !== undefined) sprungAusfuehren(optionen.position);
        return;
      }
      // Die Stelle des alten Buches sichern, bevor wir wechseln.
      if (aktuelles.current.buchId !== null && aktuelles.current.buchId !== neu.id) {
        await speichereStand();
      }
      aktuelles.current.bereit = false;
      aktuelles.current.buchId = neu.id;

      const gemerkt = await holeFortschritt(db, neu.id);
      const kap = await holeKapitel(db, neu.id);
      await sicherEingerichtet();

      // Die Anzeige zeigt sofort die Startstelle, auch während das Buch noch lädt.
      const start = optionen.position ?? gemerkt?.position ?? 0;
      setSprungZiel(start);
      setKapitel(kap);
      setBuch(neu);
      // Standard: Das Buch steht an der Stelle und wartet auf Play. Nur wer ausdrücklich will, startet direkt.
      const pausiert = optionen.pausiert ?? true;
      ausstehend.current = { position: start, pausiert };
      setLadeSpielen(!pausiert);

      // Die Warteschlange leeren und das Buch als einzige Datei neu einreihen.
      await TrackPlayer.reset();
      const kapitelTitel = aktuellesKapitel(kap, start)?.titel ?? null;
      await TrackPlayer.add({ url: neu.datei_uri, ...metadatenFuer(neu, kapitelTitel) });
    },
    [db, speichereStand, setSprungZiel, sprungAusfuehren],
  );

  // Beim App-Start: Das zuletzt gehörte Buch wird geladen und steht pausiert an der gemerkten Stelle.
  // Abgespielt wird erst, wenn du Play drückst. Der Player öffnet sich nicht von selbst.
  useEffect(() => {
    if (gestartet.current) return;
    gestartet.current = true;
    void (async () => {
      try {
        const zurueck = Number(await holeEinstellung(db, EINSTELLUNG_SPULZEIT.zurueck));
        const vor = Number(await holeEinstellung(db, EINSTELLUNG_SPULZEIT.vor));
        setSpulzeiten({
          zurueck: zurueck > 0 ? zurueck : STANDARD_SPRUNG_SEK,
          vor: vor > 0 ? vor : STANDARD_SPRUNG_SEK,
        });
        // Das gespeicherte Tempo gilt schon vor dem Laden des Buches.
        // Gespeichertes Tempo laden. rasteTempo hält es im erlaubten Bereich (0,5× bis 3×). Ohne Wert gilt 1×.
        const gespeichert = Number(await holeEinstellung(db, EINSTELLUNG_TEMPO));
        const tempoStart = gespeichert > 0 ? rasteTempo(gespeichert) : 1;
        aktuelles.current.tempo = tempoStart;
        setTempo(tempoStart);
        // Äußere Knöpfe und Balkendicke aus der Datenbank.
        const aussenZurueck = Number(await holeEinstellung(db, EINSTELLUNG_AUSSEN_SEK.zurueck));
        const aussenVor = Number(await holeEinstellung(db, EINSTELLUNG_AUSSEN_SEK.vor));
        const aktiv = await holeEinstellung(db, EINSTELLUNG_AUSSEN_AKTIV);
        setAussenAktiv(aktiv === '1');
        setAussenSek({
          zurueck: aussenZurueck > 0 ? aussenZurueck : STANDARD_AUSSEN_SEK,
          vor: aussenVor > 0 ? aussenVor : STANDARD_AUSSEN_SEK,
        });
        const balken = await holeEinstellung(db, EINSTELLUNG_BALKEN);
        if (balken) setBalkenWahl(balken);
        // Hintergrund des Players. Nur bekannte Werte übernehmen, sonst gilt der Standard.
        const gespeicherterModus = await holeEinstellung(db, EINSTELLUNG_HINTERGRUND);
        if (gespeicherterModus === 'off' || gespeicherterModus === 'blur' || gespeicherterModus === 'gradient') {
          setHintergrund(gespeicherterModus);
        }
        const gespeicherteAbdunkel = Number(await holeEinstellung(db, EINSTELLUNG_ABDUNKEL));
        if (gespeicherteAbdunkel > 0 && gespeicherteAbdunkel < 1) setAbdunkel(gespeicherteAbdunkel);
        const letzter = await holeLetzterStand(db);
        if (letzter) {
          await oeffneBuch(letzter.buch, { position: letzter.position, pausiert: true });
        }
      } catch {
        // Ohne gemerkten Stand bleibt die App leer. Die Bibliothek funktioniert trotzdem.
      }
    })();
  }, [db, oeffneBuch]);

  // Die Spulzeiten gelten auch für die Knöpfe in der Benachrichtigung.
  useEffect(() => {
    sicherEingerichtet()
      .then(() =>
        TrackPlayer.updateOptions(optionenFuer(spulzeiten.vor, spulzeiten.zurueck)),
      )
      .catch((fehler: unknown) => console.warn('Spulzeiten konnten nicht gesetzt werden:', fehler));
  }, [spulzeiten]);

  // Das Tempo gilt nach jedem Laden und bei jeder Änderung. Die Tonhöhe bleibt dabei gleich.
  useEffect(() => {
    if (istGeladen) TrackPlayer.setRate(tempo).catch(() => {});
  }, [tempo, istGeladen]);

  const umschalten = useCallback(() => {
    // Noch am Laden: Wir merken uns nur die Absicht, die App setzt sie nach dem Laden um.
    if (ausstehend.current) {
      ausstehend.current.pausiert = !ausstehend.current.pausiert;
      setLadeSpielen(!ausstehend.current.pausiert);
      return;
    }
    if (aktuelles.current.spielt) void TrackPlayer.pause();
    else void startenMitRueckspruung();
  }, []);

  const spulen = useCallback(
    (sekunden: number) => {
      const ziel = spulePosition(effektivPosition, sekunden, gesamtDauer > 0 ? gesamtDauer : null);
      sprungAusfuehren(ziel);
    },
    [effektivPosition, gesamtDauer, sprungAusfuehren],
  );

  // Sprung an eine Stelle (Kapitelgrenze oder Zeitstrahl). Ein Sprung wird einmal ausgeführt, nicht wiederholt.
  const springeZu = useCallback(
    (sekunden: number) => {
      sprungAusfuehren(sekunden);
    },
    [sprungAusfuehren],
  );

  // Speichert die Spulzeit für einen der beiden Knöpfe. Gilt sofort und bleibt beim nächsten Start erhalten.
  const setzeSpulzeit = useCallback(
    (richtung: SpulRichtung, sekunden: number) => {
      setSpulzeiten((alt) => ({ ...alt, [richtung]: sekunden }));
      void setzeEinstellung(db, EINSTELLUNG_SPULZEIT[richtung], String(sekunden)).catch(() => {
        // Speichern ist nur Komfort. Die Auswahl gilt trotzdem für diese Sitzung.
      });
    },
    [db],
  );

  // Schaltet beide äußeren Knöpfe zusammen an oder aus. Gilt sofort und bleibt gespeichert.
  const setzeAussenAktiv = useCallback(
    (an: boolean) => {
      setAussenAktiv(an);
      void setzeEinstellung(db, EINSTELLUNG_AUSSEN_AKTIV, an ? '1' : '0').catch(() => {});
    },
    [db],
  );

  // Die Spulzeit eines äußeren Knopfes. Gilt sofort und bleibt gespeichert.
  const setzeAussenSek = useCallback(
    (richtung: SpulRichtung, sekunden: number) => {
      setAussenSek((alt) => ({ ...alt, [richtung]: sekunden }));
      void setzeEinstellung(db, EINSTELLUNG_AUSSEN_SEK[richtung], String(sekunden)).catch(() => {});
    },
    [db],
  );

  const setzeHintergrund = useCallback(
    (modus: HintergrundModus) => {
      setHintergrund(modus);
      void setzeEinstellung(db, EINSTELLUNG_HINTERGRUND, modus).catch(() => {});
    },
    [db],
  );

  const setzeAbdunkel = useCallback(
    (wert: number) => {
      setAbdunkel(wert);
      void setzeEinstellung(db, EINSTELLUNG_ABDUNKEL, String(wert)).catch(() => {});
    },
    [db],
  );

  const setzeBalkenDicke = useCallback(
    (schluessel: string) => {
      setBalkenWahl(schluessel);
      void setzeEinstellung(db, EINSTELLUNG_BALKEN, schluessel).catch(() => {});
    },
    [db],
  );

  // Ändert das Tempo und merkt es sich für alle Bücher. Der Wert im Ref ist sofort aktuell.
  const tempoSetzen = useCallback(
    (wert: number) => {
      const neu = rasteTempo(wert);
      if (neu === aktuelles.current.tempo) return;
      aktuelles.current.tempo = neu;
      setTempo(neu);
      // Tempo für alle Bücher merken, und die aktuelle Stelle gleich mit sichern.
      setzeEinstellung(db, EINSTELLUNG_TEMPO, String(neu)).catch((fehler: unknown) =>
        console.warn('Tempo konnte nicht gespeichert werden:', fehler),
      );
      void speichereStand();
    },
    [db, speichereStand],
  );

  const abschnitt = useMemo<Abschnitt>(() => {
    const bereich = aktuellesKapitel(kapitel, effektivPosition);
    return bereich
      ? { titel: bereich.titel, start: bereich.start_sek, laenge: bereich.end_sek - bereich.start_sek }
      : { titel: null, start: 0, laenge: gesamtDauer };
  }, [kapitel, effektivPosition, gesamtDauer]);

  const springeInAbschnitt = useCallback(
    (anteil: number) => {
      springeZu(abschnitt.start + anteil * abschnitt.laenge);
    },
    [springeZu, abschnitt],
  );

  // Die Benachrichtigung zeigt den Kapitelnamen. Ändert sich das Kapitel, setzen wir nur den Titel neu.
  const aktuellerKapitelTitel = abschnitt.titel;
  useEffect(() => {
    if (!buch || !istGeladen) return;
    TrackPlayer.updateNowPlayingMetadata(metadatenFuer(buch, aktuellerKapitelTitel)).catch(() => {});
  }, [buch, istGeladen, aktuellerKapitelTitel]);

  const kapitelSprung = useMemo(
    () => kapitelSprungZiele(kapitel, effektivPosition),
    [kapitel, effektivPosition],
  );

  // ---- Sleep-Timer ----
  // Die Werte, die der Tick alle halbe Sekunde prüft. Ein Ref, damit der Tick immer den neuesten Stand sieht.
  const schlafRef = useRef({
    modus: 'aus' as SchlafModus,
    restMs: 0,
    endetUm: null as number | null,
    ziel: null as number | null,
    zielStart: null as number | null,
    lautstaerke: 1,
  });
  const kapitelRef = useRef(kapitel);
  useEffect(() => {
    kapitelRef.current = kapitel;
  }, [kapitel]);
  const [schlaf, setSchlaf] = useState<SchlafAnzeige>({ modus: 'aus', restSek: null });

  const setzeSchlaf = useCallback((wahl: number | 'kapitel' | null) => {
    const s = schlafRef.current;
    const jetzt = Date.now();
    if (wahl === null) {
      s.modus = 'aus';
      s.endetUm = null;
      s.restMs = 0;
      s.ziel = null;
      s.zielStart = null;
      lautstaerkeAnwenden(s, 1);
      setSchlaf({ modus: 'aus', restSek: null });
      return;
    }
    if (wahl === 'kapitel') {
      const pos = aktuelles.current.position;
      const kap = aktuellesKapitel(kapitelRef.current, pos);
      const ende = kapitelEndeFuer(kapitelRef.current, pos);
      if (!kap || !ende) return;
      s.modus = 'kapitel';
      s.ziel = ende.ende;
      s.zielStart = kap.start_sek;
      s.endetUm = null;
      s.restMs = 0;
      setSchlaf({ modus: 'kapitel', restSek: null });
      return;
    }
    // Die Dauer läuft nur, während gespielt wird. Läuft sie gerade, beginnt sie jetzt.
    s.modus = 'dauer';
    s.restMs = wahl * 60_000;
    s.endetUm = aktuelles.current.spielt ? jetzt + s.restMs : null;
    setSchlaf({ modus: 'dauer', restSek: Math.ceil(s.restMs / 1000) });
  }, []);

  const verlaengereSchlaf = useCallback((minuten: number) => {
    const s = schlafRef.current;
    if (s.modus !== 'dauer') return;
    const jetzt = Date.now();
    const restSek = s.endetUm !== null ? (s.endetUm - jetzt) / 1000 : s.restMs / 1000;
    s.restMs = verlaengern(Math.max(0, restSek), minuten) * 1000;
    if (s.endetUm !== null) s.endetUm = jetzt + s.restMs;
    setSchlaf({ modus: 'dauer', restSek: Math.ceil(s.restMs / 1000) });
  }, []);

  // Der Tick prüft alle halbe Sekunde: Restzeit, Kapitelende, Ausblenden.
  useEffect(() => {
    const id = setInterval(() => {
      const s = schlafRef.current;
      if (s.modus === 'aus') {
        lautstaerkeAnwenden(s, 1);
        return;
      }
      const jetzt = Date.now();
      const spielt = aktuelles.current.spielt;
      const pos = aktuelles.current.position;
      let fertig = false;
      let restSek: number | null = null;

      if (s.modus === 'dauer') {
        // Läuft die Wiedergabe, zählt die Uhr. Bei Pause friert die Restzeit ein.
        if (spielt) {
          if (s.endetUm === null) s.endetUm = jetzt + s.restMs;
          s.restMs = s.endetUm - jetzt;
        } else if (s.endetUm !== null) {
          s.restMs = s.endetUm - jetzt;
          s.endetUm = null;
        }
        restSek = s.restMs / 1000;
        fertig = spielt && s.restMs <= 0;
        if (spielt) lautstaerkeAnwenden(s, ausblendLautstaerke(restSek));
        else lautstaerkeAnwenden(s, 1);
      } else if (s.modus === 'kapitel' && s.ziel !== null) {
        // Springt der Nutzer in ein anderes Kapitel, gilt das Ende des neuen Kapitels.
        const kap = aktuellesKapitel(kapitelRef.current, pos);
        if (kap && kap.start_sek !== s.zielStart) {
          const neu = kapitelEndeFuer(kapitelRef.current, pos);
          if (neu) {
            s.ziel = neu.ende;
            s.zielStart = kap.start_sek;
          }
        }
        const ziel = s.ziel ?? pos;
        fertig = spielt && pos >= ziel - 0.3;
        if (spielt) lautstaerkeAnwenden(s, ausblendLautstaerke(ziel - pos));
        else lautstaerkeAnwenden(s, 1);
      }

      if (fertig) {
        // Erst pausieren, dann die Lautstärke wieder auf 1 setzen. So blitzt nichts laut auf.
        s.modus = 'aus';
        s.endetUm = null;
        s.restMs = 0;
        s.ziel = null;
        s.zielStart = null;
        // Der Hintergrunddienst soll wissen, dass der Sleep-Timer gestoppt hat (für Smart Rewind). Deshalb das Zeichen zuerst.
        void (async () => {
          try {
            await setzeEinstellung(db, SCHLAF_STOPP_FLAG, '1');
            await TrackPlayer.pause();
            s.lautstaerke = 1;
            await TrackPlayer.setVolume(1);
          } catch {
            // Fehler beim Stoppen: Die Wiedergabe bleibt, wie sie ist.
          }
          await speichereStand();
        })();
        setSchlaf({ modus: 'aus', restSek: null });
        return;
      }

      const neu: SchlafAnzeige = s.modus === 'dauer' ? { modus: 'dauer', restSek } : { modus: 'kapitel', restSek: null };
      setSchlaf((alt) => (alt.modus === neu.modus && alt.restSek === neu.restSek ? alt : neu));
    }, 500);
    return () => clearInterval(id);
  }, [db, speichereStand]);

  const wert = useMemo<PlayerWert>(
    () => ({
      buch,
      abschnitt,
      position: effektivPosition,
      dauer: gesamtDauer,
      spielt: spielt || ladeSpielen,
      tempo,
      oeffneBuch,
      umschalten,
      spulen,
      springeInAbschnitt,
      springeZu,
      kapitelSprung,
      tempoSetzen,
      spulzeiten,
      setzeSpulzeit,
      aussenAktiv,
      setzeAussenAktiv,
      aussenSek,
      setzeAussenSek,
      balkenWahl,
      balkenDicke: balkenDickeFuer(balkenWahl),
      setzeBalkenDicke,
      schlaf,
      hintergrund,
      setzeHintergrund,
      abdunkel,
      setzeAbdunkel,
      hatKapitel: kapitel.length > 0,
      setzeSchlaf,
      verlaengereSchlaf,
    }),
    [buch, abschnitt, effektivPosition, gesamtDauer, spielt, ladeSpielen, tempo, oeffneBuch, umschalten, spulen, springeInAbschnitt, springeZu, kapitelSprung, tempoSetzen, spulzeiten, setzeSpulzeit, aussenAktiv, setzeAussenAktiv, aussenSek, setzeAussenSek, balkenWahl, setzeBalkenDicke, schlaf, kapitel, setzeSchlaf, verlaengereSchlaf, hintergrund, setzeHintergrund, abdunkel, setzeAbdunkel],
  );

  return <PlayerKontext.Provider value={wert}>{children}</PlayerKontext.Provider>;
}

export function usePlayer(): PlayerWert {
  const wert = useContext(PlayerKontext);
  if (!wert) throw new Error('usePlayer muss innerhalb von PlayerProvider genutzt werden.');
  return wert;
}
