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
- **Spulen:** 15 Sekunden vor und 15 Sekunden zurück.
- **Tempo:** Von 0,5× bis 3×, in Schritten von 0,5 (also 0,5 / 1 / 1,5 / 2 / 2,5 / 3).
- **Kapitel:** Kapitelliste anzeigen, direkt zu einem Kapitel springen, nächstes und vorheriges Kapitel.
- **Position merken:** Die App speichert, wo du aufgehört hast, und setzt beim nächsten Start dort fort.
- **Hintergrund und Sperrbildschirm:** Das Hörbuch läuft weiter, wenn das Handy gesperrt ist. Steuerung über den Sperrbildschirm.

**Später (nicht in Version 1):**

- Lesezeichen mit Notiz
- Schlaf-Timer
- Hörstatistik
- Verteilung an Freunde (z. B. über einen Store, Art noch offen)

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

1. **Grundgerüst und Bibliothek** mit ein paar Testbüchern (Kacheln, Cover, Suche). Plan folgt.
2. **Player:** Abspielen, Pause, Spulen, Tempo. Plan folgt.
3. **Kapitel:** Kapitelliste und Kapitelsprung. Plan folgt.
4. **Fortschritt merken, Hintergrund, Sperrbildschirm.** Plan folgt.
5. **Feinschliff:** Sortierung, Einstellungen, Design. Plan folgt.
6. **Test auf deinem Handy** im Alltag.
7. **Später:** Verteilung an Freunde, Lesezeichen, Schlaf-Timer, Statistik.

## Offene Punkte

1. ~~Welches Handy hast du?~~ **Beantwortet:** Android 16. Zuerst testen wir nur auf Android, iOS bleibt im Konzept.

2. ~~Woher kommen die Hörbücher?~~ **Beantwortet:** Aus einem lokalen Ordner auf dem Smartphone (siehe Abschnitt 5).

3. ~~Dateiformat~~ **Beantwortet:** Nur M4B.

4. ~~Tech-Stack~~ **Beantwortet:** Expo (React Native) ist bestätigt.

5. ~~Spulzeiten und Tempo~~ **Beantwortet:** 15 Sekunden vor und zurück. Tempo von 0,5× bis 3× in 0,5er-Schritten.

6. ~~Freunde später: Anzahl und Konten~~ **Beantwortet:** Kein Konto nötig. Jeder nutzt die App mit seinen eigenen Dateien.

7. ~~Weitergabe der Bücher~~ **Nicht relevant für die App**, die App gibt keine Bücher weiter.

8. ~~Design~~ **Beantwortet:** Dunkles Design.
