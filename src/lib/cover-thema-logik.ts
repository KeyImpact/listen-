// Cover-Hintergrund des Players: Farben normalisieren, Lesbarkeit prüfen, Verlauf berechnen.
// Reine Logik ohne Oberfläche, damit sie sich mit Node testen lässt. Die App ist durchgehend dunkel gestaltet.

export type HintergrundModus = 'off' | 'blur' | 'gradient';
export const HINTERGRUND_STANDARD: HintergrundModus = 'gradient';
// Die Namen für die Einstellungen.
export const HINTERGRUND_NAMEN: Record<HintergrundModus, string> = {
  off: 'Standard',
  blur: 'Unscharfes Cover',
  gradient: 'Farbverlauf',
};

// Zoom des unscharfen Covers (Konstante, Bereich 1,2 bis 1,6).
export const UNSCHARF_ZOOM = 1.4;
// Abdunkelung in Prozent-Anteilen. Der Standard liegt bei 45 %.
export const ABDUNKEL_OPTIONEN = [0.2, 0.3, 0.45, 0.6, 0.7] as const;
export const ABDUNKEL_STANDARD = 0.45;
// Obergrenze, wenn die Abdunkelung für gute Lesbarkeit nachgezogen wird.
const ABDUNKEL_MAX = 0.75;
// WCAG: Text braucht mindestens 4,5:1 Kontrast.
export const KONTRAST_TEXT_MIN = 4.5;

// Farbgrenzen für den Verlauf (HSL, Dunkelmodus).
const DUNKEL_HELLIGKEIT = { min: 0.25, max: 0.4 };
const DUNKEL_SAETTIGUNG_MAX = 0.7;
// Unter dieser Sättigung gilt ein Cover als grau. Dann färben wir nichts ein.
const GRAU_SAETTIGUNG = 0.1;

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export function hexZuRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  const voll = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
  return {
    r: parseInt(voll.slice(0, 2), 16),
    g: parseInt(voll.slice(2, 4), 16),
    b: parseInt(voll.slice(4, 6), 16),
  };
}

export function rgbZuHex({ r, g, b }: Rgb): string {
  const teil = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
  return `#${teil(r)}${teil(g)}${teil(b)}`;
}

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function rgbZuHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return { h: h / 6, s, l };
}

function hueZuRgb(p: number, q: number, t: number): number {
  let x = t;
  if (x < 0) x += 1;
  if (x > 1) x -= 1;
  if (x < 1 / 6) return p + (q - p) * 6 * x;
  if (x < 1 / 2) return q;
  if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
  return p;
}

function hslZuRgb({ h, s, l }: Hsl): Rgb {
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hueZuRgb(p, q, h + 1 / 3) * 255,
    g: hueZuRgb(p, q, h) * 255,
    b: hueZuRgb(p, q, h - 1 / 3) * 255,
  };
}

// Die Cover-Farbe für den Dunkelmodus: Helligkeit und Sättigung in den erlaubten Bereich.
// Graue Cover bleiben grau.
export function normalisiereFarbe(hex: string): string {
  const hsl = rgbZuHsl(hexZuRgb(hex));
  if (hsl.s < GRAU_SAETTIGUNG) return rgbZuHex(hslZuRgb({ ...hsl, s: 0 }));
  const l = Math.min(DUNKEL_HELLIGKEIT.max, Math.max(DUNKEL_HELLIGKEIT.min, hsl.l));
  const s = Math.min(DUNKEL_SAETTIGUNG_MAX, hsl.s);
  return rgbZuHex(hslZuRgb({ h: hsl.h, s, l }));
}

// Relative Helligkeit nach WCAG (0 = schwarz, 1 = weiß).
export function relativeHelligkeit(hex: string): number {
  const kanal = (wert: number) => {
    const n = wert / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };
  const { r, g, b } = hexZuRgb(hex);
  return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b);
}

// Kontrastverhältnis zwischen zwei Farben (1 bis 21).
export function kontrast(a: string, b: string): number {
  const la = relativeHelligkeit(a);
  const lb = relativeHelligkeit(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Mischt eine Farbe mit Schwarz. alpha ist die Abdunkelung (0 = unverändert, 1 = schwarz).
export function abdunkeln(hex: string, alpha: number): string {
  const { r, g, b } = hexZuRgb(hex);
  const f = 1 - alpha;
  return rgbZuHex({ r: r * f, g: g * f, b: b * f });
}

// Die Abdunkelung, die für Text auf dem Hintergrund reicht. Startet bei der gewählten Stärke
// und wird nur erhöht, wenn der Kontrast zu gering ist.
export function abdunklungFuer(gewaehlt: number, hintergrund: string): number {
  let alpha = gewaehlt;
  while (alpha < ABDUNKEL_MAX && kontrast('#ffffff', abdunkeln(hintergrund, alpha)) < KONTRAST_TEXT_MIN) {
    alpha = Math.min(ABDUNKEL_MAX, alpha + 0.05);
  }
  return alpha;
}

// Der Verlauf von oben nach unten: Cover-Farbe, dann die App-Hintergrundfarbe.
export function verlaufFuer(coverFarbe: string, appHintergrund: string): { farben: string[]; stellen: number[] } {
  return {
    farben: [normalisiereFarbe(coverFarbe), appHintergrund, appHintergrund],
    stellen: [0, 0.65, 1],
  };
}

// Die Farbe für den Verlauf: vibrant zuerst, dann dominant, dann muted. Ohne Treffer gilt der App-Akzent.
export function farbeAusPalette(
  palette: { vibrant?: string; dominant?: string; muted?: string } | null,
  akzent: string,
): string {
  return palette?.vibrant || palette?.dominant || palette?.muted || akzent;
}
