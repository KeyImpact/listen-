import { useState } from 'react';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStile, type Palette } from '@/lib/farben-kontext';
import { usePlayer } from '@/lib/player-kontext';
import { SPRUNG_SEK, formatiereZeit, fortschrittAnteil } from '@/lib/player-logik';

// Der Player-Bildschirm: Gesamt-Fortschritt, Thumbnail, darunter Kapitel, Zeitstrahl des Kapitels und die Knöpfe.
// Die Kopfleiste mit Zurück und Zahnrad kommt aus dem Layout (src/app/_layout.tsx).
export default function PlayerScreen() {
  const router = useRouter();
  const styles = useStile(gibStile);
  const {
    buch,
    abschnitt,
    position,
    dauer,
    spielt,
    umschalten,
    spulen,
    springeInAbschnitt,
    springeZu,
    kapitelSprung,
  } = usePlayer();
  const [balkenBreite, setBalkenBreite] = useState(0);
  const [zeigeZeit, setZeigeZeit] = useState(false);

  if (!buch) {
    return (
      <View style={styles.behaelter}>
        <Text style={styles.leer}>Noch kein Buch gewählt. Tippe in der Bibliothek auf ein Buch.</Text>
        <Pressable style={styles.textKnopf} onPress={() => router.back()}>
          <Text style={styles.textKnopfText}>Zurück</Text>
        </Pressable>
      </View>
    );
  }

  // Zeit und Balken beziehen sich auf das aktuelle Kapitel, nicht auf das ganze Buch.
  const kapitelPosition = Math.max(0, position - abschnitt.start);
  const anteil = fortschrittAnteil(kapitelPosition, abschnitt.laenge);

  // Fortschritt des ganzen Buches, in Prozent. Nur zur Anzeige.
  const gesamtProzent = Math.round(fortschrittAnteil(position, dauer) * 100);

  return (
    <View style={styles.behaelter}>
      {/* Ein Tipp auf die Leiste oder die Zahl wechselt zwischen Prozent und Zeit. */}
      <Pressable style={styles.gesamt} onPress={() => setZeigeZeit(!zeigeZeit)}>
        {zeigeZeit ? <Text style={styles.gesamtZeit}>{formatiereZeit(position)}</Text> : null}
        <View style={styles.gesamtSpur}>
          <View style={[styles.gesamtFuellung, { width: `${gesamtProzent}%` }]} />
        </View>
        {zeigeZeit ? (
          <Text style={styles.gesamtZeit}>{formatiereZeit(dauer)}</Text>
        ) : (
          <Text style={styles.gesamtText}>{gesamtProzent} %</Text>
        )}
      </Pressable>

      <View style={styles.cover}>
        {buch.cover_pfad ? (
          <Image source={{ uri: buch.cover_pfad }} style={styles.bild} contentFit="contain" />
        ) : (
          <View style={styles.platzhalter}>
            <Text style={styles.platzhalterText}>{buch.titel.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>

      {abschnitt.titel ? (
        <View style={styles.kapitelZeile}>
          <Pressable
            style={[styles.kapitelPfeil, !kapitelSprung.zurueck && styles.kapitelPfeilAus]}
            disabled={kapitelSprung.zurueck === null}
            accessibilityLabel="Vorheriges Kapitel"
            hitSlop={8}
            onPress={() => {
              if (kapitelSprung.zurueck !== null) springeZu(kapitelSprung.zurueck);
            }}
          >
            <Text style={styles.kapitelPfeilText}>‹</Text>
          </Pressable>
          <Text style={styles.kapitel} numberOfLines={1}>
            {abschnitt.titel}
          </Text>
          <Pressable
            style={[styles.kapitelPfeil, !kapitelSprung.weiter && styles.kapitelPfeilAus]}
            disabled={kapitelSprung.weiter === null}
            accessibilityLabel="Nächstes Kapitel"
            hitSlop={8}
            onPress={() => {
              if (kapitelSprung.weiter !== null) springeZu(kapitelSprung.weiter);
            }}
          >
            <Text style={styles.kapitelPfeilText}>›</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.zeitstrahl}>
        <Pressable
          style={styles.balkenBereich}
          onLayout={(e) => setBalkenBreite(e.nativeEvent.layout.width)}
          onPress={(e) => {
            if (balkenBreite > 0 && abschnitt.laenge > 0) {
              springeInAbschnitt(fortschrittAnteil(e.nativeEvent.locationX, balkenBreite));
            }
          }}
        >
          <View style={styles.spur}>
            <View style={[styles.fuellung, { width: `${anteil * 100}%` }]} />
          </View>
        </Pressable>
        <View style={styles.zeitZeile}>
          <Text style={styles.zeit}>{formatiereZeit(kapitelPosition)}</Text>
          <Text style={styles.zeit}>{formatiereZeit(abschnitt.laenge)}</Text>
        </View>
      </View>

      <View style={styles.steuerung}>
        <Pressable style={styles.sprungKnopf} onPress={() => spulen(-SPRUNG_SEK)}>
          <Text style={styles.sprungText}>−{SPRUNG_SEK} s</Text>
        </Pressable>
        <Pressable
          style={styles.playKnopf}
          accessibilityLabel={spielt ? 'Pause' : 'Abspielen'}
          onPress={umschalten}
        >
          <Text style={styles.playText}>{spielt ? 'Pause' : 'Play'}</Text>
        </Pressable>
        <Pressable style={styles.sprungKnopf} onPress={() => spulen(SPRUNG_SEK)}>
          <Text style={styles.sprungText}>+{SPRUNG_SEK} s</Text>
        </Pressable>
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
      paddingTop: 12,
      paddingBottom: 16,
      gap: 12,
    },
    gesamt: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    gesamtSpur: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: f.spur,
      overflow: 'hidden',
    },
    gesamtFuellung: {
      height: '100%',
      backgroundColor: f.akzent,
    },
    gesamtText: {
      color: f.text,
      fontSize: 14,
      fontWeight: '700',
      minWidth: 44,
      textAlign: 'right',
    },
    gesamtZeit: {
      color: f.text,
      fontSize: 13,
      fontWeight: '600',
      minWidth: 68,
      textAlign: 'center',
    },
    cover: {
      flex: 1,
      width: '100%',
      borderRadius: 14,
      overflow: 'hidden',
      // Kein eigener Hintergrund: Das Bild steht direkt auf dem dunklen Bildschirm.
    },
    bild: {
      width: '100%',
      height: '100%',
    },
    platzhalter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    platzhalterText: {
      color: f.textDezent,
      fontSize: 72,
      fontWeight: '700',
    },
    kapitelZeile: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    kapitel: {
      flexShrink: 1, // Lange Namen werden gekürzt, die Knöpfe bleiben am Text.
      color: f.akzent,
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
    },
    kapitelPfeil: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: f.flaecheHell,
      alignItems: 'center',
      justifyContent: 'center',
    },
    kapitelPfeilAus: {
      opacity: 0.35,
    },
    kapitelPfeilText: {
      color: f.text,
      fontSize: 26,
      fontWeight: '600',
      marginTop: -3,
    },
    zeitstrahl: {
      gap: 2,
    },
    balkenBereich: {
      paddingVertical: 8,
    },
    spur: {
      height: 4,
      borderRadius: 2,
      backgroundColor: f.spur,
      overflow: 'hidden',
    },
    fuellung: {
      height: '100%',
      backgroundColor: f.akzent,
    },
    zeitZeile: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    zeit: {
      color: f.textDezent,
      fontSize: 12,
    },
    steuerung: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    sprungKnopf: {
      height: 44,
      paddingHorizontal: 16,
      borderRadius: 22,
      backgroundColor: f.flaecheHell,
      justifyContent: 'center',
    },
    sprungText: {
      color: f.text,
      fontSize: 14,
      fontWeight: '600',
    },
    playKnopf: {
      height: 56,
      paddingHorizontal: 32,
      borderRadius: 28,
      backgroundColor: f.akzent,
      justifyContent: 'center',
    },
    playText: {
      color: f.akzentText,
      fontSize: 16,
      fontWeight: '700',
    },
    textKnopf: {
      alignSelf: 'center',
      paddingVertical: 12,
    },
    textKnopfText: {
      color: f.akzent,
      fontSize: 16,
      fontWeight: '600',
    },
    leer: {
      color: f.textDezent,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 48,
    },
  });
}
