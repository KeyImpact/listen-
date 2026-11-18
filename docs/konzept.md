# Listen! – Konzept

## So arbeiten wir mit dieser Datei

- **Rohnotizen:** Deine Originalnotizen. Die bleiben unverändert.
- **Konzept:** Der abgestimmte Stand. Wenn wir etwas entscheiden, kommt es hier hinein.
- **Offene Punkte:** Fragen an dich. Deine Antwort steht direkt darunter.

Erledigte Schritte bekommen hier ein ✅ mit Datum. Jeder Umsetzungsschritt hat seinen eigenen Plan unter `docs/plan-schritt-N.md`. Gebaut wird erst nach deiner Freigabe.

## Rohnotizen

<!-- Original-Notizen ↓ -->

Die App soll Listen! heißen.
Die App ist für das Hören von Hörbüchern gedacht. Ich möchte dass die App mit Kapiteln klarkommt, vor und zurückspulen kann, verschnellern, Thumbnails anzeigen, Navigation in der Bücherbibliothek usw.
Ich nutze sie erstmal nur alleine und würde sie dann freunden zur verfügung stellen

<!-- ↑ Ende der Rohnotizen -->

## Konzept

### 1. Ziel & Zielgruppe

- **Ziel:** Eine App zum Hören von Hörbüchern auf dem Handy. Sie soll Kapitel, Spulen, Tempo und Cover gut können.
- **Phase 1:** Nur du, zum Testen im Alltag.
- **Phase 2:** Danach Freunde. Jeder installiert die App und hört seine eigenen Bücher vom eigenen Handy. Die App gibt keine Bücher weiter.

### 2. Nutzer & Rollen

- **Ein Nutzer pro Handy.** Kein Konto, kein Login. Die App arbeitet nur mit den Dateien auf dem Gerät.

### 3. Funktionen

**Version 1:**

- **Bibliothek:** Alle Hörbücher als Kacheln mit Cover (Thumbnail = kleines Vorschaubild), Titel, Autor und Fortschritt.
- **Navigation in der Bibliothek:** Suche und Sortierung (z. B. nach Titel oder zuletzt gehört).
- **Abspielen:** Play, Pause, Fortschrittsbalken.
- **Spulen:** Standard 15 Sekunden vor und zurück. Einstellbar sind 15 s, 30 s oder 1 min, getrennt für − und + (Entscheidung 2026-11-18).
- **Tempo:** Von 0,5× bis 2×, in Schritten von 0,5 (also 0,5 / 1 / 1,5 / 2). Begrenzt auf 2×, weil Android laut Expo-Doku nicht schneller geht (Entscheidung 2026-11-16, vorher 3×).
- **Kapitel:** Kapitelliste anzeigen, direkt zu einem Kapitel springen, nächstes und vorheriges Kapitel.
- **Position merken:** Die App speichert, wo du aufgehört hast, und setzt beim nächsten Start dort fort.
- **Hintergrund und Sperrbildschirm:** Das Hörbuch läuft weiter, wenn das Handy gesperrt ist. Steuerung über den Sperrbildschirm.

**Später (nicht in Version 1):**

- Lesezeichen mit Notiz
- Schlaf-Timer
- Hörstatistik
- Verteilung an Freunde (z. B. über einen Store, Art noch offen)

### 4. Bildschirme & Navigation

- **Bibliothek (Startseite):** Kachelraster mit Covers. Oben rechts in der Kopfleiste stehen die Knöpfe „Sortieren“ (Auswahl Titel oder Autor), „Suche“ (klappt die Suchleiste auf und zu) und „Neu einlesen“. „Hörbuch-Ordner wählen“ steht im leeren Bildschirm, solange noch kein Ordner gewählt ist. (Stand 2026-11-16, vor Schritt 2 geändert.)
- **Buch-Details:** Cover, Infos, Kapitelliste und ein Knopf „Weiter hören“.
- **Player:** Großes Cover, Steuerung, Tempo, aktuelles Kapitel.
- **Mini-Player:** Eine schmale Leiste unten. Sie zeigt das laufende Buch, auch wenn du in der Bibliothek bist.
- **Einstellungen:** Spulzeiten für − und + sind schon da. Standard-Tempo folgt in Schritt 5. Schon da: Akzentfarbe (Blau, Türkis, Grün, Orange, Rosa). Erreichbar über den Reiter und über das Zahnrad im Player.
- **Navigation:** Untere Leiste mit den Reitern „Bibliothek“ und „Einstellungen“.
- **Einstieg (Entscheidung 2026-11-18):** Die App öffnet das zuletzt gehörte Buch im Player, pausiert, an der gemerkten Stelle. Ohne gemerktes Buch startet sie in der Bibliothek.
- **Home-Knopf (Entscheidung 2026-11-18):** Oben Mitte in der Player-Kopfleiste. Führt zurück zur Bibliothek.
- **Kapitelliste (offen):** Emir möchte die geplante Kapitelliste so nicht. Wie es stattdessen aussehen soll, ist noch offen.

### 5. Inhalte & Datenmodell

Die App speichert Daten in Tabellen (ähnlich wie eine Excel-Tabelle). Jede Zeile hat eine eindeutige Nummer, den **Primärschlüssel**. Vorläufige Struktur:

- **Buch:** Nummer, Titel, Autor, Sprecher, Cover (Bild), Gesamtdauer, Speicherort der Datei
- **Kapitel:** Nummer, Buch-Nummer (verweist auf das Buch), Titel, Startzeit, Endzeit
- **Fortschritt:** Buch-Nummer, aktuelle Position in Sekunden, zuletzt gehört am, Tempo

**Hörbücher-Quelle:** Ein lokaler Ordner auf dem Smartphone. Die App liest die Dateien von dort ein.

**Dateiformat:** Nur M4B. Das Format enthält die Kapitel direkt in der Datei.

### 6. Plattformen & Tech-Stack

- **Plattform:** Handy. Zuerst Android (Version 16), iOS bleibt im Konzept, wird aber noch nicht getestet.
- **Tech-Stack:** Expo (React Native) ✅ bestätigt. Eine Codebasis für beide Systeme.
- **Audio:** Die passende Audio-Bibliothek für Kapitel, Hintergrundwiedergabe und Sperrbildschirm prüfe ich vor Schritt 1 in der aktuellen Doku.
- **Ordnerzugriff:** Die App bekommt Zugriff auf den Hörbuch-Ordner über die Dateiauswahl des Systems. Wie das auf Android und iOS genau aussieht, prüfen wir im Plan für Schritt 1.
- **Daten:** Alles auf dem Gerät. Kein Server, kein Supabase nötig.

### 7. Design

- **Dunkles Design** als Standard. ✅ bestätigt.
- **Bedienung:** Große Knöpfe, gut mit einer Hand zu erreichen.
- **Farben und Schrift:** Offen, machen wir zusammen, sobald die Bibliothek steht.

### 8. Kosten & Betrieb

- **Version 1:** Keine laufenden Kosten.
- **Später, für den Store:** Apple kostet rund 99 US-Dollar pro Jahr. Google Play kostet einmalig 25 US-Dollar. Das brauchst du nur, wenn die App über den Store laufen soll.

### 9. Umsetzungsreihenfolge

1. ✅ **Grundgerüst und Bibliothek** (Kacheln, Cover, Suche, Sortierung, Ordner einlesen). Gebaut 2026-11-16, auf dem Handy getestet. Plan: `docs/plan-schritt-1.md`.
2. ✅ **Player** (Abspielen, Pause, Spulen, Tempo, Mini-Player). Gebaut und auf dem Handy getestet (2026-11-18). Plan: `docs/plan-schritt-2.md`. Tempo bis 2× (Android-Grenze laut Expo-Doku).
3. 🟡 **Kapitel und Einstieg.** Kapitelsprung, Einstieg mit dem letzten Buch, Home-Knopf und gemerkte Stelle funktionieren und sind auf dem Handy getestet (2026-11-18). Offen: Gestaltung der Kapitelliste (Emir möchte die geplante Liste so nicht). Plan: `docs/plan-schritt-3.md`.
4. ⏸ **Hintergrund und Sperrbildschirm.** Zurückgenommen (2026-11-18). Braucht einen neuen Build, weil die Berechtigung für den Hintergrunddienst im Dev-Build fehlt. Gewählt: expo-audio mit Standard-Steuerung. Plan: `docs/plan-schritt-4.md`.
5. 🟡 **Feinschliff.** Spulzeiten sind schon fertig (2026-11-18, vorgezogen). Offen: Standard-Tempo, Fortschritt auf den Kacheln, Design.
6. **Test auf deinem Handy** im Alltag, mit dem Preview-Build (kein Laptop nötig).
7. **Später:** Verteilung an Freunde, Lesezeichen, Schlaf-Timer, Statistik.

## Übergabe (Stand 2026-11-18)

Damit die Arbeit in einer neuen Sitzung weitergeht, steht hier alles Wichtige.

**Projekt:**
- Ordner `C:devlisten`, Git-Branch `main`, Expo SDK 58, TypeScript, Expo Router.
- Befehle: `npm start` (Entwicklungsserver für den Dev-Build, im VS-Code-Terminal starten), `npm test`, `npm run typecheck`, `npx eslint .`.
- Hörbuch-Testdateien liegen in `testdaten/` (nicht im Repo). Die Tests lesen sie automatisch.
- EAS ist eingerichtet: Konto `keyimpact`, Projekt verknüpft (Projekt-ID in `app.json`). Builds nur im VS-Code-Terminal, wegen Anmeldung und Schlüssel-Abfrage.

**Was funktioniert (auf dem Handy bestätigt):**
- Ordner über den Android-Systemdialog wählen, Bücher mit Cover in der Bibliothek.
- Buch öffnen, Play, Pause, Tempo, Spulen (Zeit einstellbar), Kapitel vor und zurück, Zeitstrahl des aktuellen Kapitels.
- Die App startet im Player mit dem zuletzt gehörten Buch, pausiert an der gemerkten Stelle. Home-Knopf führt in die Bibliothek.

**Bekannte Lücken (nicht vergessen):**
- **Hintergrund und Sperrbildschirm:** Nicht drin, siehe Schritt 4. Die Wiedergabe stoppt bei gesperrtem Handy.
- **Kapitelliste:** Gestaltung offen. Die Detailseite `src/app/buch/[id].tsx` ist nicht fertig und noch nicht ins Menü eingebunden.
- **Fortschrittsbalken auf den Kacheln:** zeigt noch 0 %, Schritt 5.
- **Erstes Einlesen:** Beim ersten Mal musste man „Ordner neu einlesen“ tippen. Ursache unklar.
- **`app.json`:** Der Plugin setzt die Berechtigung `RECORD_AUDIO` (Mikrofon). Das brauchen wir nicht. Vor dem nächsten Build auf `recordAudioAndroid: false` setzen.

**Technische Hinweise:**
- **Audio-Modus:** Kein `interruptionMode: 'doNotMix'`, das lässt den Start scheitern. Die Hintergrund-Einstellung nur mit neuem Build.
- **Kapitelsprung:** Das Sprungziel bleibt angezeigt, bis die Wiedergabe es erreicht. Sonst springt die Anzeige kurz ins alte Kapitel.
- **Gemerkte Stelle:** Tabelle `lesestand` (Stelle und Tempo pro Buch). Der Name `fortschritt` ist auf dem Handy schon anders belegt.
- **Spulzeiten:** Tabelle `einstellung`, Schlüssel `spulzeit_zurueck` und `spulzeit_vor`.
- **Builds:** Jede Code-Änderung braucht für den Preview-Build einen neuen Build. Mit dem Dev-Build genügt `npm start`, außer bei Änderungen an nativen Berechtigungen.
- M4B-Leser: `src/lib/m4b.ts`. Datenbank: `src/lib/datenbank.ts`. Player: `src/lib/player-kontext.tsx`, reine Logik: `src/lib/player-logik.ts`.

**Nächste Schritte:**
1. Preview-Build starten (`npx eas-cli@latest build --platform android --profile preview` im VS-Code-Terminal). Vorher `recordAudioAndroid: false` entscheiden.
2. Entscheidung Kapitelliste: keine Liste (Empfehlung: nur ‹ und › im Player) oder Overlay.
3. Schritt 4 mit neuem Build: erst nur Hintergrund, dann Sperrbildschirm.

## Offene Punkte

1. ~~Welches Handy hast du?~~ **Beantwortet:** Android 16. Zuerst testen wir nur auf Android, iOS bleibt im Konzept.

2. ~~Woher kommen die Hörbücher?~~ **Beantwortet:** Aus einem lokalen Ordner auf dem Smartphone (siehe Abschnitt 5).

3. ~~Dateiformat~~ **Beantwortet:** Nur M4B.

4. ~~Tech-Stack~~ **Beantwortet:** Expo (React Native) ist bestätigt.

5. ~~Spulzeiten und Tempo~~ **Beantwortet:** 15 Sekunden vor und zurück. Tempo von 0,5× bis 2× in 0,5er-Schritten (vorher bis 3×, auf 2× begrenzt, weil Android nicht schneller geht).

6. ~~Freunde später: Anzahl und Konten~~ **Beantwortet:** Kein Konto nötig. Jeder nutzt die App mit seinen eigenen Dateien.

7. ~~Weitergabe der Bücher~~ **Nicht relevant für die App**, die App gibt keine Bücher weiter.

8. ~~Design~~ **Beantwortet:** Dunkles Design.
