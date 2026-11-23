import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useFarben } from '@/lib/farben-kontext';

// Rahmen für eine Einstellungs-Seite im Player. Die Kopfleiste des Players bleibt oben stehen.
// Hier steht nur eine Zeile „‹ Zurück“ und der Seitentitel, darunter der Inhalt.
export function PlayerUnterseite({
  titel,
  zurueckText,
  children,
}: {
  titel: string;
  zurueckText: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const f = useFarben();

  return (
    <View style={styles.behaelter}>
      <View style={styles.kopf}>
        <Pressable
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Zurück zu ${zurueckText}`}
          onPress={() => {
            if (router.canGoBack()) router.back();
          }}
        >
          <Text style={[styles.zurueck, { color: f.akzent }]}>‹ {zurueckText}</Text>
        </Pressable>
        <Text style={[styles.titel, { color: f.text }]}>{titel}</Text>
      </View>
      <View style={styles.inhalt}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  behaelter: {
    flex: 1,
  },
  kopf: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 4,
  },
  zurueck: {
    fontSize: 16,
    fontWeight: '600',
  },
  titel: {
    fontSize: 24,
    fontWeight: '700',
  },
  inhalt: {
    flex: 1,
  },
});
