import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useStile, type Palette } from '@/lib/farben-kontext';
import { holeBuch, holeKapitel, type BuchZeile, type KapitelKurz } from '@/lib/datenbank';
import { usePlayer } from '@/lib/player-kontext';
import { aktuellesKapitel, formatiereZeit, kapitelLaenge } from '@/lib/player-logik';

// Die Buch-Detailseite: Cover, Titel, Autor und alle Kapitel. Ein Tipp auf ein Kapitel startet das Buch dort.
export default function BuchSeite() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const buchId = Number(id);
  const db = useSQLiteContext();
  const router = useRouter();
  const styles = useStile(gibStile);
  const { buch: laufendesBuch, position, oeffneBuch, springeZu } = usePlayer();

  const [buch, setBuch] = useState<BuchZeile | null>(null);
  const [kapitel, setKapitel] = useState<KapitelKurz[]>([]);
  const [geladen, setGeladen] = useState(false);

  useEffect(() => {
    let aktiv = true;
    void (async () => {
      const [b, k] = await Promise.all([holeBuch(db, buchId), holeKapitel(db, buchId)]);
      if (aktiv) {
        setBuch(b);
        setKapitel(k);
        setGeladen(true);
      }
    })();
    return () => {
      aktiv = false;
    };
  }, [db, buchId]);

  if (!geladen) return <Stack.Screen options={{ title: '' }} />;

  if (!buch) {
    return (
      <View style={styles.behaelter}>
        <Stack.Screen options={{ title: 'Buch' }} />
        <Text style={styles.leer}>Dieses Buch gibt es nicht mehr.</Text>
      </View>
    );
  }

  // Ist dieses Buch gerade geladen, markieren wir das laufende Kapitel. Sonst gibt es keine Markierung.
  const istLaufend = laufendesBuch?.id === buch.id;
  const laufendes = istLaufend ? aktuellesKapitel(kapitel, position) : null;

  // Startet das Buch an der Stelle und öffnet den Player.
  const zuKapitel = async (startSek: number) => {
    if (istLaufend) {
      springeZu(startSek);
    } else {
      await oeffneBuch(buch, { position: startSek });
    }
    router.push('/player');
  };

  // „Abspielen“ nimmt das Buch an der gemerkten Stelle wieder auf.
  const abspielen = async () => {
    if (!istLaufend) await oeffneBuch(buch);
    router.push('/player');
  };

  return (
    <View style={styles.behaelter}>
      <Stack.Screen options={{ title: buch.titel }} />
      <FlatList
        data={kapitel}
        keyExtractor={(k) => String(k.start_sek)}
        contentContainerStyle={styles.liste}
        ListHeaderComponent={
          <View style={styles.kopf}>
            <View style={styles.cover}>
              {buch.cover_pfad ? (
                <Image source={{ uri: buch.cover_pfad }} style={styles.bild} contentFit="cover" />
              ) : (
                <Text style={styles.platzhalterText}>{buch.titel.charAt(0).toUpperCase()}</Text>
              )}
            </View>
            <Text style={styles.titel}>{buch.titel}</Text>
            <Text style={styles.autor}>{buch.autor ?? 'Unbekannter Autor'}</Text>
            {buch.sprecher ? <Text style={styles.autor}>Gelesen von {buch.sprecher}</Text> : null}
            {buch.dauer_sek ? <Text style={styles.autor}>Länge {formatiereZeit(buch.dauer_sek)}</Text> : null}
            <Pressable style={styles.abspielKnopf} onPress={abspielen}>
              <Text style={styles.abspielText}>Abspielen</Text>
            </Pressable>
            {kapitel.length > 0 ? <Text style={styles.abschnitt}>Kapitel</Text> : null}
          </View>
        }
        ListEmptyComponent={<Text style={styles.leer}>Dieses Buch hat keine Kapitel.</Text>}
        renderItem={({ item, index }) => {
          const ist = laufendes === item;
          return (
            <Pressable
              style={[styles.zeile, ist && styles.zeileLaufend]}
              onPress={() => zuKapitel(item.start_sek)}
              accessibilityLabel={`Kapitel ${index + 1}: ${item.titel}`}
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
      paddingBottom: 32,
    },
    kopf: {
      alignItems: 'center',
      gap: 6,
      paddingTop: 16,
      paddingBottom: 8,
    },
    cover: {
      width: 180,
      aspectRatio: 1,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: f.flaecheHell,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    bild: {
      width: '100%',
      height: '100%',
    },
    platzhalterText: {
      color: f.textDezent,
      fontSize: 64,
      fontWeight: '700',
    },
    titel: {
      color: f.text,
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
    },
    autor: {
      color: f.textDezent,
      fontSize: 14,
      textAlign: 'center',
    },
    abspielKnopf: {
      marginTop: 10,
      height: 52,
      paddingHorizontal: 40,
      borderRadius: 26,
      backgroundColor: f.akzent,
      justifyContent: 'center',
    },
    abspielText: {
      color: f.akzentText,
      fontSize: 16,
      fontWeight: '700',
    },
    abschnitt: {
      alignSelf: 'flex-start',
      color: f.textDezent,
      fontSize: 13,
      fontWeight: '600',
      marginTop: 18,
      marginBottom: 4,
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
