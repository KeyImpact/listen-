import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { TempoRad } from '@/components/tempo-rad';
import { useFarben, useStile, type Palette } from '@/lib/farben-kontext';
import { usePlayer } from '@/lib/player-kontext';
import { formatiereTempo } from '@/lib/player-logik';

// Der Tempo-Knopf in der Kopfleiste des Players. Er zeigt das Tempo, z. B. „1,5×“.
// Ein Tipp öffnet ein Drehrad, mit dem man das Tempo in 0,1er-Schritten einstellt.
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
  const { tempo, tempoSetzen } = usePlayer();

  return (
    <Modal visible={sichtbar} transparent animationType="none" onRequestClose={onSchliessen}>
      <View style={styles.hintergrund}>
        {/* Ein Tipp außerhalb des Kastens schließt den Dialog. Der Kasten selbst ist kein Knopf,
            damit das Wischen am Rad nicht abgefangen wird. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onSchliessen} accessibilityLabel="Dialog schließen" />
        <View style={styles.kasten}>
          <Text style={styles.titel}>Tempo</Text>
          <TempoRad wert={tempo} onWert={tempoSetzen} />
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
      gap: 18,
    },
    titel: {
      color: f.text,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
  });
}
