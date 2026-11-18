# Listen!

## Worum es geht

Listen! ist eine App zum Hören von Hörbüchern auf dem Handy. Sie hat eine Bibliothek mit Covers, Kapitel, Spulen, Tempo und merkt die Position. Die Bücher liegen als M4B-Dateien in einem Ordner auf dem Handy. Erst nutzt Emir sie allein, später ein kleiner Freundeskreis (jeder mit eigenen Dateien, ohne Konto).

Vor jeder Planung `docs/konzept.md` lesen.

@../_wissen/expo-supabase.md

## Stand (2026-11-18)

- Konzept abgestimmt (`docs/konzept.md`).
- Schritt 1 (Bibliothek): ✅ auf dem Handy getestet.
- Schritt 2 (Player): ✅ auf dem Handy getestet.
- Schritt 3 (Kapitel, Einstieg, Home): funktioniert auf dem Handy. Kapitelliste-Gestaltung offen.
- Schritt 4 (Hintergrund, Sperrbildschirm): zurückgenommen, braucht einen neuen Build.
- Nächster Schritt: Preview-Build, dann Schritt 4. Vollständige Übergabe: `docs/konzept.md`, Abschnitt „Übergabe“.

## Befehle

- `npm test` – Node-Tests (M4B-Leser, Suche, Sortierung)
- `npm run typecheck` – TypeScript-Prüfung
- `npx eslint .` – Lint (`npx expo lint` meldet hier einen Versionsfehler, obwohl ESLint installiert ist)
- `npm start` – Entwicklungsserver für den Dev-Build auf dem Handy (nicht Expo Go)
- `npx eas-cli@latest build --platform android --profile preview` – Preview-Build in der Cloud (im VS-Code-Terminal)

## Projektstruktur

- `docs/` – Konzept und Pläne
- `src/app/` – Bildschirme (Expo Router): `(tabs)/index.tsx` Bibliothek, `(tabs)/einstellungen.tsx`
- `src/lib/` – Logik ohne Oberfläche: `m4b.ts` (M4B-Leser), `bibliothek-logik.ts` (Suche, Sortierung), `datenbank.ts` (SQLite), `ordner.ts` (Android-Ordner, Cover), `einlesen.ts` (verbindet alles)
- `src/components/` – Bausteine der Oberfläche
- `src/constants/farben.ts` – Farben (dunkles Design)
- `tests/` – Node-Tests (`*.test.mts`)
- `testdaten/` – echte Hörbücher zum Testen, nicht im Repo (gitignoriert)
