import { createContext, useContext, useMemo } from 'react';

import { imPlayerPalette, type EinstellungenOrt } from '@/lib/einstellungen-ort';
import { useFarben, type Palette } from '@/lib/farben-kontext';

// Sagt den Einstellungs-Seiten, ob sie im Player oder im Reiter gezeigt werden. Standard ist der Reiter.
export const EinstellungenOrtKontext = createContext<EinstellungenOrt>('tab');

export function useEinstellungenOrt(): EinstellungenOrt {
  return useContext(EinstellungenOrtKontext);
}

// Wie useStile, aber im Player mit der Player-Palette (transparenter Hintergrund, halbtransparente Karten).
export function useOrtStile<T>(gib: (f: Palette) => T): T {
  const f = useFarben();
  const ort = useEinstellungenOrt();
  const palette = useMemo(() => (ort === 'player' ? imPlayerPalette(f) : f), [f, ort]);
  return useMemo(() => gib(palette), [palette, gib]);
}
