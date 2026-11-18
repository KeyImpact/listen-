import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AKZENTE } from '@/constants/farben';
import { useAkzentWahl, useFarben, useStile, type Palette } from '@/lib/farben-kontext';
import { usePlayer, type SpulRichtung } from '@/lib/player-kontext';
import { SPRUNG_OPTIONEN_SEK, formatiereSpulzeit } from '@/lib/player-logik';

const SPUL_ZEILEN: { schluessel: SpulRichtung; name: string }[] = [
  { schluessel: 'zurueck', name: '−' },
  { schluessel: 'vor', name: '+' },
];

// Der Inhalt der Einstellungen. Wird im Reiter „Einstellungen“ und auf der Seite über das Zahnrad gezeigt.
// Bisher gibt es nur die Akzentfarbe: Sie färbt Knöpfe, Balken und den aktiven Reiter.
export function EinstellungenInhalt() {
  const f = useFarben();
  const router = useRouter();
  const styles = useStile(gibStile);
  const { akzentSchluessel, setzeAkzent } = useAkzentWahl();
  const { spulzeiten, setzeSpulzeit } = usePlayer();

  return (
    <View style={[styles.behaelter, { backgroundColor: f.hintergrund }]}>
      <Text style={styles.abschnitt}>Farben</Text>

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

      <Text style={styles.abschnitt}>Spulen im Player</Text>

      <View style={styles.liste}>
        {SPUL_ZEILEN.map((zeile, i) => (
          <View key={zeile.schluessel} style={[styles.spulZeile, i > 0 && styles.zeileTrenner]}>
            <Text style={styles.spulName}>{zeile.name}</Text>
            <View style={styles.chips}>
              {SPRUNG_OPTIONEN_SEK.map((sek) => {
                const aktiv = spulzeiten[zeile.schluessel] === sek;
                return (
                  <Pressable
                    key={sek}
                    style={[styles.chip, { backgroundColor: aktiv ? f.akzent : f.flaecheHell }]}
                    onPress={() => setzeSpulzeit(zeile.schluessel, sek)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: aktiv }}
                    accessibilityLabel={`${zeile.name} ${formatiereSpulzeit(sek)}`}
                  >
                    <Text style={[styles.chipText, { color: aktiv ? f.akzentText : f.text }]}>
                      {formatiereSpulzeit(sek)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
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
    spulZeile: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 10,
    },
    spulName: {
      color: f.text,
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
    },
    chips: {
      flexDirection: 'row',
      gap: 8,
    },
    chip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 16,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
