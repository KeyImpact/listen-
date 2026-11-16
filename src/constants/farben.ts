// Farben für das dunkle Design. Zentral an einer Stelle, damit man sie leicht ändern kann.
export const farben = {
  hintergrund: '#121212',
  flaeche: '#1E1E1E',
  flaecheHell: '#2A2A2A',
  text: '#F2F2F2',
  textDezent: '#A0A0A0',
  akzent: '#8AB4F8',
  akzentText: '#0B1F3A',
  fehler: '#F28B82',
  spur: '#3A3A3A',
} as const;

// Die wählbaren Akzentfarben (Knöpfe, Balken, Reiter). Blau ist der Standard, wie oben in `farben`.
// akzentText ist die Schriftfarbe auf der Akzentfarbe, dunkel genug für gute Lesbarkeit.
export const AKZENTE = [
  { schluessel: 'blau', name: 'Blau', akzent: '#8AB4F8', akzentText: '#0B1F3A' },
  { schluessel: 'tuerkis', name: 'Türkis', akzent: '#6FD3D0', akzentText: '#0A2F2E' },
  { schluessel: 'gruen', name: 'Grün', akzent: '#81C995', akzentText: '#0B2814' },
  { schluessel: 'orange', name: 'Orange', akzent: '#FDAE6B', akzentText: '#3A1E00' },
  { schluessel: 'rosa', name: 'Rosa', akzent: '#F28BC0', akzentText: '#3A0B22' },
] as const;

export type AkzentSchluessel = (typeof AKZENTE)[number]['schluessel'];
