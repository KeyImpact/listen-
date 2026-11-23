// Logik für den Player ohne Oberfläche: Spulen, Tempo, Zeitanzeige.
// Reine Funktionen, damit sie mit Node getestet werden können (siehe tests/player-logik.test.mts).

export const SPRUNG_SEK = 15;
// Auswahl für die Spulzeit in den Einstellungen: 15 Sekunden, 30 Sekunden oder 1 Minute.
export const SPRUNG_OPTIONEN_SEK = [15, 30, 60] as const;
export const STANDARD_SPRUNG_SEK = 15;

// Anzeige einer Spulzeit, zum Beispiel „15 s“ oder „1 min“.
export function formatiereSpulzeit(sekunden: number): string {
  return sekunden < 60 ? `${sekunden} s` : `${sekunden / 60} min`;
}
export const TEMPO_MIN = 0.5;
// Obergrenze 2×: Die Expo-Doku nennt für Android nur bis 2,0 (Entscheidung von Emir, 2026-11-16).
export const TEMPO_MAX = 2;
export const TEMPO_SCHRITT = 0.5;

function begrenze(wert: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, wert));
}

// Neue Position nach dem Spulen. Nie unter 0, und nie über das Buchende.
// Ohne bekannte Länge (dauer = null) gibt es nur die untere Grenze.
export function spulePosition(position: number, sprung: number, dauer: number | null): number {
  const neu = position + sprung;
  if (dauer === null || dauer <= 0) return Math.max(0, neu);
  return begrenze(neu, 0, dauer);
}

// Nächstes oder vorheriges Tempo in 0,5er-Schritten, innerhalb von 0,5× bis 3×.
// Rechnet mit halben Schritten als ganze Zahlen, damit es keine Rundungsfehler gibt.
export function naechstesTempo(tempo: number, richtung: 1 | -1): number {
  const halbe = Math.round(tempo / TEMPO_SCHRITT) + richtung;
  return begrenze(halbe * TEMPO_SCHRITT, TEMPO_MIN, TEMPO_MAX);
}

// Tempo für die Anzeige, zum Beispiel „1×“, „1,5×“ oder „0,5×“.
export function formatiereTempo(tempo: number): string {
  const text = Number.isInteger(tempo) ? String(tempo) : tempo.toFixed(1).replace('.', ',');
  return `${text}×`;
}

// Zeit in Sekunden als „m:ss“ oder, ab einer Stunde, als „h:mm:ss“.
export function formatiereZeit(sekunden: number): string {
  const gesamt = Number.isFinite(sekunden) && sekunden > 0 ? Math.floor(sekunden) : 0;
  const stunden = Math.floor(gesamt / 3600);
  const minuten = Math.floor((gesamt % 3600) / 60);
  const rest = gesamt % 60;
  const sek = String(rest).padStart(2, '0');
  if (stunden > 0) {
    return `${stunden}:${String(minuten).padStart(2, '0')}:${sek}`;
  }
  return `${minuten}:${sek}`;
}

export interface KapitelBereich {
  titel: string;
  start_sek: number;
  end_sek: number;
}

// Wie genau ein Sprung an eine Kapitelgrenze sein muss, in Sekunden.
export const KAPITEL_TOLERANZ_SEK = 1.5;
// Länge eines Kapitels in Sekunden, nie negativ.
export function kapitelLaenge(kapitel: { start_sek: number; end_sek: number }): number {
  return Math.max(0, kapitel.end_sek - kapitel.start_sek);
}

// Das Kapitel, in dem gerade gespielt wird. Die Liste ist nach Startzeit sortiert.
export function aktuellesKapitel(kapitel: KapitelBereich[], position: number): KapitelBereich | null {
  let treffer: KapitelBereich | null = null;
  for (const k of kapitel) {
    if (k.start_sek <= position) treffer = k;
    else break;
  }
  return treffer;
}

// Ab so vielen Sekunden im Kapitel springt „zurück“ erst zum Kapitelanfang (statt ins Kapitel davor).
export const ZURUECK_SCHWELLE_SEK = 3;

// Startzeiten des vorherigen und des nächsten Kapitels, von der aktuellen Position aus gesehen.
// null heißt: Es gibt kein solches Ziel.
// zurueck: Mehr als ZURUECK_SCHWELLE_SEK im aktuellen Kapitel → dessen Anfang.
//          Sonst das Kapitel davor. Ein zweiter Tipp geht dann ins Kapitel davor.
// weiter:  Immer der Anfang des nächsten Kapitels.
export function kapitelSprungZiele(
  kapitel: KapitelBereich[],
  position: number,
): { zurueck: number | null; weiter: number | null } {
  let idx = -1;
  for (let i = 0; i < kapitel.length; i++) {
    if (kapitel[i].start_sek <= position) idx = i;
    else break;
  }
  // Vor dem ersten Kapitel: nur „weiter“ zum ersten Kapitel.
  if (idx < 0) {
    return { zurueck: null, weiter: kapitel.length > 0 ? kapitel[0].start_sek : null };
  }
  const aktuellerStart = kapitel[idx].start_sek;
  const zurueck =
    position - aktuellerStart > ZURUECK_SCHWELLE_SEK
      ? aktuellerStart
      : idx > 0
        ? kapitel[idx - 1].start_sek
        : null;
  return {
    zurueck,
    weiter: idx < kapitel.length - 1 ? kapitel[idx + 1].start_sek : null,
  };
}

// Anteil für den Fortschrittsbalken, zwischen 0 und 1.
export function fortschrittAnteil(position: number, dauer: number): number {
  if (!Number.isFinite(dauer) || dauer <= 0) return 0;
  return begrenze(position / dauer, 0, 1);
}

// Daten für die Mediensteuerung (Sperrbildschirm und Benachrichtigung).
// Titel ist der Kapitelname, Künstler der Buchtitel. Ohne Kapitel steht der Buchtitel im Titel.
export function sperrbildschirmDaten(
  buch: { titel: string; cover_pfad: string | null },
  kapitelTitel: string | null,
): { title: string; artist: string; artworkUrl?: string } {
  const daten: { title: string; artist: string; artworkUrl?: string } = {
    title: kapitelTitel && kapitelTitel.trim() !== '' ? kapitelTitel : buch.titel,
    artist: buch.titel,
  };
  if (buch.cover_pfad) daten.artworkUrl = buch.cover_pfad;
  return daten;
}
