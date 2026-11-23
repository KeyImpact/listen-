import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AKZENTE } from '@/constants/farben';
import { useAkzentWahl, type Palette } from '@/lib/farben-kontext';
import { einstellungenPfad } from '@/lib/einstellungen-ort';
import { useEinstellungenOrt, useOrtStile } from '@/lib/einstellungen-ort-kontext';
import { usePlayer } from '@/lib/player-kontext';
import { HINTERGRUND_NAMEN } from '@/lib/cover-thema-logik';
import { BALKEN_DICKEN } from '@/lib/player-logik';

// Der Inhalt der Einstellungen. Wird im Reiter „Einstellungen“ und im Player (über das Zahnrad) gezeigt.
// Ein Abschnitt „Anpassen“ mit vier gleich aussehenden Zeilen. Jede führt zu einer eigenen Seite.
export function EinstellungenInhalt() {
  const router = useRouter();
  const ort = useEinstellungenOrt();
  const styles = useOrtStile(gibStile);
  const { akzentSchluessel } = useAkzentWahl();
  const { balkenWahl, hintergrund } = usePlayer();

  const farbenName = AKZENTE.find((a) => a.schluessel === akzentSchluessel)?.name ?? AKZENTE[0].name;
  const balkenName = BALKEN_DICKEN.find((b) => b.schluessel === balkenWahl)?.name ?? BALKEN_DICKEN[0].name;

  // Eine Zeile mit Name, aktuellem Wert und Pfeil. Alle Zeilen haben dieselbe Höhe.
  const zeile = (name: string, wert: string, ziel: string, trenner: boolean) => (
    <Pressable
      key={name}
      style={[styles.zeile, trenner && styles.zeileTrenner]}
      onPress={() => router.push(einstellungenPfad(ort, ziel) as never)}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.wert}>{wert}</Text>
      <Text style={styles.pfeil}>›</Text>
    </Pressable>
  );

  return (
    <View style={styles.behaelter}>
      <Text style={styles.abschnitt}>Anpassen</Text>

      <View style={styles.liste}>
        {zeile('Farben', farbenName, '/farben', false)}
        {zeile('Balkendicke', balkenName, '/balken-dicke', true)}
        {zeile('Player-Hintergrund', HINTERGRUND_NAMEN[hintergrund], '/player-hintergrund', true)}
        {zeile('Vor- und Zurück-Knöpfe', '', '/spul-knoepfe', true)}
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
      paddingVertical: 16,
    },
    zeileTrenner: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: f.spur,
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
  });
}
