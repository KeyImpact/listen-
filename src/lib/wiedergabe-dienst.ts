// Der Wiedergabe-Dienst läuft im Hintergrund, auch wenn die App nicht offen ist.
// Hier landen die Knöpfe von Sperrbildschirm und Benachrichtigung.
import TrackPlayer, { Event } from 'react-native-track-player';

export async function wiedergabeDienst(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    void TrackPlayer.play();
  });
  TrackPlayer.addEventListener(Event.RemotePause, () => {
    void TrackPlayer.pause();
  });
  TrackPlayer.addEventListener(Event.RemoteStop, () => {
    void TrackPlayer.pause();
  });
  TrackPlayer.addEventListener(Event.RemoteSeek, (e) => {
    void TrackPlayer.seekTo(e.position);
  });
  // Vor und Zurück in der Benachrichtigung springen um die eingestellte Spulzeit.
  TrackPlayer.addEventListener(Event.RemoteJumpForward, (e) => {
    void TrackPlayer.seekBy(e.interval);
  });
  TrackPlayer.addEventListener(Event.RemoteJumpBackward, (e) => {
    void TrackPlayer.seekBy(-e.interval);
  });
}
