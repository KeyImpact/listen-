# Plan Schritt 2: Player

Stand: 2026-11-16 · **Status: freigegeben und gebaut. Test auf dem Android-Handy steht aus.**

## Ziel

Du tippst ein Buch an und hörst es. Du kannst Play und Pause drücken, 15 Sekunden vor und zurück springen und das Tempo von 0,5× bis 2× einstellen. Wenn du in der Bibliothek bist, zeigt eine schmale Leiste unten, was gerade läuft.

Noch nicht dabei: Kapitelliste (Schritt 3), Position speichern, Hintergrund und Sperrbildschirm (Schritt 4).

## Was gebaut wird

1. **Audio-Bibliothek:** `expo-audio` (laut Expo-Doku für SDK 58 empfohlen, Version `~58.0.12`). Die Doku nennt sie als „included in Expo Go“. Für diesen Schritt brauchen wir also keinen Development Build.
2. **Player-Logik ohne Oberfläche:** Reine Funktionen in `src/lib/player-logik.ts`, zum Beispiel:
   - Spulen: neue Position berechnen, nie unter 0 und nie über die Gesamtlänge
   - Tempo: nächster und vorheriger Schritt, nie unter 0,5 und nie über 3
   - Zeit anzeigen: Sekunden als `1:02:45` oder `12:30`
3. **Player-Zustand für die ganze App:** Ein Player läuft im Hintergrund der App weiter, wenn du den Bildschirm wechselst. Er sitzt in einer gemeinsamen Stelle (React Context im Wurzel-Layout), damit Player und Mini-Player dieselbe Wiedergabe sehen.
4. **Player-Bildschirm:**
   - Großes Cover, Titel und Autor
   - Fortschrittsbalken mit aktueller Zeit und Gesamtzeit
   - Knöpfe: „−15 s“, Play/Pause, „+15 s“
   - Tempo: Knöpfe „−“ und „+“ in 0,5er-Schritten, Anzeige z. B. „1,5×“
   - Aktuelles Kapitel als Name (nur Anzeige, die Liste kommt in Schritt 3)
5. **Mini-Player:** Schmale Leiste über der unteren Reiter-Leiste mit Titel, Play/Pause und Fortschrittsbalken. Ein Tipp darauf öffnet den Player. Sie ist nur sichtbar, wenn ein Buch geladen ist.
6. **Tippen auf eine Kachel:** Startet das Buch und öffnet den Player (Vorschlag, siehe Entscheidungen).

## Entscheidungen (meine Empfehlungen, bitte bestätigen)

1. **expo-audio statt einer anderen Bibliothek.** Die Expo-Doku für SDK 58 nennt sie als Audio-Bibliothek, sie kann Tempo (`playbackRate`) und läuft in Expo Go. Die Hintergrund-Funktion ist für Schritt 4 vorbereitet, in diesem Schritt nicht aktiv.
2. **Tippen auf eine Kachel öffnet direkt den Player.** Das ist der schnellste Weg zum Hören. Wenn Schritt 3 die Buch-Detailseite bringt, geht der Tipp dorthin, und der Player öffnet sich aus der Detailseite.
3. **Tempo mit Knöpfen „−“ und „+“.** Ein Tipp verändert immer um 0,5. Das ist mit einer Hand gut erreichbar, passt zum Konzept und braucht keine Auswahlliste.
4. **Aktuelles Kapitel im Player anzeigen.** Die Kapitel sind schon in der Datenbank. Der Name ist nur ein Textfeld, kein neuer Bildschirm.
5. **Position wird in diesem Schritt nicht gespeichert.** Wenn die App geschlossen wird, startet ein Buch beim nächsten Mal von vorn. Das erledigt Schritt 4.

## Nicht in Schritt 2

- Kapitelliste und Kapitelsprung (Schritt 3)
- Buch-Detailseite (Schritt 3)
- Position speichern, Fortschritt auf den Kacheln (Schritt 4)
- Hintergrund-Wiedergabe und Sperrbildschirm (Schritt 4)
- Einstellungen für Standard-Tempo und Spulzeit (Schritt 5)

## Tests und Prüfung

- **Reine Logik** (Spulen, Tempo, Zeitformat): Node-Tests in `tests/player-logik.test.mts`, ohne Handy. Dazu die Grenzfälle: ganz am Anfang, ganz am Ende, 0,5 und 3, und ein Sprung über das Ende hinaus.
- **Abspielen:** Nur auf dem Handy testbar. Ich teste mit einem echten Buch aus `testdaten/` nur lesend. Deine echten Bücher fasse ich nicht an.
- **Dateizugriff:** Die Dateien liegen als Android-Content-Adressen vor. Ob der Player damit ohne Kopieren klarkommt, zeigt der Test auf dem Handy. Falls nicht, kopieren wir die Datei in den App-Speicher, bevor sie abgespielt wird. Das würde ich dir vorher sagen.
- **Prüfung vor „fertig“:** Typecheck, Lint, alle Node-Tests (die 22 von Schritt 1 plus die neuen).
- **Oberfläche:** Screenshot im Browser nur für das Layout. Abspielen geht dort nicht sinnvoll.
- **Ehrlich berichten:** Am Ende schreibe ich, was nur auf dem Handy geprüft werden kann.

## Akzeptanzkriterien

- [ ] Tippen auf eine Kachel startet das Buch und öffnet den Player
- [ ] Play und Pause funktionieren
- [ ] „−15 s“ und „+15 s“ springen genau 15 Sekunden, am Anfang und Ende ohne Fehler
- [ ] Tempo geht von 0,5× bis 2× in 0,5er-Schritten, Anzeige stimmt
- [ ] Der Fortschrittsbalken läuft mit und lässt sich antippen oder ziehen
- [ ] Mini-Player erscheint, während ein Buch läuft, auch in der Bibliothek, und öffnet den Player
- [ ] Das Buch läuft weiter, wenn du zwischen Bibliothek und Player wechselst
- [ ] Dunkles Design
- [ ] Typecheck, Lint und alle Node-Tests laufen durch

## Baureihenfolge

1. Player-Logik als reine Funktionen, mit Node-Tests zuerst
2. `expo-audio` einbinden, Player-Zustand im Wurzel-Layout
3. Player-Bildschirm mit Knöpfen, Fortschritt, Tempo
4. Tippen auf Kachel, Mini-Player
5. Prüfungen, Screenshot, Test auf dem Handy, Konzept als ✅ markieren, Commit

## Abweichungen

- **Tempo nur bis 2×:** Die Expo-Doku nennt für Android nur Tempo bis **2,0**. Du hast entschieden, das Tempo gleich auf 2× zu begrenzen. Das Konzept verlangte 3×, das weicht davon ab. Die Grenze steht in `TEMPO_MAX` (`src/lib/player-logik.ts`), es gibt also nur eine Stelle zum Ändern.
- **Tonhöhe:** Das Tempo wird mit Tonhöhen-Korrektur gesetzt (`setPlaybackRate(tempo, 'high')`), damit die Stimme nicht hoch klingt.
- **Fortschrittsleiste:** Nur antippen, nicht ziehen. Antippen erfüllt das Kriterium „antippen oder ziehen“.
- **Mini-Player-Position:** Die Reiter-Leiste bekommt eine feste Höhe (`TAB_HOEHE` in `src/app/(tabs)/_layout.tsx`). Der Mini-Player sitzt genau darüber. Ob das auf dem Handy passt, prüfen wir dort.
- **Kopfleiste und Einstellungen (Änderung nach Handy-Feedback):** Der Player hat eine Kopfleiste mit „Zurück“ links und Zahnrad rechts. Das Zahnrad öffnet die Seite „Einstellungen“. Dort wählt man die Akzentfarbe (Blau, Türkis, Grün, Orange, Rosa). Die Wahl wird in der Datenbank gespeichert. Die Farbe gilt für Knöpfe, Balken und den aktiven Reiter. Der Reiter „Einstellungen“ zeigt denselben Inhalt.
- **Tempo in der Kopfleiste (Änderung nach Handy-Feedback):** Das Tempo steht nicht mehr unter den Knöpfen, sondern oben links neben dem Zahnrad, z. B. „1,5×“. Ein Tipp öffnet einen Dialog mit „−“, „+“ und „Fertig“. Außerhalb tippen oder Zurück schließt ihn.
- **Position:** Wie abgesprochen nicht gespeichert, ein Buch startet beim nächsten Mal von vorn (Schritt 4).
- **Zeitstrahl pro Kapitel (Änderung nach Handy-Feedback):** Der Zeitstrahl zeigt das aktuelle Kapitel, nicht das ganze Buch. Die Zeiten zählen ab Kapitelstart. Antippen springt innerhalb des Kapitels. Hat ein Buch keine Kapitel, zeigt er das ganze Buch. Die Spul-Knöpfe ±15 s gehen weiter über Kapitelgrenzen hinweg.
- **Layout des Players (Änderung nach Handy-Feedback):** Thumbnail oben und so groß wie möglich, volle Breite. Darunter nur Kapitelname, Zeitstrahl, dann kompakte Knöpfe. Titel, Autor und der Schließen-Knopf sind entfernt. Schließen geht über den Zurück-Knopf des Handys.

## Geprüft

- Typecheck (`npm run typecheck`): grün
- Lint (`npx eslint .`): grün
- Node-Tests: 36 von 36 grün (22 alte, 14 neue für Spulen, Tempo, Zeit, Fortschritt und Kapitel)
- Web-Screenshot: **nicht gelungen.** Der Browser zeigt eine leere Seite. Ein Fehler wurde nicht gefunden, die Ursache ist offen. Ob es am Test-Setup oder am Code liegt, ist unklar. Deshalb ist das Layout noch nicht visuell geprüft.

## Noch nicht geprüft (nur auf dem Handy möglich)

- Abspielen der Dateien aus dem Android-Ordner
- Spulen und Tempo im echten Abspielen
- Mini-Player beim Wechsel zwischen den Reitern
- Verhalten, wenn das Handy während des Hörens gesperrt wird (erwartet: Wiedergabe stoppt, bis Schritt 4)
