import { Stack, useRouter } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';

import { TempoKopf } from '@/components/tempo-kopf';
import { farben } from '@/constants/farben';
import { schemaAnlegen } from '@/lib/datenbank';
import { FarbenProvider } from '@/lib/farben-kontext';
import { PlayerProvider } from '@/lib/player-kontext';

// Die Wurzel der App: Stellt Datenbank, Farben und Player bereit und legt die Bildschirme fest.
export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="listen.db" onInit={schemaAnlegen}>
      <FarbenProvider>
        <PlayerProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: farben.hintergrund },
            }}
          >
            <Stack.Screen name="(tabs)" />
            {/* Der Player öffnet sich als Fenster von unten. Die Kopfleiste hat Zurück links und das Zahnrad rechts. */}
            <Stack.Screen
              name="player"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: '',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: farben.hintergrund },
                headerTintColor: farben.text,
                headerLeft: () => <ZurueckKnopf />,
                headerRight: () => (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                    <TempoKopf />
                    <ZahnradKnopf />
                  </View>
                ),
              }}
            />
            <Stack.Screen
              name="einstellungen-seite"
              options={{
                headerShown: true,
                title: 'Einstellungen',
                headerStyle: { backgroundColor: farben.flaeche },
                headerTintColor: farben.text,
              }}
            />
          </Stack>
        </PlayerProvider>
      </FarbenProvider>
    </SQLiteProvider>
  );
}

// Zurück-Knopf links in der Player-Kopfleiste.
function ZurueckKnopf() {
  const router = useRouter();
  return (
    <Pressable hitSlop={12} accessibilityLabel="Zurück" onPress={() => router.back()}>
      <Text style={{ color: farben.text, fontSize: 16, fontWeight: '600' }}>Zurück</Text>
    </Pressable>
  );
}

// Zahnrad rechts in der Player-Kopfleiste. Öffnet die Einstellungen.
function ZahnradKnopf() {
  const router = useRouter();
  return (
    <Pressable
      hitSlop={12}
      accessibilityLabel="Einstellungen"
      onPress={() => router.push('/einstellungen-seite')}
    >
      <Text style={{ color: farben.text, fontSize: 22 }}>⚙</Text>
    </Pressable>
  );
}
