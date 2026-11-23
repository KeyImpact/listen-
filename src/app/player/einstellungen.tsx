import { EinstellungenInhalt } from '@/components/einstellungen-inhalt';
import { PlayerUnterseite } from '@/components/player-unterseite';

// Die Einstellungen im Player. Die Kopfleiste des Players bleibt oben stehen.
export default function PlayerEinstellungen() {
  return (
    <PlayerUnterseite titel="Einstellungen" zurueckText="Player">
      <EinstellungenInhalt />
    </PlayerUnterseite>
  );
}
