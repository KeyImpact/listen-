import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { useOrtStile } from '@/lib/einstellungen-ort-kontext';
import { type Palette } from '@/lib/farben-kontext';
import { usePlayer } from '@/lib/player-kontext';
import { BALKEN_DICKEN } from '@/lib/player-logik';

// Auswahl der Balkendicke. Ein Tipp übernimmt die Dicke und geht zurück.
// Wird im Reiter und im Player (über /player/balken-dicke) gezeigt.
export function BalkenDickeSeite() {
  const router = useRouter();
  const styles = useOrtStile(gibStile);
  const { balkenWahl, setzeBalkenDicke } = usePlayer();

  return (
    <View style={styles.behaelter}>
      <View style={styles.liste}>
        {BALKEN_DICKEN.map((b, i) => {
          const aktiv = b.schluessel === balkenWahl;
          return (
            <Pressable
              key={b.schluessel}
              style={[styles.zeile, i > 0 && styles.zeileTrenner]}
              onPress={() => {
                setzeBalkenDicke(b.schluessel);
                if (router.canGoBack()) router.back();
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: aktiv }}
              accessibilityLabel={`Balkendicke ${b.name}`}
            >
              <View style={styles.vorschauBereich}>
                <View style={[styles.vorschau, { height: b.dicke, borderRadius: b.dicke / 2 }]} />
              </View>
              <Text style={styles.name}>{b.name}</Text>
              <Text style={styles.wert}>{b.dicke} px</Text>
              {aktiv ? <Text style={styles.haken}>✓</Text> : null}
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
    vorschauBereich: {
      width: 90,
    },
    vorschau: {
      width: '100%',
      backgroundColor: f.akzent,
    },
    name: {
      flex: 1,
      color: f.text,
      fontSize: 16,
    },
    wert: {
      color: f.textDezent,
      fontSize: 14,
    },
    haken: {
      color: f.akzent,
      fontSize: 18,
      fontWeight: '700',
    },
  });
}
