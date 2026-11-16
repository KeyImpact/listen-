import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AKZENTE } from '@/constants/farben';
import { useAkzentWahl, useFarben, useStile, type Palette } from '@/lib/farben-kontext';

// Der Inhalt der Einstellungen. Wird im Reiter „Einstellungen“ und auf der Seite über das Zahnrad gezeigt.
// Bisher gibt es nur die Akzentfarbe: Sie färbt Knöpfe, Balken und den aktiven Reiter.
export function EinstellungenInhalt() {
  const f = useFarben();
  const router = useRouter();
  const styles = useStile(gibStile);
  const { akzentSchluessel, setzeAkzent } = useAkzentWahl();

  return (
    <View style={[styles.behaelter, { backgroundColor: f.hintergrund }]}>
      <Text style={styles.abschnitt}>Farben</Text>
      <Text style={styles.hinweis}>Die Akzentfarbe gilt für Knöpfe, Balken und den aktiven Reiter.</Text>

      <View style={styles.liste}>
        {AKZENTE.map((a, i) => {
          const aktiv = a.schluessel === akzentSchluessel;
          return (
            <Pressable
              key={a.schluessel}
              style={[styles.zeile, i > 0 && styles.zeileTrenner]}
              onPress={() => {
                // Die Farbe gilt sofort. Auf der Seite über das Zahnrad geht es danach zurück.
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
      paddingHorizontal: 16,
      paddingTop: 16,
      gap: 8,
    },
    abschnitt: {
      color: f.textDezent,
      fontSize: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginTop: 8,
    },
    hinweis: {
      color: f.textDezent,
      fontSize: 13,
      marginBottom: 4,
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
      paddingVertical: 14,
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
