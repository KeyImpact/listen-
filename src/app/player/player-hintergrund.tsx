import { PlayerHintergrundSeite } from '@/components/hintergrund-seite';
import { PlayerUnterseite } from '@/components/player-unterseite';

// Unterseite der Einstellungen, im Player gezeigt. Inhalt: src/components/hintergrund-seite.tsx.
export default function PlayerPlayerHintergrundSeite() {
  return (
    <PlayerUnterseite titel="Player-Hintergrund" zurueckText="Einstellungen">
      <PlayerHintergrundSeite />
    </PlayerUnterseite>
  );
}
