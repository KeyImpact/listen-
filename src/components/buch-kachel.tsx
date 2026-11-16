import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { farben } from '@/constants/farben';
import type { BuchZeile } from '@/lib/datenbank';

// Eine Kachel in der Bibliothek: Cover, Titel, Autor und Fortschrittsbalken.
// Der Fortschritt bleibt bis Schritt 4 bei 0 %.
export function BuchKachel({ buch }: { buch: BuchZeile }) {
  return (
    <View style={styles.kachel}>
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
        <View style={styles.fortschrittFuellung} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kachel: {
    flex: 1,
    margin: 8,
  },
  cover: {
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: farben.flaecheHell,
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
    color: farben.textDezent,
    fontSize: 48,
    fontWeight: '700',
  },
  titel: {
    color: farben.text,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  autor: {
    color: farben.textDezent,
    fontSize: 13,
    marginTop: 2,
  },
  fortschrittSpur: {
    height: 3,
    borderRadius: 2,
    backgroundColor: farben.spur,
    marginTop: 8,
    overflow: 'hidden',
  },
  fortschrittFuellung: {
    width: '0%',
    height: '100%',
    backgroundColor: farben.akzent,
  },
});
