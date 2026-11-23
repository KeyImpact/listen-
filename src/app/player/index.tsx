import { useState } from 'react';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StartStoppKnopf } from '@/components/start-stopp-knopf';
import { useStile, type Palette } from '@/lib/farben-kontext';
import { usePlayer } from '@/lib/player-kontext';
import { formatiereSpulzeit, formatiereZeit, fortschrittAnteil } from '@/lib/player-logik';

// Der Player-Bildschirm: Gesamt-Fortschritt, Thumbnail, darunter Kapitel, Zeitstrahl des Kapitels und die Knöpfe.
// Kopfleiste und Hintergrund kommen aus dem gemeinsamen Rahmen (src/app/player/_layout.tsx).
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
    spulzeiten,
    aussenAktiv,
    aussenSek,
    balkenDicke,
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

      {/* Zeiten links und rechts neben dem Balken, wie bei der Fortschrittsleiste oben. */}
      <View style={styles.zeitstrahl}>
        <Text style={styles.zeit}>{formatiereZeit(kapitelPosition)}</Text>
        <Pressable
          style={styles.balkenBereich}
          onLayout={(e) => setBalkenBreite(e.nativeEvent.layout.width)}
          onPress={(e) => {
            if (balkenBreite > 0 && abschnitt.laenge > 0) {
              springeInAbschnitt(fortschrittAnteil(e.nativeEvent.locationX, balkenBreite));
            }
          }}
        >
          <View style={[styles.spur, { height: balkenDicke, borderRadius: balkenDicke / 2 }]}>
            <View style={[styles.fuellung, { width: `${anteil * 100}%` }]} />
          </View>
        </Pressable>
        <Text style={styles.zeit}>{formatiereZeit(abschnitt.laenge)}</Text>
      </View>

      <View style={styles.steuerung}>
        {/* Von außen nach innen: äußerer Knopf links, innen links, Start, innen rechts, äußerer Knopf rechts. */}
        {aussenAktiv ? (
          <Pressable style={styles.sprungKnopf} onPress={() => spulen(-aussenSek.zurueck)}>
            <Text style={styles.sprungText}>−{formatiereSpulzeit(aussenSek.zurueck)}</Text>
          </Pressable>
        ) : null}
        <Pressable style={styles.sprungKnopf} onPress={() => spulen(-spulzeiten.zurueck)}>
          <Text style={styles.sprungText}>−{formatiereSpulzeit(spulzeiten.zurueck)}</Text>
        </Pressable>
        <StartStoppKnopf spielt={spielt} onPress={umschalten} groesse={64} />
        <Pressable style={styles.sprungKnopf} onPress={() => spulen(spulzeiten.vor)}>
          <Text style={styles.sprungText}>+{formatiereSpulzeit(spulzeiten.vor)}</Text>
        </Pressable>
        {aussenAktiv ? (
          <Pressable style={styles.sprungKnopf} onPress={() => spulen(aussenSek.vor)}>
            <Text style={styles.sprungText}>+{formatiereSpulzeit(aussenSek.vor)}</Text>
          </Pressable>
        ) : null}
      </View>

    </View>
  );
}

function gibStile(f: Palette) {
  return StyleSheet.create({
    behaelter: {
      // Kein Hintergrund: Der Cover-Hintergrund kommt aus dem Rahmen darüber.
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 40,
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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    balkenBereich: {
      flex: 1,
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
    zeit: {
      color: f.textDezent,
      fontSize: 12,
      minWidth: 40,
    },
    steuerung: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    sprungKnopf: {
      width: 60, // Feste Breite, damit die Knöpfe nicht je nach Text springen.
      height: 44,
      borderRadius: 22,
      backgroundColor: f.flaecheHell,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sprungText: {
      color: f.text,
      fontSize: 14,
      fontWeight: '600',
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
