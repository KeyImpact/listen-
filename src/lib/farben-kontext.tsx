import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { AKZENTE, farben, type AkzentSchluessel } from '@/constants/farben';
import { holeEinstellung, setzeEinstellung } from '@/lib/datenbank';

// Die Farben der App. Die Akzentfarbe kann der Nutzer wählen, die anderen sind fest.
// Gespeichert wird die Wahl in der Datenbank (Tabelle einstellung), damit sie nach dem Neustart bleibt.
export type Palette = Record<keyof typeof farben, string>;

const SCHLUESSEL = 'akzent';

interface FarbenWert {
  palette: Palette;
  akzentSchluessel: AkzentSchluessel;
  setzeAkzent: (schluessel: AkzentSchluessel) => void;
}

const FarbenKontext = createContext<FarbenWert | null>(null);

function istAkzent(wert: string | null): wert is AkzentSchluessel {
  return AKZENTE.some((a) => a.schluessel === wert);
}

export function FarbenProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [akzentSchluessel, setAkzentSchluessel] = useState<AkzentSchluessel>('blau');

  // Beim Start die gespeicherte Wahl laden. "aktiv" verhindert Updates, wenn die App schon weg ist.
  useEffect(() => {
    let aktiv = true;
    (async () => {
      const wert = await holeEinstellung(db, SCHLUESSEL);
      if (aktiv && istAkzent(wert)) setAkzentSchluessel(wert);
    })();
    return () => {
      aktiv = false;
    };
  }, [db]);

  const setzeAkzent = useCallback(
    (schluessel: AkzentSchluessel) => {
      setAkzentSchluessel(schluessel);
      void setzeEinstellung(db, SCHLUESSEL, schluessel);
    },
    [db],
  );

  const wert = useMemo<FarbenWert>(() => {
    const gewaehlt = AKZENTE.find((a) => a.schluessel === akzentSchluessel) ?? AKZENTE[0];
    return {
      palette: { ...farben, akzent: gewaehlt.akzent, akzentText: gewaehlt.akzentText },
      akzentSchluessel,
      setzeAkzent,
    };
  }, [akzentSchluessel, setzeAkzent]);

  return <FarbenKontext.Provider value={wert}>{children}</FarbenKontext.Provider>;
}

function useFarbenWert(): FarbenWert {
  const wert = useContext(FarbenKontext);
  if (!wert) throw new Error('Farben werden innerhalb von FarbenProvider benutzt.');
  return wert;
}

// Die aktuellen Farben für Oberflächen, die die Akzentfarbe brauchen.
export function useFarben(): Palette {
  return useFarbenWert().palette;
}

// Die Akzentwahl, für den Einstellungs-Bildschirm.
export function useAkzentWahl(): { akzentSchluessel: AkzentSchluessel; setzeAkzent: (s: AkzentSchluessel) => void } {
  const { akzentSchluessel, setzeAkzent } = useFarbenWert();
  return { akzentSchluessel, setzeAkzent };
}

// Styles, die von der Farbe abhängen. `gib` muss eine feste Funktion außerhalb des Bauteils sein.
export function useStile<T>(gib: (f: Palette) => T): T {
  const f = useFarben();
  return useMemo(() => gib(f), [f, gib]);
}
