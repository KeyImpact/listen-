// Reine Logik für den Sleep-Timer: Voreinstellungen, Anzeige der Restzeit, Kapitelende und Ausblenden.
// Ohne Oberfläche und ohne Player, damit sie sich mit Node testen lässt.
import { aktuellesKapitel, type KapitelBereich } from './player-logik.ts';

// Die Dauern, die im Auswahl-Fenster stehen (in Minuten).
export const SCHLAF_PRESETS_MIN = [5, 10, 15, 30, 45, 60, 90] as const;
// Obergrenze für den Timer, auch beim Verlängern.
export const SCHLAF_MAX_MIN = 180;
// So viele Sekunden vor dem Ende blenden wir die Lautstärke aus.
export const AUSBLENDEN_SEK = 15;
// Liegt das Kapitelende weniger als so viele Sekunden entfernt, gilt das nächste Kapitel.
const KAPITEL_NAECHSTES_SCHWELLE_SEK = 10;

// Restzeit lesbar: „m:ss“ unter einer Stunde, sonst „h:mm:ss“. Nie negativ.
export function formatiereRest(sekunden: number): string {
  const s = Math.max(0, Math.ceil(sekunden));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sek = s % 60;
  const ss = String(sek).padStart(2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`;
  return `${m}:${ss}`;
}

// Die Lautstärke während des Ausblendens: 1 bis zum Beginn, dann linear bis 0.
export function ausblendLautstaerke(restSek: number): number {
  if (restSek >= AUSBLENDEN_SEK) return 1;
  return Math.min(1, Math.max(0, restSek / AUSBLENDEN_SEK));
}

// Das Ende des Kapitels, das bei der Position läuft. Liegt das Ende weniger als 10 s entfernt,
// ist das nächste Kapitel gemeint. Gibt auch den Start des Kapitels zurück, zu dem das Ende gehört.
export function kapitelEndeFuer(
  kapitel: KapitelBereich[],
  position: number,
): { ende: number; start: number } | null {
  const aktuell = aktuellesKapitel(kapitel, position);
  if (!aktuell) return null;
  const idx = kapitel.indexOf(aktuell);
  const naechstes = kapitel[idx + 1];
  if (aktuell.end_sek - position < KAPITEL_NAECHSTES_SCHWELLE_SEK && naechstes) {
    return { ende: naechstes.end_sek, start: naechstes.start_sek };
  }
  return { ende: aktuell.end_sek, start: aktuell.start_sek };
}

// Verlängert eine Restzeit (in Sekunden), höchstens bis zur Obergrenze.
export function verlaengern(restSek: number, minuten: number): number {
  return Math.min(SCHLAF_MAX_MIN * 60, restSek + minuten * 60);
}
