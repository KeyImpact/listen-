import { StyleSheet, Text, View } from 'react-native';

import { farben } from '@/constants/farben';

// Platzhalter. Die Einstellungen (Spulzeiten, Tempo-Standard) kommen in Schritt 5.
export default function EinstellungenScreen() {
  return (
    <View style={styles.behaelter}>
      <Text style={styles.text}>Einstellungen folgen in einem späteren Schritt.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  behaelter: {
    flex: 1,
    backgroundColor: farben.hintergrund,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  text: {
    color: farben.textDezent,
    fontSize: 16,
    textAlign: 'center',
  },
});
