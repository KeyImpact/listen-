import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useSQLiteContext } from 'expo-sqlite';

import { holeKapitel, type BuchZeile, type KapitelKurz } from '@/lib/datenbank';
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

// Der Player gehört der ganzen App: Mini-Player, Bibliothek und Player-Bildschirm sehen dieselbe Wiedergabe.
// Die Position wird noch nicht gespeichert (kommt in Schritt 4).
interface PlayerWert {
  buch: BuchZeile | null;
  abschnitt: Abschnitt;
  position: number; // Position im ganzen Buch, in Sekunden
  dauer: number; // Länge des ganzen Buches, in Sekunden
  spielt: boolean;
  tempo: number;
  oeffneBuch: (buch: BuchZeile) => Promise<void>;
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

  // Das Tempo muss nach jedem Laden neu gesetzt werden und bei jeder Änderung.
  // Mit Tonhöhen-Korrektur, damit die Stimme nicht hoch klingt.
  useEffect(() => {
    if (status.isLoaded) {
      player.setPlaybackRate(tempo, 'high');
    }
  }, [player, status.isLoaded, tempo, buch]);

  const oeffneBuch = useCallback(
    async (neu: BuchZeile) => {
      const kap = await holeKapitel(db, neu.id);
      setKapitel(kap);
      setBuch(neu);
      player.replace({ uri: neu.datei_uri });
      player.play();
    },
    [db, player],
  );

  const umschalten = useCallback(() => {
    if (status.playing) player.pause();
    else player.play();
  }, [player, status.playing]);

  const spulen = useCallback(
    (sekunden: number) => {
      const dauer = status.duration > 0 ? status.duration : null;
      const ziel = spulePosition(status.currentTime, sekunden, dauer);
      void player.seekTo(ziel);
    },
    [player, status.currentTime, status.duration],
  );

  const tempoAendern = useCallback((richtung: 1 | -1) => {
    setTempo((alt) => naechstesTempo(alt, richtung));
  }, []);

  const abschnitt = useMemo<Abschnitt>(() => {
    const bereich = aktuellesKapitel(kapitel, status.currentTime);
    return bereich
      ? { titel: bereich.titel, start: bereich.start_sek, laenge: bereich.end_sek - bereich.start_sek }
      : { titel: null, start: 0, laenge: status.duration };
  }, [kapitel, status.currentTime, status.duration]);

  const springeInAbschnitt = useCallback(
    (anteil: number) => {
      void player.seekTo(abschnitt.start + anteil * abschnitt.laenge);
    },
    [player, abschnitt],
  );

  const springeZu = useCallback(
    (sekunden: number) => {
      void player.seekTo(sekunden);
    },
    [player],
  );

  const kapitelSprung = useMemo(
    () => kapitelSprungZiele(kapitel, status.currentTime),
    [kapitel, status.currentTime],
  );

  const wert = useMemo<PlayerWert>(
    () => ({
      buch,
      abschnitt,
      position: status.currentTime,
      dauer: status.duration,
      spielt: status.playing,
      tempo,
      oeffneBuch,
      umschalten,
      spulen,
      springeInAbschnitt,
      springeZu,
      kapitelSprung,
      tempoAendern,
    }),
    [buch, abschnitt, status.currentTime, status.duration, status.playing, tempo, oeffneBuch, umschalten, spulen, springeInAbschnitt, springeZu, kapitelSprung, tempoAendern],
  );

  return <PlayerKontext.Provider value={wert}>{children}</PlayerKontext.Provider>;
}

export function usePlayer(): PlayerWert {
  const wert = useContext(PlayerKontext);
  if (!wert) throw new Error('usePlayer muss innerhalb von PlayerProvider genutzt werden.');
  return wert;
}
