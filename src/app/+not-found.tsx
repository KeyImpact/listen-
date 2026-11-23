import { Redirect } from 'expo-router';

// Die Benachrichtigung öffnet die App mit einer Adresse, die es als Seite nicht gibt (trackplayer://notification.click).
// Statt der Fehlerseite „Unmatched Route“ geht es direkt zum Player mit dem laufenden Buch.
export default function NichtGefunden() {
  return <Redirect href="/player" />;
}
