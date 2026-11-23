import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AKZENTE } from '@/constants/farben';
import { useAkzentWahl, useStile, type Palette } from '@/lib/farben-kontext';

// Auswahl der Akzentfarbe. Ein Tipp übernimmt die Farbe und geht zurück.
export default function FarbenSeite() {
  const router = useRouter();
  const styles = useStile(gibStile);
  const { akzentSchluessel, setzeAkzent } = useAkzentWahl();

  return (
    <View style={styles.behaelter}>
      <View style={styles.liste}>
        {AKZENTE.map((a, i) => {
          const aktiv = a.schluessel === akzentSchluessel;
          return (
            <Pressable
              key={a.schluessel}
              style={[styles.zeile, i > 0 && styles.zeileTrenner]}
              onPress={() => {
                setzeAkzent(a.schluessel);
                if (router.canGoBack()) router.back();
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: aktiv }}
              accessibilityLabel={`Akzentfarbe ${a.name}`}
            >
              <View style={[styles.punkt, { backgroundColor: a.akzent }]} />
              <Text style={styles.name}>{a.name}</Text>
              {aktiv ? <Text style={[styles.haken, { color: a.akzent }]}>✓</Text> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function gibStile(f: Palette) {
  return StyleSheet.create({
    behaelter: {
      flex: 1,
      backgroundColor: f.hintergrund,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    liste: {
      backgroundColor: f.flaeche,
      borderRadius: 12,
      overflow: 'hidden',
    },
    zeile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    zeileTrenner: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: f.spur,
    },
    punkt: {
      width: 22,
      height: 22,
      borderRadius: 11,
    },
    name: {
      flex: 1,
      color: f.text,
      fontSize: 16,
    },
    haken: {
      fontSize: 18,
      fontWeight: '700',
    },
  });
}
