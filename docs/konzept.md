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
- **Phase 2:** Danach ein kleiner Freundeskreis (Anzahl offen, siehe Offene Punkte).

### 2. Nutzer & Rollen

- **Version 1:** Ein Nutzer, du. Kein Login nötig.
- **Später:** Freunde bekommen Zugang. Wie das geht (eigene Konten oder ein gemeinsamer Zugang), ist offen.

### 3. Funktionen

**Version 1 (Empfehlung):**

- **Bibliothek:** Alle Hörbücher als Kacheln mit Cover (Thumbnail = kleines Vorschaubild), Titel, Autor und Fortschritt.
- **Navigation in der Bibliothek:** Suche und Sortierung (z. B. nach Titel oder zuletzt gehört).
- **Abspielen:** Play, Pause, Fortschrittsbalken.
- **Spulen:** Ein Stück vor und zurück, mit festen Sprungweiten (Werte offen).
- **Tempo:** Einstellbar, z. B. von 0,5× bis 3×.
- **Kapitel:** Kapitelliste anzeigen, direkt zu einem Kapitel springen, nächstes und vorheriges Kapitel.
- **Position merken:** Die App speichert, wo du aufgehört hast, und setzt beim nächsten Start dort fort.
- **Hintergrund und Sperrbildschirm:** Das Hörbuch läuft weiter, wenn das Handy gesperrt ist. Steuerung über den Sperrbildschirm. Ohne das ist eine App zum Hören kaum brauchbar.

**Später (nicht in Version 1):**

- Lesezeichen mit Notiz
- Schlaf-Timer
- Offline-Download für Freunde
- Zugang für Freunde (Konten, Teilen)
- Hörstatistik

### 4. Bildschirme & Navigation

- **Bibliothek (Startseite):** Kachelraster mit Covers, oben Suche und Sortierung.
- **Buch-Details:** Cover, Infos, Kapitelliste und ein Knopf „Weiter hören“.
- **Player:** Großes Cover, Steuerung, Tempo, aktuelles Kapitel.
- **Mini-Player:** Eine schmale Leiste unten. Sie zeigt das laufende Buch, auch wenn du in der Bibliothek bist.
- **Einstellungen:** Standard-Tempo und Spulzeiten.
- **Navigation:** Untere Leiste mit den Reitern „Bibliothek“ und „Einstellungen“.

### 5. Inhalte & Datenmodell

Die App speichert Daten in Tabellen (ähnlich wie eine Excel-Tabelle). Jede Zeile hat eine eindeutige Nummer, den **Primärschlüssel**. Vorläufige Struktur:

- **Buch:** Nummer, Titel, Autor, Sprecher, Cover (Bild), Gesamtdauer, Speicherort der Datei
- **Kapitel:** Nummer, Buch-Nummer (verweist auf das Buch), Titel, Startzeit, Endzeit
- **Fortschritt:** Buch-Nummer, aktuelle Position in Sekunden, zuletzt gehört am, Tempo

**Dateiformat (Empfehlung):** M4B. Das ist das übliche Format für Hörbücher und enthält die Kapitel gleich mit. MP3 sollte auch gehen, dann müssen Kapitel anders hinterlegt werden.

### 6. Plattformen & Tech-Stack

- **Plattform:** Handy, Android und iOS.
- **Empfehlung:** Expo (React Native), wie bei Mishkat. Eine Codebasis für beide Systeme.
- **Audio:** Die passende Audio-Bibliothek für Kapitel, Hintergrundwiedergabe und Sperrbildschirm prüfe ich vor Schritt 1 in der aktuellen Doku.
- **Daten:** Version 1 nur auf dem Gerät. Ein Server ist nicht nötig.
- **Später:** Supabase (wie bei Mishkat), falls Freunde ein gemeinsames Konto brauchen.

### 7. Design

- **Empfehlung:** Dunkles Design als Standard. Es ist angenehmer beim Hören am Abend.
- **Bedienung:** Große Knöpfe, gut mit einer Hand zu erreichen.
- **Farben und Schrift:** Offen, machen wir zusammen, sobald die Bibliothek steht.

### 8. Kosten & Betrieb

- **Version 1:** Keine laufenden Kosten.
- **Später, für den Store:** Apple kostet rund 99 US-Dollar pro Jahr. Google Play kostet einmalig 25 US-Dollar. Das brauchst du nur, wenn die App über den Store laufen soll.
- **Wichtig:** Hörbücher dürfen nur mit passendem Nutzungsrecht weitergegeben werden. Das ist vor Phase 2 zu klären (siehe Offene Punkte).

### 9. Umsetzungsreihenfolge

1. **Grundgerüst und Bibliothek** mit ein paar Testbüchern (Kacheln, Cover, Suche). Plan folgt.
2. **Player:** Abspielen, Pause, Spulen, Tempo. Plan folgt.
3. **Kapitel:** Kapitelliste und Kapitelsprung. Plan folgt.
4. **Fortschritt merken, Hintergrund, Sperrbildschirm.** Plan folgt.
5. **Feinschliff:** Sortierung, Einstellungen, Design. Plan folgt.
6. **Test auf deinem Handy** im Alltag.
7. **Später:** Freunde-Zugang, Offline-Download und die übrigen Punkte aus „Später“.

## Offene Punkte

1. **Woher kommen die Hörbücher?** Empfehlung für Version 1: Du importierst Dateien, die du auf dem Handy hast. Andere Wege (eigener Server, Dienst) würden wir später prüfen.
> (noch offen)

2. **Dateiformat:** Nur M4B, oder auch MP3? Empfehlung: M4B zuerst, MP3 falls nötig später.
> (noch offen)

3. **Tech-Stack:** Expo (React Native) bestätigen? Empfehlung: ja.
> (noch offen)

4. **Spulzeiten und Tempo:** Vorwärts 30 Sekunden, zurück 10 Sekunden, Tempo von 0,5× bis 3×? Das sind meine Vorschläge. Passt das?
> (noch offen)

5. **Freunde später:** Wie viele Personen ungefähr? Sollen sie eigene Konten mit Login haben, oder reicht ein gemeinsamer Zugang?
> (noch offen)

6. **Weitergabe:** Darfst du die Hörbücher an Freunde weitergeben? Das hängt davon ab, wie du sie bekommen hast (gekauft, geliehen, andere Quelle). Ich bin kein Rechtsberater. Vor Phase 2 solltest du das klären.
> (noch offen)

7. **Design:** Dunkles Design als Standard, oder hell?
> (noch offen)
