import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useOrtStile } from '@/lib/einstellungen-ort-kontext';
import { type Palette } from '@/lib/farben-kontext';
import { ABDUNKEL_OPTIONEN, HINTERGRUND_NAMEN, type HintergrundModus } from '@/lib/cover-thema-logik';
import { usePlayer } from '@/lib/player-kontext';

const MODI: HintergrundModus[] = ['off', 'blur', 'gradient'];

// Auswahl des Player-Hintergrunds. Bei „Unscharfes Cover“ kommt zusätzlich die Abdunkelung dazu.
// Wird im Reiter und im Player (über /player/player-hintergrund) gezeigt.
export function PlayerHintergrundSeite() {
  const styles = useOrtStile(gibStile);
  const { hintergrund, setzeHintergrund, abdunkel, setzeAbdunkel } = usePlayer();

  return (
    <View style={styles.behaelter}>
      <View style={styles.liste}>
        {MODI.map((modus, i) => {
          const aktiv = modus === hintergrund;
          return (
            <Pressable
              key={modus}
              style={[styles.zeile, i > 0 && styles.zeileTrenner]}
              onPress={() => setzeHintergrund(modus)}
              accessibilityRole="radio"
              accessibilityState={{ checked: aktiv }}
              accessibilityLabel={`Player-Hintergrund ${HINTERGRUND_NAMEN[modus]}`}
            >
              <Text style={styles.name}>{HINTERGRUND_NAMEN[modus]}</Text>
              {aktiv ? <Text style={styles.haken}>✓</Text> : null}
            </Pressable>
          );
        })}
      </View>

      {hintergrund === 'blur' ? (
        <>
          <Text style={styles.abschnitt}>Abdunkelung</Text>
          <View style={styles.zeilenBereich}>
            {ABDUNKEL_OPTIONEN.map((wert) => {
              const aktiv = Math.abs(wert - abdunkel) < 0.001;
              return (
                <Pressable
                  key={wert}
                  style={[styles.chip, aktiv && styles.chipAktiv]}
                  onPress={() => setzeAbdunkel(wert)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: aktiv }}
                  accessibilityLabel={`Abdunkelung ${Math.round(wert * 100)} Prozent`}
                >
                  <Text style={[styles.chipText, aktiv && styles.chipTextAktiv]}>{Math.round(wert * 100)} %</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
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
      gap: 12,
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
    haken: {
      color: f.akzent,
      fontSize: 18,
      fontWeight: '700',
    },
    abschnitt: {
      color: f.textDezent,
      fontSize: 13,
      marginTop: 8,
      paddingHorizontal: 4,
    },
    zeilenBereich: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      minHeight: 44,
      minWidth: 64,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: f.textDezent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipAktiv: {
      borderColor: f.akzent,
      backgroundColor: f.flaeche,
    },
    chipText: {
      color: f.text,
      fontSize: 15,
    },
    chipTextAktiv: {
      color: f.akzent,
      fontWeight: '700',
    },
  });
}
