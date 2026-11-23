import { SpulKnoepfeSeite } from '@/components/spul-knoepfe-seite';
import { PlayerUnterseite } from '@/components/player-unterseite';

// Unterseite der Einstellungen, im Player gezeigt. Inhalt: src/components/spul-knoepfe-seite.tsx.
export default function PlayerSpulKnoepfeSeite() {
  return (
    <PlayerUnterseite titel="Vor- und Zurück-Knöpfe" zurueckText="Einstellungen">
      <SpulKnoepfeSeite />
    </PlayerUnterseite>
  );
}
