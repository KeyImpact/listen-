import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useSQLiteContext } from 'expo-sqlite';

import {
  holeFortschritt,
  holeKapitel,
  holeLetzterStand,
  speichereFortschritt,
  type BuchZeile,
  type KapitelKurz,
} from '@/lib/datenbank';
import {
  aktuellesKapitel,
  kapitelSprungZiele,
  naechstesTempo,
  spulePosition,
} from '@/lib/player-logik';

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
  tempoAendern: (richtung: 1 | -1) => void;
}

const PlayerKontext = createContext<PlayerWert | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);

  const [buch, setBuch] = useState<BuchZeile | null>(null);
  const [kapitel, setKapitel] = useState<KapitelKurz[]>([]);
  const [tempo, setTempo] = useState(1);
  // Das Ziel eines Sprungs. Die App zeigt es, bis der Player dort angekommen ist.
  const [sprungZiel, setSprungZielState] = useState<number | null>(null);
  // Play wurde gedrückt, während das Buch noch lädt. Dann zeigt die Anzeige schon „Pause“.
  const [ladeSpielen, setLadeSpielen] = useState(false);
  const sprungZielRef = useRef<number | null>(null);
  // Setzt das Sprungziel und merkt es im Ref, damit der Status-Listener es ohne Verzögerung sieht.
  const sprungZeitRef = useRef(0);
  // Erst wenn der Sprung abgeschlossen ist (seekTo ist fertig), darf das Ziel verschwinden.
  // Vorher kann der Player noch die alte Stelle melden, und die Anzeige würde kurz springen.
  const sprungBestaetigtRef = useRef(false);
  const setSprungZiel = useCallback((ziel: number | null) => {
    sprungZielRef.current = ziel;
    sprungZeitRef.current = Date.now();
    sprungBestaetigtRef.current = false;
    setSprungZielState(ziel);
  }, []);
  // Führt einen Sprung aus und markiert das Ziel als bestätigt, sobald der Player fertig ist.
  const sprungAusfuehren = useCallback(
    (ziel: number) => {
      setSprungZiel(ziel);
      void player.seekTo(ziel).then(() => {
        if (sprungZielRef.current === ziel) sprungBestaetigtRef.current = true;
      });
    },
    [player, setSprungZiel],
  );

  // Werte für Zeitgeber und App-Zustand. Ein Ref ändert nichts am Bildschirm, deshalb ist er hier passend.
  const aktuelles = useRef({ buchId: null as number | null, position: 0, tempo: 1, spielt: false, bereit: false });
  // Startstelle, die nach dem Laden des Buches gesetzt wird.
  const ausstehend = useRef<{ position: number; pausiert: boolean } | null>(null);
  const gestartet = useRef(false);

  // Die Position, die wir anzeigen und speichern: das Sprungziel, sonst die Zeit des Players.
  const effektivPosition = sprungZiel ?? status.currentTime;

  useEffect(() => {
    aktuelles.current.position = effektivPosition;
    aktuelles.current.tempo = tempo;
    aktuelles.current.spielt = status.playing;
  }, [effektivPosition, tempo, status.playing]);

  // Speichert die aktuelle Stelle. Solange ein Buch noch lädt, wird nichts gespeichert,
  // sonst würde die alte Stelle mit 0 überschrieben.
  const speichereStand = useCallback(async () => {
    const a = aktuelles.current;
    if (a.buchId === null || !a.bereit) return;
    try {
      await speichereFortschritt(db, a.buchId, a.position, a.tempo);
    } catch {
      // Das Speichern ist nur Komfort. Ein Fehler darf die Wiedergabe nicht stoppen.
    }
  }, [db]);

  // Beim Pausieren, Ende und Neuladen speichern.
  useEffect(() => {
    if (!status.playing) void speichereStand();
  }, [status.playing, speichereStand]);

  // Beim Hören alle 5 Sekunden speichern, damit bei einem Absturz kaum etwas verloren geht.
  useEffect(() => {
    const id = setInterval(() => {
      if (aktuelles.current.spielt) void speichereStand();
    }, 5000);
    return () => clearInterval(id);
  }, [speichereStand]);

  // Wenn die App in den Hintergrund geht, speichern wir die Stelle.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (zustand) => {
      if (zustand !== 'active') void speichereStand();
    });
    return () => sub.remove();
  }, [speichereStand]);

  // Das Tempo muss nach jedem Laden neu gesetzt werden und bei jeder Änderung.
  // Mit Tonhöhen-Korrektur, damit die Stimme nicht hoch klingt.
  useEffect(() => {
    if (status.isLoaded) {
      player.setPlaybackRate(tempo, 'high');
    }
  }, [player, status.isLoaded, tempo, buch]);

  // Sobald das neue Buch geladen ist, springen wir an die Startstelle und pausieren ggf.
  // Wir hören auf das Ereignis „playbackStatusUpdate“, damit wir nicht den Stand des alten Buches erwischen.
  useEffect(() => {
    const sub = player.addListener('playbackStatusUpdate', (s) => {
      // Läuft die Wiedergabe, ist die Absicht aus dem Laden erledigt. Vorher bleibt „Pause“ stehen, damit der Knopf nicht flackert.
      if (s.playing) setLadeSpielen(false);
      // Das Ziel bleibt stehen, bis die Wiedergabe dort angekommen ist. Eine einzelne Meldung reicht nicht,
      // weil der Player nach einem Sprung kurz die alte Stelle melden kann.
      // Notbremse nach 5 Sekunden Wiedergabe, damit die Anzeige nie hängen bleibt.
      const ziel = sprungZielRef.current;
      if (ziel !== null && sprungBestaetigtRef.current && s.playing) {
        // Erst wenn die Wiedergabe das Ziel wirklich erreicht. Liegt sie davor, bleibt das Ziel stehen,
        // sonst würde die Anzeige kurz ins alte Kapitel zurückspringen.
        const angekommen = s.currentTime >= ziel;
        const zuLange = Date.now() - sprungZeitRef.current > 30000;
        if (angekommen || zuLange) setSprungZiel(null);
      }
      const a = ausstehend.current;
      if (!a || !s.isLoaded || s.duration <= 0) return;
      ausstehend.current = null;
      void (async () => {
        // Sprung und Start gleich hintereinander anstoßen, nicht auf das Ende des Sprungs warten.
        const sprung = player.seekTo(a.position);
        if (a.pausiert) player.pause();
        else player.play();
        if (a.pausiert) setLadeSpielen(false);
        await sprung;
        if (sprungZielRef.current === a.position) sprungBestaetigtRef.current = true;
        aktuelles.current.bereit = true;
      })();
    });
    return () => sub.remove();
  }, [player, setSprungZiel]);

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

      // Die Anzeige zeigt sofort die Startstelle, auch während das Buch noch lädt.
      const start = optionen.position ?? gemerkt?.position ?? 0;
      setSprungZiel(start);
      setKapitel(kap);
      setBuch(neu);
      setTempo(gemerkt?.tempo ?? aktuelles.current.tempo);
      // Standard: Das Buch steht an der Stelle und wartet auf Play. Nur wer ausdrücklich will, startet direkt.
      const pausiert = optionen.pausiert ?? true;
      ausstehend.current = { position: start, pausiert };
      setLadeSpielen(!pausiert);
      player.replace({ uri: neu.datei_uri });
    },
    [db, player, speichereStand, setSprungZiel, sprungAusfuehren],
  );

  // Beim App-Start: Das zuletzt gehörte Buch wird geladen und steht pausiert an der gemerkten Stelle.
  // Abgespielt wird erst, wenn du Play drückst. Der Player öffnet sich nicht von selbst.
  useEffect(() => {
    if (gestartet.current) return;
    gestartet.current = true;
    void (async () => {
      try {
        const letzter = await holeLetzterStand(db);
        if (letzter) {
          await oeffneBuch(letzter.buch, { position: letzter.position, pausiert: true });
        }
      } catch {
        // Ohne gemerkten Stand bleibt die App leer. Die Bibliothek funktioniert trotzdem.
      }
    })();
  }, [db, oeffneBuch]);

  const umschalten = useCallback(() => {
    // Noch am Laden: Wir merken uns nur die Absicht, die App setzt sie nach dem Laden um.
    if (ausstehend.current) {
      ausstehend.current.pausiert = !ausstehend.current.pausiert;
      setLadeSpielen(!ausstehend.current.pausiert);
      return;
    }
    if (status.playing) player.pause();
    else player.play();
  }, [player, status.playing]);

  const spulen = useCallback(
    (sekunden: number) => {
      const dauer = status.duration > 0 ? status.duration : null;
      const ziel = spulePosition(effektivPosition, sekunden, dauer);
      sprungAusfuehren(ziel);
    },
    [effektivPosition, status.duration, sprungAusfuehren],
  );

  // Sprung an eine Stelle (Kapitelgrenze oder Zeitstrahl). Ein Sprung wird einmal ausgeführt, nicht wiederholt.
  const springeZu = useCallback(
    (sekunden: number) => {
      sprungAusfuehren(sekunden);
    },
    [sprungAusfuehren],
  );

  const tempoAendern = useCallback((richtung: 1 | -1) => {
    setTempo((alt) => naechstesTempo(alt, richtung));
  }, []);

  // Gesamtlänge: Solange der Player noch lädt, nehmen wir die Länge aus der Datenbank.
  const gesamtDauer = status.duration > 0 ? status.duration : (buch?.dauer_sek ?? 0);

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

  const kapitelSprung = useMemo(
    () => kapitelSprungZiele(kapitel, effektivPosition),
    [kapitel, effektivPosition],
  );

  const wert = useMemo<PlayerWert>(
    () => ({
      buch,
      abschnitt,
      position: effektivPosition,
      dauer: gesamtDauer,
      spielt: status.playing || ladeSpielen,
      tempo,
      oeffneBuch,
      umschalten,
      spulen,
      springeInAbschnitt,
      springeZu,
      kapitelSprung,
      tempoAendern,
    }),
    [buch, abschnitt, effektivPosition, gesamtDauer, status.playing, ladeSpielen, tempo, oeffneBuch, umschalten, spulen, springeInAbschnitt, springeZu, kapitelSprung, tempoAendern],
  );

  return <PlayerKontext.Provider value={wert}>{children}</PlayerKontext.Provider>;
}

export function usePlayer(): PlayerWert {
  const wert = useContext(PlayerKontext);
  if (!wert) throw new Error('usePlayer muss innerhalb von PlayerProvider genutzt werden.');
  return wert;
}
