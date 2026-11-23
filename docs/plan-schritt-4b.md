# Plan Schritt 4b: Wechsel auf react-native-track-player

Stand: 2026-11-21 · **Status: Freigegeben, Umbau umgesetzt (Schritte A bis E zusammen, siehe unten). Noch nicht auf dem Handy getestet.**

## Umsetzung (2026-11-21)

- **Abweichung vom Plan:** Schritt A (Spike) und B wurden zusammen umgesetzt. Ein Spike ohne Wiedergabe hätte uns keine Aussage gegeben, und der Build dauert ohnehin lange. Die Abbruch-Regel bleibt: Scheitert der Build oder die Wiedergabe, gehen wir zurück.
- `expo-audio` entfernt, `react-native-track-player` 4.1.2 installiert.
- `index.js` (neuer Einstieg, `main` in `package.json`) registriert den Wiedergabe-Dienst vor der App.
- `src/lib/wiedergabe-dienst.ts`: Knöpfe von Sperrbildschirm und Benachrichtigung (Play, Pause, Stopp, Vor/Zurück um die Spulzeit).
- `src/lib/player-kontext.tsx` neu geschrieben, Schnittstelle unverändert.
- `expo-dev-client` wieder in `package.json` (war nur zufällig im Ordner, `npm install` hat es entfernt).
- Debug-Ausgaben und Schalter entfernt.
- **Build-Ergebnis (2026-11-21, Build 94ba4136-251e-402f-9871-be87ce9f531e): fehlgeschlagen.** Grund: `react-native-track-player` 4.1.2 passt nicht zu React Native 0.88. In `MusicModule.kt` (Zeilen 548 und 588) gibt `Arguments.fromBundle` einen möglicherweise leeren Wert (`Bundle?`) zurück, RN 0.88 erwartet aber ein `Bundle`. Abbruch-Regel greift: Wir entscheiden neu, bevor wir weiterbauen.
- Neueste Version: 4.1.2 (stabil). Die Vorab-Version 5.0.0-alpha ist nur ein Nightly-Build.
- **Korrektur (Emir hat Option „Patch“ gewählt):** `patches/react-native-track-player+4.1.2.patch` (mit `patch-package`, läuft bei `npm install` über `postinstall`). Der Patch macht die zwei Stellen in `MusicModule.kt` null-sicher (`originalItem?.let { Arguments.fromBundle(it) }`). Build dazu gestartet: d4cbf941-e85f-4b24-b76c-b798106d930c (Stand 2026-11-21, Ergebnis offen).

## Warum der Wechsel

Auf dem Handy hat sich mit expo-audio gezeigt:

- Jeder Aufruf von `setAudioModeAsync` blockiert das Abspielen (getestet mit `doNotMix`, `mixWithOthers` und `shouldPlayInBackground`). Ohne den Aufruf läuft es.
- Ohne Audio-Modus stoppt die Wiedergabe bei gesperrtem Bildschirm.
- Auf Android belegt expo-audio die Vor- und Zurück-Knöpfe der Benachrichtigung mit „nächster“ und „voriger Titel“. Dadurch schließt sich die Benachrichtigung beim Vorspulen.

Der Plan aus Schritt 4 nennt diesen Fall als Plan B: `react-native-track-player`.

## Was ich vorher geprüft habe

- **Version:** Stabil ist `4.1.2` (August 2025). Eine Version 5 gibt es bisher nur als Test-Build, nicht als stabile Version.
- **Expo-Plugin:** `4.1.2` hat kein Expo-Config-Plugin. Der Dienst für die Wiedergabe muss von Hand eingerichtet werden.
- **Offen:** Ob `4.1.2` mit React Native 0.88 und der neuen Architektur läuft. Das lässt sich nur mit einem echten Build prüfen. Deshalb beginnt der Plan mit einem kleinen Test.

## Schritte

### Schritt A: Test-Build (Spike)

Ziel: Nur prüfen, ob ein Build mit der Bibliothek funktioniert und Musik spielt. Kein Umbau der App.

1. Paket installieren: `react-native-track-player@4.1.2`.
2. Wiedergabe-Dienst registrieren (Einstieg der App, siehe Schritt D).
3. Android-Berechtigungen prüfen (Vordergrunddienst für Medien).
4. Einen Development Build bauen.
5. Auf dem Handy prüfen: Ton kommt, Bildschirm aus läuft weiter, Benachrichtigung zeigt Titel und Knöpfe.

**Abbruch-Regel:** Baut die App nicht oder läuft die Bibliothek nicht, stoppen wir und entscheiden neu (zum Beispiel: Hintergrund streichen oder eine andere Bibliothek suchen). Dann bleibt der bestehende Player unverändert.

### Schritt B: Player umbauen

- `src/lib/player-kontext.tsx`: Die Wiedergabe läuft über `react-native-track-player` statt expo-audio. Die Schnittstelle nach außen bleibt gleich (`umschalten`, `spulen`, `springeZu`, `tempoAendern` usw.), damit die Oberfläche unverändert bleibt.
- Das Speichern der Stelle, das gemerkte Buch und das Tempo bleiben wie sie sind.
- Die reine Logik in `src/lib/player-logik.ts` bleibt unverändert und ist schon getestet.

### Schritt C: Benachrichtigung und Sperrbildschirm

- Titel = Kapitelname, Künstler = Buchtitel, Cover (lokale Datei).
- Knöpfe: Play/Pause, Vor und Zurück mit der eingestellten Spulzeit (15 s, 30 s oder 1 min).
- Kapitelsprung in der Benachrichtigung: **Offen.** Ob sich dafür eigene Knöpfe einrichten lassen, prüfen wir im Test-Build. Ohne sie springt man in der App über die Kapitel-Knöpfe.

### Schritt D: Einstieg der App

- Der Wiedergabe-Dienst wird vor der App registriert. Das ist bei expo-router ein eigener Einstiegspunkt, der den Dienst registriert und dann die App startet. Das ist der aufwendigste Teil der Umstellung. Ich prüfe die genaue Einrichtung im Spike.

### Schritt E: Tests

- Node-Tests bleiben für die reine Logik.
- Auf dem Handy: Die Liste aus Schritt 4 (Bildschirm aus, andere App, Benachrichtigung, Anruf, Vor und Zurück in der Benachrichtigung).

## Builds

- Schritt A braucht einen Development Build. Schritt B und C brauchen voraussichtlich einen weiteren.
- Der Gratistarif erlaubt 15 Android-Builds. Wir zählen mit und sagen dir vor jedem Build Bescheid.

## Bekannte Grenzen

- **Verzögerung beim Start:** Beim ersten Öffnen eines Buches lädt der Player die große Datei. Das bleibt auch mit einer anderen Bibliothek ein Thema. Mit dem Umbau versuchen wir, die Stelle schon beim Öffnen vorzuladen. Ob das reicht, zeigt der Test.
- **Kapitel-Knöpfe in der Benachrichtigung:** Siehe Schritt C.

## Offene Fragen

1. Soll der Spike jetzt gebaut werden? (Empfehlung: ja, der kleinste Schritt mit der größten Klarheit.)
2. Kapitel-Knöpfe in der Benachrichtigung: Reicht Vor und Zurück mit der Spulzeit, wenn Kapitel-Springen nur in der App geht? (Empfehlung: ja.)
