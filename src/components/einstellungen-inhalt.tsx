import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AKZENTE } from '@/constants/farben';
import { useAkzentWahl, useFarben, useStile, type Palette } from '@/lib/farben-kontext';
import { usePlayer } from '@/lib/player-kontext';
import { BALKEN_DICKEN } from '@/lib/player-logik';

// Der Inhalt der Einstellungen. Wird im Reiter „Einstellungen“ und auf der Seite über das Zahnrad gezeigt.
// Oben die Akzentfarbe, darunter die Anpassungen des Players (Balkendicke, Spul-Knöpfe).
export function EinstellungenInhalt() {
  const f = useFarben();
  const router = useRouter();
  const styles = useStile(gibStile);
  const { akzentSchluessel, setzeAkzent } = useAkzentWahl();
  const { balkenWahl } = usePlayer();

  const balkenName = BALKEN_DICKEN.find((b) => b.schluessel === balkenWahl)?.name ?? BALKEN_DICKEN[0].name;

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

      <Text style={styles.abschnitt}>Anpassen</Text>

      <View style={styles.liste}>
        <Pressable
          style={styles.zeile}
          onPress={() => router.push('/balken-dicke')}
          accessibilityRole="button"
          accessibilityLabel="Balkendicke"
        >
          <Text style={styles.name}>Balkendicke</Text>
          <Text style={styles.wert}>{balkenName}</Text>
          <Text style={styles.pfeil}>›</Text>
        </Pressable>
        <Pressable
          style={[styles.zeile, styles.zeileTrenner]}
          onPress={() => router.push('/spul-knoepfe')}
          accessibilityRole="button"
          accessibilityLabel="Vor- und Zurück-Knöpfe"
        >
          <Text style={styles.name}>Vor- und Zurück-Knöpfe</Text>
          <Text style={styles.pfeil}>›</Text>
        </Pressable>
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
    wert: {
      color: f.textDezent,
      fontSize: 15,
    },
    pfeil: {
      color: f.textDezent,
      fontSize: 22,
    },
    haken: {
      fontSize: 18,
      fontWeight: '700',
    },
  });
}
