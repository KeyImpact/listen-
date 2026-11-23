import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useFarben } from '@/lib/farben-kontext';
import { type CoverFarben } from '@/lib/cover-thema';
import {
  UNSCHARF_ZOOM,
  abdunklungFuer,
  farbeAusPalette,
  verlaufFuer,
} from '@/lib/cover-thema-logik';
import { usePlayer } from '@/lib/player-kontext';

// Der Hintergrund hinter dem Player-Inhalt. Je nach Einstellung: unscharfes Cover, Farbverlauf oder nichts (Standard).
// Solange die Farben noch berechnet werden, bleibt der Standard stehen. So gibt es kein Aufblitzen.
export function PlayerHintergrund({ coverUri, farben }: { coverUri: string | null; farben: CoverFarben | null }) {
  const f = useFarben();
  const { hintergrund, abdunkel } = usePlayer();

  if (hintergrund === 'off') return null;

  // Ohne Cover gilt der App-Akzent. Liegen die Farben noch nicht vor, bleibt der Standard.
  if (coverUri && !farben) return null;

  if (hintergrund === 'blur' && coverUri && farben) {
    // Die Abdunkelung wird bei hellen Covern nachgezogen, damit der Text lesbar bleibt.
    const schwarz = abdunklungFuer(abdunkel, farben.average);
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image
          source={{ uri: coverUri }}
          style={[StyleSheet.absoluteFill, { transform: [{ scale: UNSCHARF_ZOOM }] }]}
          contentFit="cover"
          blurRadius={50}
          transition={500}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0, 0, 0, ${schwarz})` }]} />
      </View>
    );
  }

  // Farbverlauf: vibrant, sonst dominant, sonst muted, sonst App-Akzent.
  const verlauf = verlaufFuer(farbeAusPalette(farben, f.akzent), f.hintergrund);
  return (
    <LinearGradient
      colors={verlauf.farben as [string, string, ...string[]]}
      locations={verlauf.stellen as [number, number, ...number[]]}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
