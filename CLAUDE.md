# Listen!

## Worum es geht

Listen! ist eine App zum Hören von Hörbüchern auf dem Handy. Sie hat eine Bibliothek mit Covers, Kapitel, Spulen, Tempo und merkt die Position. Die Bücher liegen als M4B-Dateien in einem Ordner auf dem Handy. Erst nutzt Emir sie allein, später ein kleiner Freundeskreis (jeder mit eigenen Dateien, ohne Konto).

Vor jeder Planung `docs/konzept.md` lesen.

@../_wissen/expo-supabase.md

## Stand (2026-11-16)

- Konzept abgestimmt (`docs/konzept.md`).
- Schritt 1 (Grundgerüst und Bibliothek): ✅ 2026-11-16, auf dem Android-Handy getestet (Bücher werden angezeigt).
- Nächster Schritt: Schritt 2 (Player). Erst Plan `docs/plan-schritt-2.md` schreiben, dann Freigabe. Vollständige Übergabe: `docs/konzept.md`, Abschnitt „Übergabe“.

## Befehle

- `npm test` – Node-Tests (M4B-Leser, Suche, Sortierung)
- `npm run typecheck` – TypeScript-Prüfung
- `npx eslint .` – Lint (`npx expo lint` meldet hier einen Versionsfehler, obwohl ESLint installiert ist)
- `npm start` – Entwicklungsserver für das Handy (Expo Go)

## Projektstruktur

- `docs/` – Konzept und Pläne
- `src/app/` – Bildschirme (Expo Router): `(tabs)/index.tsx` Bibliothek, `(tabs)/einstellungen.tsx`
- `src/lib/` – Logik ohne Oberfläche: `m4b.ts` (M4B-Leser), `bibliothek-logik.ts` (Suche, Sortierung), `datenbank.ts` (SQLite), `ordner.ts` (Android-Ordner, Cover), `einlesen.ts` (verbindet alles)
- `src/components/` – Bausteine der Oberfläche
- `src/constants/farben.ts` – Farben (dunkles Design)
- `tests/` – Node-Tests (`*.test.mts`)
- `testdaten/` – echte Hörbücher zum Testen, nicht im Repo (gitignoriert)
