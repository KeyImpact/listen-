// Liest die Farben aus dem Cover. Die Berechnung läuft in der Android-Schicht der Bibliothek, nicht im JavaScript-Teil.
import { useEffect, useState } from 'react';

import ImageColors from 'react-native-image-colors';

export interface CoverFarben {
  dominant: string;
  vibrant: string;
  muted: string;
  average: string;
}

// Holt die Farben eines Covers. Ohne Cover oder bei einem Fehler kommt null zurück.
// Die Bibliothek merkt sich das Ergebnis selbst (cache), deshalb rechnet es nicht bei jedem Öffnen neu.
export function useCoverFarben(coverUri: string | null): CoverFarben | null {
  const [farben, setFarben] = useState<{ uri: string; werte: CoverFarben } | null>(null);

  useEffect(() => {
    if (!coverUri) return;
    let aktiv = true;
    ImageColors.getColors(coverUri, { fallback: '#000000', cache: true, pixelSpacing: 5 })
      .then((ergebnis) => {
        if (!aktiv || ergebnis.platform !== 'android') return;
        setFarben({
          uri: coverUri,
          werte: {
            dominant: ergebnis.dominant,
            vibrant: ergebnis.vibrant,
            muted: ergebnis.muted,
            average: ergebnis.average,
          },
        });
      })
      .catch(() => {
        // Ohne Farben bleibt der Standard-Hintergrund stehen.
      });
    return () => {
      aktiv = false;
    };
  }, [coverUri]);

  // Nur Farben für das aktuelle Cover zählen. Alte Ergebnisse werden nicht angezeigt.
  return coverUri && farben && farben.uri === coverUri ? farben.werte : null;
}
