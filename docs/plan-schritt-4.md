# Plan Schritt 4: Hintergrund, Sperrbildschirm und Benachrichtigung

Stand: 2026-11-18 · **Status: Umgesetzt im Code (2026-11-20), noch nicht auf dem Handy getestet. Braucht einen neuen Development Build.**

## Umsetzung (2026-11-20)

- `app.json`: `RECORD_AUDIO` entfernt, Plugin mit `recordAudioAndroid: false` und `enableBackgroundPlayback: true`.
- `player-kontext.tsx`: `setAudioModeAsync` mit `shouldPlayInBackground: true` und `interruptionMode: 'doNotMix'` beim Start. Der Sperrbildschirm wird aktiviert, sobald ein Buch geladen ist. Bei jedem Kapitelwechsel und jeder Spulzeit-Änderung wird er neu gesetzt (statt `updateLockScreenMetadata`, damit nur ein Effekt nötig ist).
- `player-logik.ts`: reine Funktionen `sperrbildschirmDaten` und `sperrbildschirmOptionen`, getestet in `tests/player-logik.test.mts`.
- Offen: Test auf dem Handy (Bildschirm aus, andere App, Benachrichtigung, Anruf) mit neuem Build. Erst danach Commit.

## Erfahrungen (2026-11-18)

- **Gebaut und getestet, dann zurückgenommen.** Die Sperrbildschirm-Anbindung plus `shouldPlayInBackground` ließen den Play-Knopf umschalten, aber der Player gab keinen Ton. Zusätzlich hatte `interruptionMode: 'doNotMix'` in Schritt 3 den Start schon einmal scheitern lassen. Beides ist raus.
- **Ursache vermutlich:** Die Berechtigung „Vordergrunddienst“ (FOREGROUND_SERVICE) fehlt im aktuellen Dev-Build. Der Expo-Audio-Plugin trägt sie beim Bauen ein. Das zeigt die Änderung in `app.json` (Berechtigungen), die beim `eas init` dazugekommen ist.
- **Offen in `app.json`:** Der Plugin setzt außerdem `RECORD_AUDIO` (Mikrofon). Das brauchen wir nicht. Die Option `recordAudioAndroid: false` für den Plugin verhindert das.
- **Nächster Schritt:** Preview-Build (siehe Übergabe). Danach Schritt 1 dieses Plans: nur die Hintergrund-Wiedergabe, testen. Dann Schritt 2: Sperrbildschirm.

## Entscheidung (2026-11-18)

- Emir hat **Option A** gewählt: expo-audio, Standard-Mediensteuerung.
- Cover wird als `artworkUrl` mitgegeben. Ob Android die lokale Datei anzeigt, zeigt der Handy-Test.
- Ein neuer Development Build ist nötig, falls die Berechtigung „Vordergrunddienst“ noch fehlt. Das zeigt sich beim Test.

## Ziel

- Das Hörbuch läuft weiter, wenn der Bildschirm aus ist oder du in einer anderen App bist.
- Du steuerst es über den Sperrbildschirm und über die Benachrichtigung oben (wenn du nach unten wischst): Play/Pause, zurück und vor springen, Kapitelname.

## Was gebaut wird

1. **Audio-Modus:** `shouldPlayInBackground: true`. Außerdem `interruptionMode: 'doNotMix'`, weil die Bibliothek für Sperrbildschirm-Steuerung das verlangt.
   - *Achtung:* In Schritt 3 hat `doNotMix` den Start still scheitern lassen, wenn Android den Audio-Fokus verweigert hat. Deshalb muss das auf dem Handy getestet werden.
2. **Sperrbildschirm und Benachrichtigung** über `setActiveForLockScreen` (expo-audio):
   - Titel: aktueller Kapitelname
   - Künstler: Buchtitel
   - Cover, wenn die Bibliothek die lokale Datei annimmt (sonst bleibt es ohne Bild)
   - Play/Pause
   - Vor und zurück: Sprungweite aus den Spulzeiten (15 s oder 30 s zeigen eine Zahl im Symbol; 1 min ohne Zahl)
3. **Kapitelwechsel aktualisieren:** Wenn das Kapitel wechselt, wird der Titel in der Benachrichtigung neu gesetzt.
4. **Plugin-Einstellung:** Die Konfiguration `enableBackgroundPlayback` steht standardmäßig auf `true`. Sie erzeugt die Berechtigung „Vordergrunddienst“ und die iOS-Hintergrundfunktion.

## Was nicht geht (mit expo-audio)

- **Eigene Bedienleiste mit Kapitel-Zeitstrahl und Kapitel-Knöpfen in der Benachrichtigung:** Android erlaubt in der Mediensteuerung nur die Standardelemente. Der Zeitstrahl dort zeigt das **ganze Buch**, nicht das Kapitel.
- **Kapitel-Vor und -Zurück über den Sperrbildschirm:** expo-audio kennt nur „nächster Titel“ und „vorheriger Titel“, aber kein Ereignis, das wir dafür auf Kapitelsprünge umlegen können. Ob das ginge, ist offen.
- **Auf dem Sperrbildschirm:** Der Fortschrittsbalken zeigt ebenfalls das ganze Buch.

## Entscheidung, die ich von dir brauche

**Option A (Empfehlung): expo-audio, Standard-Mediensteuerung.** Titel ist der Kapitelname, Play/Pause und ±-Sprünge funktionieren, wenig Aufwand, keine neue Bibliothek. Der Kapitel-Zeitstrahl bleibt im Player in der App.

**Option B: react-native-track-player.** Dort lassen sich Kapitel-Vor und -Zurück in der Benachrichtigung einbauen. Dafür müssten wir die Wiedergabe ganz umbauen und eine neue native Bibliothek einbinden. Das braucht einen neuen Development Build und mehr Testzeit.

**Empfehlung:** Erst Option A bauen und auf dem Handy testen. Wenn dir die Kapitel-Knöpfe in der Benachrichtigung fehlen, gehen wir danach auf Option B.

## Build und Test

- Ob ein **neuer Development Build** nötig ist, hängt davon ab, ob die Berechtigung „Vordergrunddienst“ schon im bisherigen Build steckt. Das prüfe ich vor dem Bauen. Im Zweifel wird ein neuer Build gebaut (EAS-Warteschlange beachten).
- Node-Tests für die Logik (Sprungweite, Titel aus Kapitel).
- Auf dem Handy: Bildschirm aus, Wiedergabe läuft weiter. Benachrichtigung oben prüfen: Titel, Play/Pause, ±-Sprünge. Sperrbildschirm prüfen. Eine andere App öffnen, dann prüfen. Den Audio-Fokus testen, zum Beispiel mit einem Anruf.

## Nicht in Schritt 4

- Eigene Bedienleiste mit Kapitel-Zeitstrahl in der Benachrichtigung (siehe oben)
- Kacheln mit Fortschrittsbalken (Schritt 5)

## Offene Fragen

- Option A oder B? (Empfehlung: A)
- Soll das Cover in der Benachrichtigung erscheinen, auch wenn die lokale Datei nicht immer klappt?
