import { Tabs } from 'expo-router';

import { farben } from '@/constants/farben';

// Die zwei Reiter unten: Bibliothek und Einstellungen.
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: farben.flaeche },
        headerTintColor: farben.text,
        tabBarStyle: { backgroundColor: farben.flaeche, borderTopColor: farben.spur },
        tabBarActiveTintColor: farben.akzent,
        tabBarInactiveTintColor: farben.textDezent,
        tabBarIcon: () => null, // Nur Text, keine Symbole (die kommen bei Bedarf später).
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Bibliothek' }} />
      <Tabs.Screen name="einstellungen" options={{ title: 'Einstellungen' }} />
    </Tabs>
  );
}
