import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { useStile, type Palette } from '@/lib/farben-kontext';
import { holeKapitel, type KapitelKurz } from '@/lib/datenbank';
import { usePlayer } from '@/lib/player-kontext';
import { aktuellesKapitel, formatiereZeit, kapitelLaenge } from '@/lib/player-logik';

// Die Kapitelliste des laufenden Buches. Sie öffnet sich aus dem Player (Listen-Knopf oben links).
// Ein Tipp springt an den Kapitelanfang und schließt die Liste.
export default function KapitelSeite() {
  const db = useSQLiteContext();
  const router = useRouter();
  const styles = useStile(gibStile);
  const { buch, position, springeZu } = usePlayer();
  const [kapitel, setKapitel] = useState<KapitelKurz[]>([]);

  useEffect(() => {
    if (!buch) return;
    let aktiv = true;
    void holeKapitel(db, buch.id).then((liste) => {
      if (aktiv) setKapitel(liste);
    });
    return () => {
      aktiv = false;
    };
  }, [db, buch]);

  if (!buch) {
    return <Text style={styles.leer}>Noch kein Buch gewählt.</Text>;
  }

  // Das Kapitel, in dem gerade gehört wird, wird markiert.
  const laufendes = aktuellesKapitel(kapitel, position);

  return (
    <View style={styles.behaelter}>
      <FlatList
        data={kapitel}
        keyExtractor={(k) => String(k.start_sek)}
        contentContainerStyle={styles.liste}
        ListEmptyComponent={<Text style={styles.leer}>Dieses Buch hat keine Kapitel.</Text>}
        renderItem={({ item, index }) => {
          const ist = laufendes === item;
          return (
            <Pressable
              style={[styles.zeile, ist && styles.zeileLaufend]}
              accessibilityLabel={`Kapitel ${index + 1}: ${item.titel}`}
              onPress={() => {
                springeZu(item.start_sek);
                router.back();
              }}
            >
              <Text style={styles.nummer}>{index + 1}</Text>
              <View style={styles.zeileText}>
                <Text style={[styles.kapitelTitel, ist && styles.kapitelTitelLaufend]} numberOfLines={2}>
                  {item.titel}
                </Text>
                <Text style={styles.zeitText}>
                  {formatiereZeit(item.start_sek)} · {formatiereZeit(kapitelLaenge(item))}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function gibStile(f: Palette) {
  return StyleSheet.create({
    behaelter: {
      flex: 1,
      backgroundColor: f.hintergrund,
    },
    liste: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingBottom: 32,
    },
    zeile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 10,
    },
    zeileLaufend: {
      backgroundColor: f.flaecheHell,
    },
    nummer: {
      color: f.textDezent,
      fontSize: 14,
      width: 24,
      textAlign: 'center',
    },
    zeileText: {
      flex: 1,
      gap: 2,
    },
    kapitelTitel: {
      color: f.text,
      fontSize: 15,
      fontWeight: '600',
    },
    kapitelTitelLaufend: {
      color: f.akzent,
    },
    zeitText: {
      color: f.textDezent,
      fontSize: 12,
    },
    leer: {
      color: f.textDezent,
      fontSize: 15,
      textAlign: 'center',
      marginTop: 32,
    },
  });
}
