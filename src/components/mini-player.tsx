import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fortschrittAnteil } from '@/lib/player-logik';
import { usePlayer } from '@/lib/player-kontext';
import { useStile, type Palette } from '@/lib/farben-kontext';

export const MINI_PLAYER_HOEHE = 64;

// Die schmale Leiste über den Reitern: zeigt das laufende Buch. Ein Tipp öffnet den Player.
// Ohne geladenes Buch ist sie unsichtbar.
export function MiniPlayer({ unten }: { unten: number }) {
  const router = useRouter();
  const styles = useStile(gibStile);
  const { buch, spielt, position, dauer, umschalten } = usePlayer();

  if (!buch) return null;

  return (
    <Pressable style={[styles.leiste, { bottom: unten }]} onPress={() => router.push('/player')}>
      <View style={styles.zeile}>
        <Text style={styles.titel} numberOfLines={1}>
          {buch.titel}
        </Text>
        <Pressable
          style={styles.knopf}
          hitSlop={8}
          accessibilityLabel={spielt ? 'Pause' : 'Abspielen'}
          onPress={umschalten}
        >
          <Text style={styles.knopfText}>{spielt ? 'Pause' : 'Weiter'}</Text>
        </Pressable>
      </View>
      <View style={styles.spur}>
        <View style={[styles.fuellung, { width: `${fortschrittAnteil(position, dauer) * 100}%` }]} />
      </View>
    </Pressable>
  );
}

function gibStile(f: Palette) {
  return StyleSheet.create({
    leiste: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: MINI_PLAYER_HOEHE,
      backgroundColor: f.flaecheHell,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: f.spur,
      paddingHorizontal: 16,
      paddingTop: 8,
      justifyContent: 'space-between',
    },
    zeile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    titel: {
      flex: 1,
      color: f.text,
      fontSize: 15,
      fontWeight: '600',
    },
    knopf: {
      backgroundColor: f.akzent,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    knopfText: {
      color: f.akzentText,
      fontSize: 14,
      fontWeight: '600',
    },
    spur: {
      height: 3,
      borderRadius: 2,
      backgroundColor: f.spur,
      overflow: 'hidden',
    },
    fuellung: {
      height: '100%',
      backgroundColor: f.akzent,
    },
  });
}
