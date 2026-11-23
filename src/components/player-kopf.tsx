import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SchlafKopf } from '@/components/schlaf-kopf';
import { TempoKopf } from '@/components/tempo-kopf';
import { useFarben } from '@/lib/farben-kontext';

// Die feste Kopfleiste des Players. Sie bleibt auch stehen, wenn man in die Einstellungen geht.
// Links: Kapitelliste. Mitte: Home. Rechts: Schlaf-Timer, Tempo und Zahnrad.
export function PlayerKopf() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.leiste, { paddingTop: insets.top + 6 }]}>
      <View style={styles.seite}>
        <KapitelKnopf />
      </View>
      <HomeKnopf />
      <View style={[styles.seite, styles.rechts]}>
        <SchlafKopf />
        <TempoKopf />
        <ZahnradKnopf />
      </View>
    </View>
  );
}

// Home-Knopf in der Mitte. Schließt den Player und geht zurück zur Bibliothek.
function HomeKnopf() {
  const router = useRouter();
  const f = useFarben();
  return (
    <Pressable
      hitSlop={12}
      accessibilityLabel="Home, zur Bibliothek"
      // dismissAll schließt Unterseiten und Player in einem Schritt und geht zur Bibliothek.
      onPress={() => router.dismissAll()}
    >
      <Text style={{ color: f.text, fontSize: 16, fontWeight: '600' }}>⌂ Home</Text>
    </Pressable>
  );
}

// Listen-Knopf links. Öffnet die Kapitelliste des laufenden Buches.
function KapitelKnopf() {
  const router = useRouter();
  const f = useFarben();
  return (
    <Pressable hitSlop={12} accessibilityLabel="Kapitelliste" onPress={() => router.push('/kapitel')}>
      <Text style={{ color: f.text, fontSize: 22 }}>☰</Text>
    </Pressable>
  );
}

// Zahnrad rechts. Im Player öffnet es die Einstellungen. Auf einer Einstellungs-Seite führt es zurück zum Player.
function ZahnradKnopf() {
  const router = useRouter();
  const segmente = useSegments();
  const f = useFarben();
  // Auf dem Player selbst ist nur der Name „player“ im Pfad. Auf Unterseiten kommt mehr dazu.
  const aufUnterseite = segmente.length > 1;
  return (
    <Pressable
      hitSlop={12}
      accessibilityLabel={aufUnterseite ? 'Zurück zum Player' : 'Einstellungen'}
      onPress={() => {
        if (aufUnterseite) router.dismissAll();
        else router.push('/player/einstellungen');
      }}
    >
      <Text style={{ color: aufUnterseite ? f.akzent : f.text, fontSize: 22 }}>⚙</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  leiste: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  seite: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rechts: {
    justifyContent: 'flex-end',
    gap: 18,
  },
});
