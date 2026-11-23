import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PlayerHintergrund } from '@/components/player-hintergrund';
import { PlayerKopf } from '@/components/player-kopf';
import { useCoverFarben } from '@/lib/cover-thema';
import { EinstellungenOrtKontext } from '@/lib/einstellungen-ort-kontext';
import { useFarben } from '@/lib/farben-kontext';
import { usePlayer } from '@/lib/player-kontext';

// Der gemeinsame Rahmen des Players: Hintergrund und Kopfleiste stehen fest.
// Darunter wechseln nur die Seiten (Player, Einstellungen, Unterseiten). Die Kopfleiste bleibt also stehen.
export default function PlayerRahmen() {
  const f = useFarben();
  const { buch, hintergrund } = usePlayer();
  const coverUri = buch?.cover_pfad ?? null;
  const farben = useCoverFarben(hintergrund === 'off' ? null : coverUri);

  return (
    <EinstellungenOrtKontext.Provider value="player">
      <View style={[styles.behaelter, { backgroundColor: f.hintergrund }]}>
        {/* Der Hintergrund liegt ganz hinten, über den ganzen Bildschirm. */}
        <PlayerHintergrund coverUri={coverUri} farben={farben} />
        <PlayerKopf />
        <View style={styles.seiten}>
          <Stack
            screenOptions={{
              headerShown: false,
              // Transparent, damit der Hintergrund hinter den Seiten sichtbar bleibt.
              contentStyle: { backgroundColor: 'transparent' },
              animation: 'fade',
              animationDuration: 200,
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="einstellungen" />
            <Stack.Screen name="farben" />
            <Stack.Screen name="balken-dicke" />
            <Stack.Screen name="player-hintergrund" />
            <Stack.Screen name="spul-knoepfe" />
          </Stack>
        </View>
      </View>
    </EinstellungenOrtKontext.Provider>
  );
}

const styles = StyleSheet.create({
  behaelter: {
    flex: 1,
  },
  seiten: {
    flex: 1,
  },
});
