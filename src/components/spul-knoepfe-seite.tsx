import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { useOrtStile } from '@/lib/einstellungen-ort-kontext';
import { useFarben, type Palette } from '@/lib/farben-kontext';
import { usePlayer } from '@/lib/player-kontext';
import { SPRUNG_OPTIONEN_SEK, formatiereSpulzeit } from '@/lib/player-logik';

// Die Spul-Knöpfe im Player. Die äußeren zwei gehen nur zusammen an oder aus.
// Die inneren zwei sind immer da. Jeder Knopf hat seine eigene Spulzeit: 5 s, 15 s, 30 s oder 1 min.
// Wird im Reiter und im Player (über /player/spul-knoepfe) gezeigt.
export function SpulKnoepfeSeite() {
  const f = useFarben();
  const styles = useOrtStile(gibStile);
  const { spulzeiten, setzeSpulzeit, aussenAktiv, setzeAussenAktiv, aussenSek, setzeAussenSek } = usePlayer();

  // Eine Zeile mit Auswahl der Spulzeit. aus = true macht die Auswahl grau und nicht antippbar.
  const zeile = (
    titel: string,
    aktuell: number,
    setze: (sek: number) => void,
    aus: boolean,
  ) => (
    <View style={styles.zeile}>
      <Text style={styles.name}>{titel}</Text>
      <View style={[styles.chips, aus && styles.aus]}>
        {SPRUNG_OPTIONEN_SEK.map((sek) => {
          const aktiv = aktuell === sek;
          return (
            <Pressable
              key={sek}
              disabled={aus}
              style={[styles.chip, { backgroundColor: aktiv ? f.akzent : f.flaecheHell }]}
              onPress={() => setze(sek)}
              accessibilityRole="radio"
              accessibilityState={{ checked: aktiv, disabled: aus }}
              accessibilityLabel={`${titel} ${formatiereSpulzeit(sek)}`}
            >
              <Text style={[styles.chipText, { color: aktiv ? f.akzentText : f.text }]}>
                {formatiereSpulzeit(sek)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.behaelter}>
      <Text style={styles.abschnitt}>Außen-Knöpfe</Text>
      <View style={styles.liste}>
        <View style={styles.kopfZeile}>
          <Text style={styles.titel}>Außen-Knöpfe anzeigen</Text>
          <Switch
            value={aussenAktiv}
            onValueChange={setzeAussenAktiv}
            trackColor={{ false: f.flaecheHell, true: f.akzent }}
            accessibilityLabel="Außen-Knöpfe anzeigen"
          />
        </View>
        {zeile('Außen links', aussenSek.zurueck, (sek) => setzeAussenSek('zurueck', sek), !aussenAktiv)}
        {zeile('Außen rechts', aussenSek.vor, (sek) => setzeAussenSek('vor', sek), !aussenAktiv)}
      </View>

      <Text style={styles.abschnitt}>Innen-Knöpfe</Text>
      <View style={styles.liste}>
        {zeile('Zurück (innen)', spulzeiten.zurueck, (sek) => setzeSpulzeit('zurueck', sek), false)}
        {zeile('Vor (innen)', spulzeiten.vor, (sek) => setzeSpulzeit('vor', sek), false)}
      </View>

      <Text style={styles.hinweis}>
        Die äußeren Knöpfe sind nur im Player sichtbar. In der Benachrichtigung gibt es nur die inneren Knöpfe.
      </Text>
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
    kopfZeile: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    titel: {
      color: f.text,
      fontSize: 16,
      fontWeight: '600',
    },
    zeile: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: f.spur,
    },
    name: {
      color: f.text,
      fontSize: 15,
    },
    chips: {
      flexDirection: 'row',
      gap: 8,
    },
    aus: {
      opacity: 0.35,
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
    hinweis: {
      color: f.textDezent,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 8,
    },
  });
}
