import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

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
            {/* Der Player öffnet sich als Fenster von unten. Kopfleiste und Hintergrund kommen aus src/app/player/_layout.tsx. */}
            <Stack.Screen name="player" options={{ presentation: 'modal', headerShown: false }} />
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
            {/* Die Unterseiten für den Reiter „Einstellungen“ (ohne Player). Im Player gibt es eigene Seiten unter /player/. */}
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
              name="player-hintergrund"
              options={{
                headerShown: true,
                title: 'Player-Hintergrund',
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
