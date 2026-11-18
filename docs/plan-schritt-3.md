# Plan Schritt 3: Kapitel und Buch-Detailseite

Stand: 2026-11-18 · **Status: gebaut. Auf dem Handy getestet: Kapitelsprung (weiter und zurück), Einstieg mit dem letzten Buch, Home-Knopf. Offen: Gestaltung der Kapitelliste (Emir möchte die geplante Liste so nicht).**

## Erweiterung (von Emir gewünscht, 2026-11-17)

- **Letztes Buch beim Start:** Die App öffnet beim Start das zuletzt gehörte Buch an der gemerkten Stelle. Es startet **pausiert**, du drückst Play. So gibt es keinen Ton beim Öffnen der App.
- **Position merken:** Stelle und Tempo pro Buch (Tabelle `fortschritt`). Gespeichert wird bei Pause, beim Verlassen der App und alle 5 Sekunden beim Hören. Ein Buch wechseln speichert das alte vorher.
- **Kapitel-Sprung-Fehler behoben:** Pausiert das Buch, meldet der Player nach einem Sprung keine neue Zeit. Die App merkt sich deshalb die Sprungstelle und rechnet damit. Vorher sprang „weiter“ bei Pause nicht ins nächste Kapitel.
- Der Start-Stopp-Knopf bleibt wie im Stand von Schritt 2 (kein Glas-Symbol auf dem Bild).
- Der Audio-Modus bleibt ohne `interruptionMode`.
- Der Kachel-Fortschritt (Balken auf den Kacheln) bleibt im Schritt 5 wie im Konzept.

### Änderungen von Emir (2026-11-18)

- **Einstieg:** Die App öffnet direkt den Player mit dem zuletzt gehörten Buch, pausiert, an der gemerkten Stelle. Gibt es noch kein Buch mit gemerkter Stelle, landet man in der Bibliothek.
- **Home-Knopf:** Mitte der Player-Kopfleiste, führt zurück zur Bibliothek (`router.dismissAll()`). Die Bibliothek liegt also immer unter dem Player.
- **Kapitelsprung-Fehler (neue Ursache):** Der Player landet manchmal einige Sekunden vor dem Kapitelanfang. Dann stand man am Ende des alten Kapitels. Fix: Nach einem Sprung prüft die App, ob der Player am Ziel ist, und springt bei Bedarf bis zu zweimal nach (innerhalb von 3 Sekunden). Solange der Sprung läuft, zeigt die App das Ziel an. *Nur auf dem Handy prüfbar. Die Ursache ist eine Vermutung.*
- **Kapitelliste:** Emir möchte die Kapitelliste so nicht. Offen, wie es stattdessen aussehen soll. Bis dahin bleibt die Detailseite unverändert im Stand, in dem sie ist (nicht committet).
- **Stand-Speicherung:** Die Tabelle `lesestand` (Stelle und Tempo pro Buch; nicht `fortschritt`, weil auf dem Handy schon eine Tabelle dieses Namens mit anderen Spalten liegt) wird schon jetzt genutzt. Gespeichert wird beim Pausieren, beim Buchwechsel, alle 5 Sekunden beim Hören und beim Verlassen der App. Das ist aus Schritt 4 vorgezogen, weil der Einstieg es braucht.

## Ziel

Du tippst ein Buch an und siehst eine Seite mit Cover, Titel, Autor und allen Kapiteln. Ein Tipp auf ein Kapitel startet das Buch genau dort und öffnet den Player. Im Player kannst du zum vorherigen oder nächsten Kapitel springen (das gibt es schon) und das aktuelle Kapitel sehen.

## Was schon da ist (Stand Schritt 2)

- Die Kapitel liegen in der Datenbank (Tabelle `kapitel`, Funktion `holeKapitel`).
- Im Player gibt es die Pfeile „‹“ und „›“ für vorheriges und nächstes Kapitel und den Kapitelnamen.
- Ein Tipp auf eine Kachel startet das Buch und öffnet direkt den Player.

## Was gebaut wird

1. **Buch-Detailseite** als eigene Seite im Root-Stack (`src/app/buch/[id].tsx`). Sie ist vom Reiter „Bibliothek“ aus erreichbar, und der Zurück-Knopf führt zurück zur Bibliothek. Oben Cover, Titel, Autor, Gesamtdauer.
2. **Kapitelliste** auf der Detailseite: Nummer, Titel, Startzeit und Länge jedes Kapitels. Das Kapitel, das gerade läuft, ist markiert.
3. **Kapitel-Sprung:** Tipp auf ein Kapitel startet das Buch an dessen Startzeit und öffnet den Player. Läuft dasselbe Buch schon, springt die App nur dorthin und öffnet den Player.
4. **Kachel-Tipp** öffnet die Detailseite statt direkt den Player (siehe Entscheidung 1).
5. **Mini-Player** bleibt wie in Schritt 2 und öffnet weiterhin den Player.
6. **Reine Logik** in `src/lib/player-logik.ts` oder einer neuen Datei, mit Node-Tests: Kapitel für eine Position finden (gibt es schon), Länge eines Kapitels berechnen, Liste formatieren.

## Entscheidungen (meine Empfehlungen, bitte bestätigen)

1. **Kachel öffnet die Detailseite.** Das passt zum Plan aus Schritt 2 (Entscheidung 2) und zum Konzept. *Empfehlung: so.* Alternative: Kachel startet das Buch wie bisher, die Kapitel gibt es nur im Player.
2. **Kapitelliste nur auf der Detailseite, nicht im Player.** Der Player bleibt schlank. *Empfehlung: so.* Alternative: zusätzlich eine Liste im Player als Overlay (mehr Aufwand, doppelte Oberfläche).
3. **Buch mit Kapiteln oder ohne.** Hat ein Buch keine Kapitel, zeigt die Detailseite nur Cover und Start-Knopf, keine leere Liste. *Empfehlung: so.*

## Offen (2026-11-18)

- **Kapitelliste:** Emir möchte die Kapitelliste auf der Detailseite so nicht. Wie es stattdessen aussehen soll, ist noch offen. Die Detailseite (`src/app/buch/[id].tsx`) ist deshalb nicht fertig.
- **Kachel-Tipp:** Wie in der Erweiterung beschrieben, startet ein Tipp auf eine Kachel das Buch direkt im Player. Eine Detailseite gibt es nur, wenn die Kapitelliste kommt.

## Nicht in Schritt 3

- Position speichern und Fortschritt auf den Kacheln (Schritt 4)
- Hintergrund und Sperrbildschirm (Schritt 4)
- Farbverlauf aus dem Cover (wird später separat geplant)
- Einstellungen für Standard-Tempo und Spulzeit (Schritt 5)

## Technische Hinweise

- **Audio-Modus nicht verändern.** In Schritt 4 zeigte sich: `interruptionMode: 'doNotMix'` lässt den Start still scheitern, wenn Android den Audio-Fokus verweigert. Schritt 3 fasst den Audio-Modus nicht an.
- **Startzeit eines Kapitels:** Der Player landet manchmal wenige Sekunden davor. Die Toleranz aus `KAPITEL_TOLERANZ_SEK` gilt schon.
- **Neue Routen** brauchen einen Eintrag im Root-Stack und einmal `npx expo start`, damit TypeScript die neuen Routen kennt.

## Tests und Prüfung

- **Reine Logik:** Node-Tests (Kapitel finden, Listen-Anzeige).
- **Oberfläche:** Nur auf dem Handy prüfbar. Ablauf: Kachel tippen → Detailseite zeigt Kapitel → Kapitel tippen → Player startet an der richtigen Stelle → Zurück führt zur Detailseite.
- **Prüfung vor „fertig“:** Typecheck, Lint, alle Node-Tests.
- **Ehrlich berichten:** Was nur auf dem Handy geprüft werden kann.

## Akzeptanzkriterien

- [ ] Kachel-Tipp öffnet die Detailseite mit Cover, Titel und Autor
- [ ] Kapitelliste zeigt alle Kapitel mit Startzeit, das laufende ist markiert
- [ ] Tipp auf ein Kapitel startet das Buch an dieser Stelle und öffnet den Player
- [ ] Buch ohne Kapitel zeigt keine leere Liste
- [ ] Mini-Player und Player funktionieren wie in Schritt 2
- [ ] Typecheck, Lint und alle Node-Tests laufen durch

## Baureihenfolge

1. Reine Logik mit Tests (Kapitel-Anzeige, Länge)
2. Detailseite mit Kopf und Kapitelliste
3. Kachel-Tipp auf die Detailseite umstellen, Kapitel-Sprung verbinden
4. Prüfungen, Handy-Test, Konzept als ✅ markieren, Commit (du pushst)

## Offene Fragen

- Soll die Detailseite den Knopf „Abspielen“ haben, der beim letzten Stand weitermacht? Empfehlung: ja, sobald Schritt 4 die Position speichert. Bis dahin startet er immer am Anfang.
