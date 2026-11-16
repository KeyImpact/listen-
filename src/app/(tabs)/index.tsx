import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { BuchKachel } from '@/components/buch-kachel';
import { MINI_PLAYER_HOEHE } from '@/components/mini-player';
import { farben } from '@/constants/farben';
import { filtereBuecher, sortiereBuecher, type Sortierung } from '@/lib/bibliothek-logik';
import { holeBuecher, holeEinstellung, setzeEinstellung, type BuchZeile } from '@/lib/datenbank';
import { ordnerEinlesen } from '@/lib/einlesen';
import { waehleOrdner } from '@/lib/ordner';
import { useFarben } from '@/lib/farben-kontext';
import { usePlayer } from '@/lib/player-kontext';

const ORDNER_SCHLUESSEL = 'ordner_uri';

// Die Startseite: alle Hörbücher als Kacheln, mit Suche und Sortierung.
// Die Suche ist standardmäßig eingeklappt. Geöffnet wird sie über den Knopf „Suche“ oben rechts.
export default function BibliothekScreen() {
  const db = useSQLiteContext();
  const { oeffneBuch, buch: laufendesBuch } = usePlayer();
  const f = useFarben();
  const router = useRouter();
  const [buecher, setBuecher] = useState<BuchZeile[]>([]);
  const [ordnerUri, setOrdnerUri] = useState<string | null>(null);
  const [suche, setSuche] = useState('');
  const [sucheOffen, setSucheOffen] = useState(false);
  const [sortierung, setSortierung] = useState<Sortierung>('titel');
  const [laeuft, setLaeuft] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [fehlerListe, setFehlerListe] = useState<string[]>([]);

  const laden = useCallback(async () => {
    setBuecher(await holeBuecher(db));
    setOrdnerUri(await holeEinstellung(db, ORDNER_SCHLUESSEL));
  }, [db]);

  // Beim ersten Anzeigen laden. "aktiv" verhindert Updates, wenn der Bildschirm schon weg ist.
  useEffect(() => {
    let aktiv = true;
    (async () => {
      const zeilen = await holeBuecher(db);
      const uri = await holeEinstellung(db, ORDNER_SCHLUESSEL);
      if (aktiv) {
        setBuecher(zeilen);
        setOrdnerUri(uri);
      }
    })();
    return () => {
      aktiv = false;
    };
  }, [db]);

  const einlesen = useCallback(
    async (uri: string) => {
      setLaeuft(true);
      setFehlerListe([]);
      setMeldung('Suche nach Hörbüchern …');
      try {
        const ergebnis = await ordnerEinlesen(db, uri, (verarbeitet, gesamt) => {
          setMeldung(`Lese Bücher: ${verarbeitet} von ${gesamt}`);
        });
        const gesamt = ergebnis.neu + ergebnis.bereitsBekannt + ergebnis.fehler.length;
        if (gesamt === 0) {
          setMeldung('Keine .m4b-Dateien in diesem Ordner gefunden.');
        } else if (ergebnis.neu === 0) {
          setMeldung(`Keine neuen Bücher. ${ergebnis.bereitsBekannt} sind schon in der Bibliothek.`);
        } else {
          setMeldung(`${ergebnis.neu} neue Bücher hinzugefügt.`);
        }
        setFehlerListe(ergebnis.fehler);
        await laden();
      } catch (fehler) {
        const grund = fehler instanceof Error ? fehler.message : 'unbekannter Fehler';
        setMeldung(`Einlesen fehlgeschlagen: ${grund}`);
      } finally {
        setLaeuft(false);
      }
    },
    [db, laden],
  );

  const ordnerWaehlen = async () => {
    const uri = await waehleOrdner();
    if (!uri) return; // Abgebrochen.
    await setzeEinstellung(db, ORDNER_SCHLUESSEL, uri);
    setOrdnerUri(uri);
    await einlesen(uri);
  };

  // Die Knöpfe oben rechts stehen in der Kopfleiste des Reiters, nicht im Bildschirm.
  // Deshalb setzen wir die Optionen des Reiters neu, sobald sich etwas ändert, das die Knöpfe braucht.
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.kopfKnoepfe}>
          {buecher.length > 0 ? (
            <Pressable
              style={styles.kopfKnopf}
              hitSlop={8}
              accessibilityLabel="Sortierung wählen"
              onPress={() =>
                Alert.alert('Sortieren nach', undefined, [
                  { text: 'Titel A–Z', onPress: () => setSortierung('titel') },
                  { text: 'Autor A–Z', onPress: () => setSortierung('autor') },
                  { text: 'Abbrechen', style: 'cancel' },
                ])
              }
            >
              <Text style={styles.kopfKnopfText}>Sortieren</Text>
            </Pressable>
          ) : null}
          {buecher.length > 0 ? (
            <Pressable
              style={styles.kopfKnopf}
              hitSlop={8}
              accessibilityLabel={sucheOffen ? 'Suche schließen' : 'Suche öffnen'}
              onPress={() => {
                if (sucheOffen) setSuche(''); // Beim Schließen die Suche leeren, sonst bleibt der Filter aktiv.
                setSucheOffen(!sucheOffen);
              }}
            >
              <Text style={[styles.kopfKnopfText, { color: f.akzent }]}>{sucheOffen ? 'Schließen' : 'Suche'}</Text>
            </Pressable>
          ) : null}
          {ordnerUri ? (
            <Pressable
              style={styles.kopfKnopf}
              hitSlop={8}
              accessibilityLabel="Ordner neu einlesen"
              disabled={laeuft}
              onPress={() => einlesen(ordnerUri)}
            >
              <Text style={[styles.kopfKnopfText, { color: f.akzent }, laeuft && styles.knopfAus]}>Neu einlesen</Text>
            </Pressable>
          ) : null}
        </View>
      ),
    });
  }, [navigation, buecher.length, sucheOffen, ordnerUri, laeuft, einlesen, f.akzent]);

  const sichtbar = useMemo(
    () => sortiereBuecher(filtereBuecher(buecher, suche), sortierung),
    [buecher, suche, sortierung],
  );

  return (
    <View style={styles.behaelter}>
      <View style={styles.kopf}>
        {sucheOffen ? (
          <TextInput
            style={styles.suche}
            placeholder="Titel oder Autor suchen"
            placeholderTextColor={farben.textDezent}
            value={suche}
            onChangeText={setSuche}
            autoCorrect={false}
            autoFocus
            clearButtonMode="while-editing"
          />
        ) : null}
        {meldung ? <Text style={styles.meldung}>{meldung}</Text> : null}
        {fehlerListe.length > 0 ? (
          <Text style={styles.fehler}>
            {fehlerListe.length} Datei(en) nicht lesbar: {fehlerListe.slice(0, 3).join(', ')}
            {fehlerListe.length > 3 ? ' …' : ''}
          </Text>
        ) : null}
      </View>

      <FlatList
        data={sichtbar}
        keyExtractor={(buch) => String(buch.id)}
        numColumns={2}
        renderItem={({ item }) => (
          <BuchKachel
            buch={item}
            onPress={() => {
              // Tippen startet das Buch und öffnet den Player.
              oeffneBuch(item).then(() => router.push('/player'));
            }}
          />
        )}
        contentContainerStyle={[styles.liste, laufendesBuch ? styles.listeMitMiniPlayer : null]}
        ListEmptyComponent={
          <LeerText
            ordnerGewaehlt={ordnerUri !== null}
            suche={suche}
            laeuft={laeuft}
            onWaehlen={ordnerWaehlen}
          />
        }
      />
    </View>
  );
}

// Was steht im leeren Bildschirm? Ohne Ordner gibt es hier den Knopf zum Ordner wählen.
function LeerText({
  ordnerGewaehlt,
  suche,
  laeuft,
  onWaehlen,
}: {
  ordnerGewaehlt: boolean;
  suche: string;
  laeuft: boolean;
  onWaehlen: () => void;
}) {
  if (!ordnerGewaehlt) {
    return (
      <View style={styles.leerBehaelter}>
        <Text style={styles.leer}>
          Noch kein Ordner gewählt. Wähle den Ordner, in dem deine Hörbücher (M4B) liegen.
        </Text>
        <Pressable style={styles.knopf} onPress={onWaehlen} disabled={laeuft}>
          <Text style={styles.knopfText}>Hörbuch-Ordner wählen</Text>
        </Pressable>
      </View>
    );
  }
  if (suche.trim().length > 0) {
    return <Text style={styles.leer}>{`Keine Treffer für „${suche.trim()}“.`}</Text>;
  }
  return (
    <Text style={styles.leer}>
      Keine Hörbücher gefunden. Lies den Ordner neu ein (oben rechts), oder wähle einen anderen.
    </Text>
  );
}

const styles = StyleSheet.create({
  behaelter: {
    flex: 1,
    backgroundColor: farben.hintergrund,
  },
  kopfKnoepfe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  kopfKnopf: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  kopfKnopfText: {
    color: farben.akzent,
    fontSize: 15,
    fontWeight: '600',
  },
  kopf: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
  },
  suche: {
    backgroundColor: farben.flaeche,
    color: farben.text,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  knopf: {
    backgroundColor: farben.flaecheHell,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  knopfAus: {
    opacity: 0.5,
  },
  knopfText: {
    color: farben.text,
    fontSize: 15,
    fontWeight: '600',
  },
  meldung: {
    color: farben.textDezent,
    fontSize: 13,
  },
  fehler: {
    color: farben.fehler,
    fontSize: 13,
  },
  liste: {
    paddingHorizontal: 8,
    paddingBottom: 24,
  },
  leerBehaelter: {
    alignItems: 'center',
    gap: 16,
    padding: 24,
  },
  // Platz unten, damit der Mini-Player die letzte Zeile nicht verdeckt.
  listeMitMiniPlayer: {
    paddingBottom: MINI_PLAYER_HOEHE + 24,
  },
  leer: {
    color: farben.textDezent,
    fontSize: 15,
    textAlign: 'center',
    padding: 24,
  },
});
