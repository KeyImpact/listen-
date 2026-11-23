import { useEffect, useRef, useState } from 'react';

import {
  ScrollView,
  type ScrollViewInstance,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import * as Haptics from 'expo-haptics';

import { useFarben, useStile, type Palette } from '@/lib/farben-kontext';
import { TEMPO_WERTE, formatiereTempo, rasteTempo } from '@/lib/player-logik';

// Abstand zwischen zwei Strichen des Rads. Ein Strich entspricht 0,1.
const STRICH_BREITE = 14;
const RAD_HOEHE = 64;

// Beschriftung unter den Strichen, mit deutschem Komma: „1“, „1,5“, „0,5“.
function beschriftungFuer(w: number): string {
  return Number.isInteger(w) ? String(w) : w.toFixed(1).replace('.', ',');
}

// Ein Drehrad für das Tempo: Man zieht die Leiste nach links oder rechts. Der Strich unter dem Zeiger ist das Tempo.
// Es rastet auf jedem 0,1er-Schritt ein. Der Wert ist sofort da, sobald die Leiste stillsteht.
export function TempoRad({ wert, onWert }: { wert: number; onWert: (wert: number) => void }) {
  const f = useFarben();
  const styles = useStile(gibStile);
  // Die Breite schätzen wir gleich aus der Bildschirmgröße (Kasten: max. 360 px, 20 px Rand links und rechts).
  // So steht das Rad beim ersten Zeichnen schon richtig, es wartet nicht auf die Messung.
  const { width: bildschirmBreite } = useWindowDimensions();
  const [breite, setBreite] = useState(() => Math.min(bildschirmBreite - 48, 360) - 40);
  const [live, setLive] = useState(rasteTempo(wert));
  const ref = useRef<ScrollViewInstance>(null);
  // Die Startposition merken wir uns nur beim Öffnen. Ändert sich das Tempo beim Ziehen,
  // darf die Leiste nicht zurückspringen.
  const [startIndex] = useState(() => Math.max(0, TEMPO_WERTE.indexOf(rasteTempo(wert))));

  // Beim Öffnen die Leiste so schieben, dass das aktuelle Tempo unter dem Zeiger steht.
  useEffect(() => {
    if (breite > 0) ref.current?.scrollTo({ x: startIndex * STRICH_BREITE, animated: false });
  }, [breite, startIndex]);

  const indexBei = (x: number) => Math.min(TEMPO_WERTE.length - 1, Math.max(0, Math.round(x / STRICH_BREITE)));

  const beiScrollen = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const neu = TEMPO_WERTE[indexBei(e.nativeEvent.contentOffset.x)];
    if (neu !== live) {
      setLive(neu);
      // Bei jeder Stufe ein kurzes Tippen im Handy, wie bei einem Drehrad.
      void Haptics.selectionAsync().catch(() => {});
    }
  };

  // Erst wenn die Leiste stillsteht, übernehmen wir den Wert in den Player. So muss er nicht bei jedem Strich neu rechnen.
  const beiStillstand = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const neu = TEMPO_WERTE[indexBei(e.nativeEvent.contentOffset.x)];
    setLive(neu);
    onWert(neu);
  };

  const beiLayout = (e: LayoutChangeEvent) => setBreite(e.nativeEvent.layout.width);

  // Die Leiste hat links und rechts Platz, damit der erste und der letzte Strich auch unter den Zeiger kommen.
  const polster = Math.max(0, breite / 2 - STRICH_BREITE / 2);

  return (
    <View style={styles.behaelter} onLayout={beiLayout}>
      <Text style={[styles.anzeige, { color: f.akzent }]} accessibilityLiveRegion="polite">
        {formatiereTempo(live)}
      </Text>
      <View style={styles.rad}>
        <ScrollView
          ref={ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={STRICH_BREITE}
          decelerationRate="fast"
          onScroll={beiScrollen}
          scrollEventThrottle={16}
          onScrollEndDrag={beiStillstand}
          onMomentumScrollEnd={beiStillstand}
          contentContainerStyle={{ paddingHorizontal: polster, alignItems: 'flex-end' }}
          accessibilityRole="adjustable"
          accessibilityLabel="Tempo-Rad"
          accessibilityValue={{ text: formatiereTempo(live) }}
        >
          {TEMPO_WERTE.map((w) => {
            const ganz = Math.abs(w - Math.round(w)) < 1e-9;
            const halb = Math.abs(w * 2 - Math.round(w * 2)) < 1e-9;
            const hoehe = ganz ? 40 : halb ? 26 : 14;
            return (
              <View key={w} style={styles.strichBereich}>
                <View
                  style={[
                    styles.strich,
                    { height: hoehe, backgroundColor: ganz ? f.text : f.textDezent },
                  ]}
                />
                {ganz || halb ? <Text style={styles.beschriftung}>{beschriftungFuer(w)}</Text> : null}
              </View>
            );
          })}
        </ScrollView>
        {/* Der feste Zeiger in der Mitte. Er bewegt sich nicht mit der Leiste. */}
        <View pointerEvents="none" style={[styles.zeiger, { backgroundColor: f.akzent, left: breite / 2 - 1 }]} />
      </View>
    </View>
  );
}

function gibStile(f: Palette) {
  return StyleSheet.create({
    behaelter: {
      alignItems: 'center',
      gap: 12,
      width: '100%',
    },
    anzeige: {
      fontSize: 32,
      fontWeight: '700',
    },
    rad: {
      width: '100%',
      height: RAD_HOEHE + 24,
    },
    strichBereich: {
      width: STRICH_BREITE,
      height: RAD_HOEHE,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    strich: {
      width: 2,
      borderRadius: 1,
    },
    beschriftung: {
      position: 'absolute',
      bottom: -18,
      width: 30,
      left: (STRICH_BREITE - 30) / 2, // Mitte der Beschriftung unter die Mitte des Strichs
      textAlign: 'center',
      color: f.textDezent,
      fontSize: 12,
    },
    zeiger: {
      position: 'absolute',
      top: 0,
      width: 2,
      height: RAD_HOEHE,
      borderRadius: 1,
    },
  });
}
