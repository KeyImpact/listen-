import { BalkenDickeSeite } from '@/components/balken-dicke-seite';
import { PlayerUnterseite } from '@/components/player-unterseite';

// Unterseite der Einstellungen, im Player gezeigt. Inhalt: src/components/balken-dicke-seite.tsx.
export default function PlayerBalkenDickeSeite() {
  return (
    <PlayerUnterseite titel="Balkendicke" zurueckText="Einstellungen">
      <BalkenDickeSeite />
    </PlayerUnterseite>
  );
}
