import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { BuchZeile } from '@/lib/datenbank';
import { useStile, type Palette } from '@/lib/farben-kontext';

// Eine Kachel in der Bibliothek: Cover, Titel, Autor und Fortschrittsbalken.
// Ein Tipp startet das Buch (der Aufrufer entscheidet, was dann passiert).
// anteil: Wie weit das Buch gehört ist, zwischen 0 und 1.
export function BuchKachel({ buch, anteil, onPress }: { buch: BuchZeile; anteil: number; onPress: () => void }) {
  const styles = useStile(gibStile);
  return (
    <Pressable style={styles.kachel} onPress={onPress}>
      <View style={styles.cover}>
        {buch.cover_pfad ? (
          <Image source={{ uri: buch.cover_pfad }} style={styles.bild} contentFit="cover" />
        ) : (
          <View style={styles.platzhalter}>
            <Text style={styles.platzhalterText}>{buch.titel.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
      <Text style={styles.titel} numberOfLines={2}>
        {buch.titel}
      </Text>
      <Text style={styles.autor} numberOfLines={1}>
        {buch.autor ?? 'Unbekannter Autor'}
      </Text>
      <View style={styles.fortschrittSpur}>
        <View style={[styles.fortschrittFuellung, { width: `${anteil * 100}%` }]} />
      </View>
    </Pressable>
  );
}

function gibStile(f: Palette) {
  return StyleSheet.create({
    kachel: {
      flex: 1,
      margin: 8,
    },
    cover: {
      aspectRatio: 1,
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: f.flaecheHell,
    },
    bild: {
      width: '100%',
      height: '100%',
    },
    platzhalter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    platzhalterText: {
      color: f.textDezent,
      fontSize: 48,
      fontWeight: '700',
    },
    titel: {
      color: f.text,
      fontSize: 15,
      fontWeight: '600',
      marginTop: 8,
    },
    autor: {
      color: f.textDezent,
      fontSize: 13,
      marginTop: 2,
    },
    fortschrittSpur: {
      height: 3,
      borderRadius: 2,
      backgroundColor: f.spur,
      marginTop: 8,
      overflow: 'hidden',
    },
    fortschrittFuellung: {
      height: '100%',
      backgroundColor: f.akzent,
    },
  });
}
