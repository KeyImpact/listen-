import { FarbenSeite } from '@/components/farben-seite';
import { PlayerUnterseite } from '@/components/player-unterseite';

// Unterseite der Einstellungen, im Player gezeigt. Inhalt: src/components/farben-seite.tsx.
export default function PlayerFarbenSeite() {
  return (
    <PlayerUnterseite titel="Farben" zurueckText="Einstellungen">
      <FarbenSeite />
    </PlayerUnterseite>
  );
}
