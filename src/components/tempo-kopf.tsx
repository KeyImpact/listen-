import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useFarben, useStile, type Palette } from '@/lib/farben-kontext';
import { usePlayer } from '@/lib/player-kontext';
import { formatiereTempo } from '@/lib/player-logik';

// Der Tempo-Knopf in der Kopfleiste des Players. Er zeigt das Tempo, z. B. „1,5×“.
// Ein Tipp öffnet einen Dialog, in dem man schneller und langsamer machen kann.
export function TempoKopf() {
  const f = useFarben();
  const { tempo } = usePlayer();
  const [offen, setOffen] = useState(false);

  return (
    <>
      <Pressable hitSlop={12} accessibilityLabel="Tempo einstellen" onPress={() => setOffen(true)}>
        <Text style={{ color: f.akzent, fontSize: 15, fontWeight: '700' }}>{formatiereTempo(tempo)}</Text>
      </Pressable>
      <TempoDialog sichtbar={offen} onSchliessen={() => setOffen(false)} />
    </>
  );
}

function TempoDialog({ sichtbar, onSchliessen }: { sichtbar: boolean; onSchliessen: () => void }) {
  const styles = useStile(gibStile);
  const { tempo, tempoAendern } = usePlayer();

  return (
    <Modal visible={sichtbar} transparent animationType="fade" onRequestClose={onSchliessen}>
      {/* Ein Tipp außerhalb des Kastens schließt den Dialog. */}
      <Pressable style={styles.hintergrund} onPress={onSchliessen}>
        <Pressable style={styles.kasten} onPress={() => {}}>
          <Text style={styles.titel}>Tempo</Text>
          <View style={styles.zeile}>
            <Pressable
              style={styles.knopf}
              accessibilityLabel="Langsamer"
              onPress={() => tempoAendern(-1)}
            >
              <Text style={styles.knopfText}>−</Text>
            </Pressable>
            <Text style={styles.wert}>{formatiereTempo(tempo)}</Text>
            <Pressable style={styles.knopf} accessibilityLabel="Schneller" onPress={() => tempoAendern(1)}>
              <Text style={styles.knopfText}>+</Text>
            </Pressable>
          </View>
          <Pressable style={styles.fertig} onPress={onSchliessen}>
            <Text style={styles.fertigText}>Fertig</Text>
          </Pressable>
        </Pressable>
      </Pressable>
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
      gap: 18,
    },
    titel: {
      color: f.text,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
    zeile: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    knopf: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: f.flaecheHell,
      alignItems: 'center',
      justifyContent: 'center',
    },
    knopfText: {
      color: f.text,
      fontSize: 28,
      fontWeight: '600',
    },
    wert: {
      color: f.akzent,
      fontSize: 32,
      fontWeight: '700',
    },
    fertig: {
      backgroundColor: f.akzent,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    fertigText: {
      color: f.akzentText,
      fontSize: 16,
      fontWeight: '700',
    },
  });
}
