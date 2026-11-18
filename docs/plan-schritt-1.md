# Plan Schritt 1: Grundgerüst und Bibliothek

Stand: 2026-11-18 · **Status: gebaut und auf dem Android-Handy getestet (Bücher werden mit Cover angezeigt).**

## Ziel

Die App startet auf deinem Android-Handy (Android 16) und zeigt eine Bibliothek. Du wählst einen Ordner mit M4B-Dateien, die App findet die Bücher und zeigt sie als Kacheln mit Cover, Titel und Autor. Dazu gibt es Suche und Sortierung.

Noch nicht dabei: Abspielen (Schritt 2), Kapitelliste (Schritt 3), Fortschritt speichern (Schritt 4).

## Was gebaut wird

1. **Projekt-Gerüst:** Expo mit Expo Router und TypeScript. Zwei Reiter unten: „Bibliothek“ und „Einstellungen“ (Einstellungen zunächst leer). Dunkles Design als Grundlage.
2. **Ordner wählen:** Über den Systemdialog von Android wählst du den Hörbuch-Ordner. Die App merkt sich die Erlaubnis, damit sie nach einem Neustart noch Zugriff hat.
3. **Bücher finden:** Die App durchsucht den Ordner und alle Unterordner nach `.m4b`-Dateien. Jede Datei wird genau einmal eingetragen, auch wenn du neu einliest.
4. **M4B lesen:** Titel, Autor, Gesamtdauer, Cover und Kapitel werden aus der Datei gelesen. Die Kapitel speichern wir schon jetzt, angezeigt werden sie erst in Schritt 3.
5. **Lokale Datenbank:** Die Bücher kommen in eine kleine Datenbank auf dem Handy (SQLite). Tabellen: `buch` und `kapitel`. Jedes Buch hat eine eindeutige Nummer (Primärschlüssel) und den Dateipfad als eindeutiges Merkmal.
6. **Bibliothek-Ansicht:**
   - Kachelraster (2 Spalten), mit Cover, Titel, Autor und Fortschrittsbalken (zeigt vorerst 0 %)
   - Suche nach Titel oder Autor, Groß- und Kleinschreibung egal
   - Sortierung: Titel A–Z oder Autor A–Z
   - Knopf „Ordner neu einlesen“
   - Leere Zustände: „Noch kein Ordner gewählt“ und „Keine Hörbücher gefunden“

## Entscheidungen (meine Empfehlungen, bitte bestätigen)

1. **Eigener M4B-Lesecode statt fertiger Bibliothek.** Ich prüfe vorher, ob es für React Native eine passende Bibliothek gibt. Falls nicht, schreiben wir einen kleinen Leser, der nur die Teile der Datei liest, in denen Metadaten stehen. Er muss nicht die ganze Datei einlesen, sonst dauert es bei großen Büchern zu lange.
2. **SQLite** für die lokalen Daten. Es ist eine Datei auf dem Handy, die Tabellen und Abfragen kennt. Dafür brauchen wir keinen Server.
3. **Cover als Bilddatei** im App-Speicher. In der Datenbank steht nur der Pfad dazu. So bleibt die Datenbank klein.
4. **Zuerst nur Android getestet.** iOS bleibt im Konzept, wird aber in diesem Schritt nicht geprüft.

## Nicht in Schritt 1

- Abspielen, Spulen, Tempo (Schritt 2)
- Kapitelliste und Kapitelsprung (Schritt 3)
- Fortschritt speichern, Hintergrund, Sperrbildschirm (Schritt 4)
- Inhalt der Einstellungen (Schritt 5)

## Tests und Prüfung

- **Reine Logik** (M4B-Leser, Suche, Sortierung): Mit Node direkt testen, ohne Handy. Die Testdateien liegen in `testdaten/`. Dieser Ordner ist in `.gitignore` und kommt nicht ins Repo. Dazu brauche ich von dir **zwei M4B-Dateien** (Kopien von deinen Büchern). Die Originale fasse ich nicht an.
- **Datenbank und Ordnerzugriff:** Nur auf dem Handy testbar, nicht im Node-Test.
- **Prüfung vor „fertig“:** Typecheck (`npx tsc --noEmit`), Lint, Node-Tests.
- **Oberfläche:** Web-Export und Screenshot im Browser (Edge headless). Ordnerzugriff und Datenbank gibt es dort nur eingeschränkt, deshalb ist der Screenshot nur ein Blick auf das Layout.
- **Auf dem Handy:** Du testest mit Expo Go, falls das für diese Module reicht. Sonst bauen wir einen Development Build (Android-APK über EAS). Den Unterschied erkläre ich, wenn es so weit ist.
- **Ehrlich berichten:** Ich schreibe am Ende, was getestet wurde und was nur auf dem Handy geprüft werden kann.

## Akzeptanzkriterien

- [ ] App startet auf Android 16 ohne Absturz
- [ ] Ordner wird über den Systemdialog gewählt, nach Neustart noch verfügbar
- [ ] M4B-Dateien, auch in Unterordnern, erscheinen als Kacheln mit Titel, Autor und Cover
- [ ] Fehlendes Cover zeigt ein Platzhalterbild
- [ ] Suche findet Titel und Autor, Groß- und Kleinschreibung egal
- [ ] Sortierung Titel A–Z und Autor A–Z funktioniert
- [ ] Neu einlesen erzeugt keine doppelten Bücher
- [ ] Nicht lesbare Datei wird übersprungen, mit kurzem Hinweis
- [ ] Dunkles Design
- [ ] Typecheck, Lint und Node-Tests laufen durch

## Baureihenfolge

1. Projekt-Gerüst, Reiter, dunkles Grundlayout
2. Ordnerwahl mit gemerkter Erlaubnis
3. M4B-Leser mit Tests zuerst (Testdateien von dir)
4. SQLite und Einlesen ohne Doppelte
5. Bibliothek-Ansicht mit Suche und Sortierung
6. Prüfungen, Screenshot, Konzept als ✅ markieren, Commit

## Abweichungen

- **Kapitel:** Es gibt zwei Arten, Kapitel in M4B zu speichern. Der Leser kann beide. Die zwei Beispielbücher nutzen die Kapitelspur (QuickTime-Stil). Ergebnis: 50 bzw. 28 Kapitel, Zeiten passen zur Gesamtdauer.
- **Expo-Vorlage:** Expo SDK 58 mit Expo Router und Tabs. Die Demo-Dateien habe ich entfernt. Dazu kamen `expo-file-system` und `expo-sqlite`. Entfernt habe ich `@expo/ui`, `expo-glass-effect` und `expo-symbols`.
- **Web-Test:** `expo-sqlite` braucht im Browser eine eigene Metro-Einstellung. Dafür gibt es `metro.config.js`.
- **Paketname:** `app.listen.hoerbuch` (Android). Vor einem Store-Upload kann der geändert werden.
- **Tab-Leiste:** Nur Text, ohne Symbole.
- **Tests:** Node-Tests laufen mit `npm test`. Die zwei echten Bücher aus `testdaten/` werden dabei automatisch mitgelesen.
- **Lint:** `npx expo lint` meldet einen Versionsfehler, obwohl ESLint installiert ist. Deshalb läuft `npx eslint .` direkt.

## Geprüft

- Typecheck (`npm run typecheck`): grün, inklusive Testdateien
- Lint (`npx eslint .`): grün
- Node-Tests: 22 von 22 grün, davon 2 mit echten Büchern
- Web-Export und Screenshot im Browser: Layout, Dunkel-Design und leerer Zustand ohne JS-Fehler. Kacheln mit Covers sind im Browser nicht zu sehen, weil dort keine Bücher liegen.

## Noch nicht geprüft (nur auf dem Handy möglich)

- Ordnerwahl über den Android-Systemdialog
- Bleibt die Ordner-Erlaubnis nach einem Neustart erhalten?
- Die Suche nach M4B-Dateien in Unterordnern über den Android-Ordnerzugriff
- Einlesen auf dem Gerät, Cover-Anzeige, Speichern in SQLite
- Start in Expo Go auf Android 16
