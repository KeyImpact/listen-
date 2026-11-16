import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/mini-player';
import { useFarben } from '@/lib/farben-kontext';

// Höhe der unteren Reiter-Leiste ohne Geräte-Leiste. Der Mini-Player sitzt genau darüber.
const TAB_HOEHE = 56;

// Die zwei Reiter unten: Bibliothek und Einstellungen. Darüber schwebt der Mini-Player.
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const f = useFarben();
  const leisteGesamt = TAB_HOEHE + insets.bottom;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: f.flaeche },
          headerTintColor: f.text,
          tabBarStyle: {
            backgroundColor: f.flaeche,
            borderTopColor: f.spur,
            height: leisteGesamt,
          },
          tabBarActiveTintColor: f.akzent,
          tabBarInactiveTintColor: f.textDezent,
          tabBarIcon: () => null, // Nur Text, keine Symbole (die kommen bei Bedarf später).
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Bibliothek' }} />
        <Tabs.Screen name="einstellungen" options={{ title: 'Einstellungen' }} />
      </Tabs>
      <MiniPlayer unten={leisteGesamt} />
    </View>
  );
}
