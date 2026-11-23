import { Stack, useRouter } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Pressable, Text, View } from 'react-native';

import { SchlafKopf } from '@/components/schlaf-kopf';
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
                headerBackVisible: false,
                headerTitle: () => <HomeKnopf />,
                headerLeft: () => <KapitelKnopf />,
                headerTitleAlign: 'center',
                headerRight: () => (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
                    <SchlafKopf />
                    <TempoKopf />
                    <ZahnradKnopf />
                  </View>
                ),
              }}
            />
            {/* Die Adresse aus der Benachrichtigung landet hier und leitet zum Player weiter. Keine Fenster-Darstellung. */}
            <Stack.Screen name="+not-found" options={{ presentation: 'card', headerShown: false }} />
            {/* Die Kapitelliste öffnet sich aus dem Player als Fenster von unten. */}
            <Stack.Screen
              name="kapitel"
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Kapitel',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: farben.hintergrund },
                headerTintColor: farben.text,
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
            <Stack.Screen
              name="balken-dicke"
              options={{
                headerShown: true,
                title: 'Balkendicke',
                headerStyle: { backgroundColor: farben.flaeche },
                headerTintColor: farben.text,
              }}
            />
            <Stack.Screen
              name="farben"
              options={{
                headerShown: true,
                title: 'Farben',
                headerStyle: { backgroundColor: farben.flaeche },
                headerTintColor: farben.text,
              }}
            />
            <Stack.Screen
              name="spul-knoepfe"
              options={{
                headerShown: true,
                title: 'Vor- und Zurück-Knöpfe',
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

// Home-Knopf in der Mitte der Player-Kopfleiste. Führt zurück zur Bibliothek (alle Fenster darüber schließen).
function HomeKnopf() {
  const router = useRouter();
  return (
    <Pressable hitSlop={12} accessibilityLabel="Home, zur Bibliothek" onPress={() => router.dismissAll()}>
      <Text style={{ color: farben.text, fontSize: 16, fontWeight: '600' }}>⌂ Home</Text>
    </Pressable>
  );
}

// Listen-Knopf links in der Player-Kopfleiste. Öffnet die Kapitelliste des laufenden Buches.
function KapitelKnopf() {
  const router = useRouter();
  return (
    <Pressable hitSlop={12} accessibilityLabel="Kapitelliste" onPress={() => router.push('/kapitel')}>
      <Text style={{ color: farben.text, fontSize: 22 }}>☰</Text>
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
