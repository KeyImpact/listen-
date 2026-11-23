import { Pressable, StyleSheet, View } from 'react-native';

import { useStile, type Palette } from '@/lib/farben-kontext';

// Der Start/Stopp-Knopf: ein Dreieck (Play) oder zwei Balken (Pause). Kein Text, feste Größe.
// Überall in der App gleich, damit er nicht je nach Beschriftung die Breite ändert.
export function StartStoppKnopf({
  spielt,
  onPress,
  groesse = 56,
}: {
  spielt: boolean;
  onPress: () => void;
  groesse?: number;
}) {
  const styles = useStile(gibStile);
  const symbolGroesse = Math.round(groesse * 0.36);

  return (
    <Pressable
      style={[styles.knopf, { width: groesse, height: groesse, borderRadius: groesse / 2 }]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={spielt ? 'Pause' : 'Abspielen'}
      onPress={onPress}
    >
      {spielt ? (
        <View style={[styles.balkenZeile, { gap: symbolGroesse * 0.3 }]}>
          <View style={[styles.balken, { width: symbolGroesse * 0.3, height: symbolGroesse }]} />
          <View style={[styles.balken, { width: symbolGroesse * 0.3, height: symbolGroesse }]} />
        </View>
      ) : (
        // Dreieck: links breit, nach rechts spitz. Der kleine Versatz nach rechts gleicht die optische Mitte aus.
        <View
          style={{
            width: 0,
            height: 0,
            marginLeft: symbolGroesse * 0.2,
            borderTopWidth: symbolGroesse * 0.5,
            borderBottomWidth: symbolGroesse * 0.5,
            borderLeftWidth: symbolGroesse * 0.85,
            borderTopColor: 'transparent',
            borderBottomColor: 'transparent',
            borderLeftColor: styles.symbol.color,
          }}
        />
      )}
    </Pressable>
  );
}

function gibStile(f: Palette) {
  return StyleSheet.create({
    knopf: {
      backgroundColor: f.akzent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    balkenZeile: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    balken: {
      borderRadius: 2,
      backgroundColor: f.akzentText,
    },
    symbol: {
      color: f.akzentText,
    },
  });
}
