// Wo die Einstellungen gerade stehen: im Player (mit fester Kopfleiste und Cover-Hintergrund)
// oder im Reiter „Einstellungen“ (wie bisher). Reine Logik, ohne Oberfläche.

export type EinstellungenOrt = 'player' | 'tab';

// Halbtransparente Flächen für Karten und Trennlinien, damit sie über Blur und Verlauf lesbar bleiben.
export const PLAYER_KARTE = 'rgba(0, 0, 0, 0.28)';
export const PLAYER_TRENNER = 'rgba(255, 255, 255, 0.08)';
export const PLAYER_CHIP = 'rgba(255, 255, 255, 0.12)';

// Baut den Pfad zu einer Unterseite. Im Player liegen sie unter /player/, im Reiter direkt unter /.
export function einstellungenPfad(ort: EinstellungenOrt, ziel: string): string {
  return ort === 'player' ? `/player/${ziel}` : `/${ziel}`;
}

// Die Farben für den Player: Hintergrund transparent (der Cover-Hintergrund liegt darunter),
// Karten halbtransparent. Alle anderen Farben bleiben gleich.
export function imPlayerPalette<T extends Record<string, string>>(f: T): T {
  return {
    ...f,
    hintergrund: 'transparent',
    flaeche: PLAYER_KARTE,
    flaecheHell: PLAYER_CHIP,
    spur: PLAYER_TRENNER,
  };
}
