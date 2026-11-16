import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';

import { farben } from '@/constants/farben';
import { schemaAnlegen } from '@/lib/datenbank';

// Die Wurzel der App: Stellt die Datenbank bereit und legt die Bildschirme fest.
export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="listen.db" onInit={schemaAnlegen}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: farben.hintergrund },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SQLiteProvider>
  );
}
