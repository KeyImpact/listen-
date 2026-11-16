import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { BuchKachel } from '@/components/buch-kachel';
import { farben } from '@/constants/farben';
import { filtereBuecher, sortiereBuecher, type Sortierung } from '@/lib/bibliothek-logik';
import { holeBuecher, holeEinstellung, setzeEinstellung, type BuchZeile } from '@/lib/datenbank';
import { ordnerEinlesen } from '@/lib/einlesen';
import { waehleOrdner } from '@/lib/ordner';

const ORDNER_SCHLUESSEL = 'ordner_uri';

// Die Startseite: alle Hörbücher als Kacheln, mit Suche und Sortierung.
export default function BibliothekScreen() {
  const db = useSQLiteContext();
  const [buecher, setBuecher] = useState<BuchZeile[]>([]);
  const [ordnerUri, setOrdnerUri] = useState<string | null>(null);
  const [suche, setSuche] = useState('');
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

  const sichtbar = useMemo(
    () => sortiereBuecher(filtereBuecher(buecher, suche), sortierung),
    [buecher, suche, sortierung],
  );

  return (
    <View style={styles.behaelter}>
      <View style={styles.kopf}>
        <TextInput
          style={styles.suche}
          placeholder="Titel oder Autor suchen"
          placeholderTextColor={farben.textDezent}
          value={suche}
          onChangeText={setSuche}
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        <View style={styles.zeileSortierung}>
          <Auswahl
            text="Titel A–Z"
            aktiv={sortierung === 'titel'}
            onPress={() => setSortierung('titel')}
          />
          <Auswahl
            text="Autor A–Z"
            aktiv={sortierung === 'autor'}
            onPress={() => setSortierung('autor')}
          />
        </View>
        {ordnerUri ? (
          <Pressable
            style={[styles.knopf, laeuft && styles.knopfAus]}
            onPress={() => einlesen(ordnerUri)}
            disabled={laeuft}
          >
            <Text style={styles.knopfText}>Ordner neu einlesen</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.knopf} onPress={ordnerWaehlen} disabled={laeuft}>
            <Text style={styles.knopfText}>Hörbuch-Ordner wählen</Text>
          </Pressable>
        )}
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
        renderItem={({ item }) => <BuchKachel buch={item} />}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={<LeerText ordnerGewaehlt={ordnerUri !== null} suche={suche} />}
      />
    </View>
  );
}

function LeerText({ ordnerGewaehlt, suche }: { ordnerGewaehlt: boolean; suche: string }) {
  let text = 'Noch kein Ordner gewählt. Wähle den Ordner, in dem deine Hörbücher (M4B) liegen.';
  if (ordnerGewaehlt && suche.trim().length > 0) {
    text = `Keine Treffer für „${suche.trim()}“.`;
  } else if (ordnerGewaehlt) {
    text = 'Keine Hörbücher gefunden. Lies den Ordner neu ein, oder wähle einen anderen.';
  }
  return <Text style={styles.leer}>{text}</Text>;
}

function Auswahl({ text, aktiv, onPress }: { text: string; aktiv: boolean; onPress: () => void }) {
  return (
    <Pressable style={[styles.auswahl, aktiv && styles.auswahlAktiv]} onPress={onPress}>
      <Text style={[styles.auswahlText, aktiv && styles.auswahlTextAktiv]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  behaelter: {
    flex: 1,
    backgroundColor: farben.hintergrund,
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
  zeileSortierung: {
    flexDirection: 'row',
    gap: 8,
  },
  auswahl: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: farben.flaeche,
  },
  auswahlAktiv: {
    backgroundColor: farben.akzent,
  },
  auswahlText: {
    color: farben.textDezent,
    fontSize: 14,
  },
  auswahlTextAktiv: {
    color: farben.akzentText,
    fontWeight: '600',
  },
  knopf: {
    backgroundColor: farben.flaecheHell,
    borderRadius: 10,
    paddingVertical: 12,
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
  leer: {
    color: farben.textDezent,
    fontSize: 15,
    textAlign: 'center',
    padding: 24,
  },
});
