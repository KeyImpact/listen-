// Smart Rewind: Nach einer Pause springt das Buch ein Stück zurück. Je länger die Pause, desto größer der Sprung.
// Reine Logik ohne Player, damit sie sich mit Node testen lässt.

// Unter dieser Pausendauer (in Sekunden) gibt es keinen Rücksprung (versehentliches Doppel-Tippen).
export const PAUSE_MINDEST_SEK = 1;
// Nach einem Stopp durch den Sleep-Timer springen wir mindestens so weit zurück.
export const SCHLAF_RUECKSPRUNG_MIN_SEK = 30;
// Hat sich die Position während der Pause um mehr als das verschoben, hat der Nutzer selbst gesprungen.
export const MANUELL_TOLERANZ_SEK = 1.5;

// Die Staffel: ab welcher Pausendauer (Sekunden) wie weit zurückgesprungen wird.
const STAFFEL: { ab: number; rueckSek: number }[] = [
  { ab: 0, rueckSek: 0 },
  { ab: 1, rueckSek: 2 },
  { ab: 60, rueckSek: 5 },
  { ab: 300, rueckSek: 10 },
  { ab: 1800, rueckSek: 20 },
  { ab: 7200, rueckSek: 30 },
];

// Der Rücksprung für eine Pausendauer aus der Staffel.
export function staffelRueckSek(pauseSek: number): number {
  let ergebnis = 0;
  for (const stufe of STAFFEL) {
    if (pauseSek >= stufe.ab) ergebnis = stufe.rueckSek;
  }
  return ergebnis;
}

// Der Rücksprung beim Fortsetzen. Null, wenn der Nutzer in der Pause selbst gesprungen ist.
export function rueckspringenFuerPause(opts: {
  pauseSek: number;
  pausePosition: number;
  jetztPosition: number;
  nachSchlafStopp: boolean;
}): number {
  if (opts.pauseSek < PAUSE_MINDEST_SEK) return 0;
  if (Math.abs(opts.jetztPosition - opts.pausePosition) > MANUELL_TOLERANZ_SEK) return 0;
  const staffel = staffelRueckSek(opts.pauseSek);
  return opts.nachSchlafStopp ? Math.max(SCHLAF_RUECKSPRUNG_MIN_SEK, staffel) : staffel;
}
