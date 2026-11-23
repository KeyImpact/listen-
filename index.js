// Einstieg der App. Der Wiedergabe-Dienst muss vor der App registriert werden,
// deshalb steht die Registrierung hier und nicht in src/.
import TrackPlayer from 'react-native-track-player';

import { wiedergabeDienst } from './src/lib/wiedergabe-dienst';

TrackPlayer.registerPlaybackService(() => wiedergabeDienst);

// Erst nach der Registrierung die App laden (expo-router).
require('expo-router/entry');
