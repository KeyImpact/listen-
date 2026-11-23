import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useFarben, useStile, type Palette } from '@/lib/farben-kontext';
import { usePlayer } from '@/lib/player-kontext';
import { SCHLAF_PRESETS_MIN, formatiereRest } from '@/lib/schlaf-logik';

// Der Sleep-Timer in der Kopfleiste des Players. Ein Mond-Zeichen; wenn ein Timer läuft, steht die Restzeit daneben.
// Ein Tipp öffnet das Auswahl-Fenster.
export function SchlafKopf() {
  const f = useFarben();
  const { schlaf, spielt } = usePlayer();
  const [offen, setOffen] = useState(false);

  const aktiv = schlaf.modus !== 'aus';
  const text =
    schlaf.modus === 'dauer' && schlaf.restSek !== null
      ? formatiereRest(schlaf.restSek)
      : schlaf.modus === 'kapitel'
        ? 'Kap.'
        : '';
  // Bei Pause zeigen wir die Restzeit blasser, sie läuft gerade nicht.
  const deckkraft = aktiv && !spielt ? 0.5 : 1;

  return (
    <>
      <Pressable
        hitSlop={12}
        accessibilityLabel={aktiv ? 'Sleep-Timer aktiv' : 'Sleep-Timer'}
        onPress={() => setOffen(true)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: deckkraft }}
      >
        <Text style={{ color: aktiv ? f.akzent : f.text, fontSize: 18 }}>☾</Text>
        {text ? (
          <Text style={{ color: f.akzent, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
            {text}
          </Text>
        ) : null}
      </Pressable>
      <SchlafDialog sichtbar={offen} onSchliessen={() => setOffen(false)} />
    </>
  );
}

function SchlafDialog({ sichtbar, onSchliessen }: { sichtbar: boolean; onSchliessen: () => void }) {
  const f = useFarben();
  const styles = useStile(gibStile);
  const { schlaf, hatKapitel, setzeSchlaf, verlaengereSchlaf } = usePlayer();
  const aktiv = schlaf.modus !== 'aus';

  // Eine Auswahl startet den Timer und schließt das Fenster.
  const waehlen = (wahl: number | 'kapitel' | null) => {
    setzeSchlaf(wahl);
    onSchliessen();
  };

  return (
    <Modal visible={sichtbar} transparent animationType="none" onRequestClose={onSchliessen}>
      <View style={styles.hintergrund}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onSchliessen} accessibilityLabel="Dialog schließen" />
        <View style={styles.kasten}>
          <Text style={styles.titel}>Sleep-Timer</Text>

          {aktiv ? (
            <View style={styles.aktivBlock}>
              <Text style={[styles.grossAnzeige, { color: f.akzent }]}>
                {schlaf.modus === 'dauer' && schlaf.restSek !== null
                  ? formatiereRest(schlaf.restSek)
                  : 'Kapitelende'}
              </Text>
              {schlaf.modus === 'dauer' ? (
                <View style={styles.zeile}>
                  <Pressable style={styles.knopf} onPress={() => verlaengereSchlaf(5)}>
                    <Text style={styles.knopfText}>+5 Min</Text>
                  </Pressable>
                  <Pressable style={styles.knopf} onPress={() => verlaengereSchlaf(15)}>
                    <Text style={styles.knopfText}>+15 Min</Text>
                  </Pressable>
                </View>
              ) : null}
              <Pressable style={[styles.knopf, styles.gefahr]} onPress={() => waehlen(null)}>
                <Text style={[styles.knopfText, { color: '#ff6b6b' }]}>Timer beenden</Text>
              </Pressable>
            </View>
          ) : null}

          <View style={styles.liste}>
            {SCHLAF_PRESETS_MIN.map((min) => (
              <Pressable key={min} style={styles.reihe} onPress={() => waehlen(min)}>
                <Text style={styles.reiheText}>{min} Min</Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.reihe, !hatKapitel && styles.deaktiviert]}
              disabled={!hatKapitel}
              onPress={() => waehlen('kapitel')}
            >
              <Text style={styles.reiheText}>{hatKapitel ? 'Ende des Kapitels' : 'Ende des Kapitels (keine Kapitel)'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function gibStile(f: Palette) {
  return StyleSheet.create({
    hintergrund: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    kasten: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: f.flaeche,
      borderRadius: 16,
      padding: 20,
      gap: 16,
    },
    titel: {
      color: f.text,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
    aktivBlock: {
      alignItems: 'center',
      gap: 12,
    },
    grossAnzeige: {
      fontSize: 34,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    zeile: {
      flexDirection: 'row',
      gap: 12,
    },
    knopf: {
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: f.textDezent,
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'stretch',
    },
    gefahr: {
      borderColor: '#ff6b6b',
    },
    knopfText: {
      color: f.text,
      fontSize: 15,
      fontWeight: '600',
    },
    liste: {
      gap: 4,
    },
    reihe: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    deaktiviert: {
      opacity: 0.4,
    },
    reiheText: {
      color: f.text,
      fontSize: 16,
    },
  });
}
