// Reine Logik für die Bibliothek: Suche und Sortierung.
// Ohne Imports, damit sie mit Node direkt testbar ist.

export type Sortierung = 'titel' | 'autor';

export interface BuchFuerListe {
  titel: string;
  autor: string | null;
}

// Sucht in Titel und Autor. Groß- und Kleinschreibung spielen keine Rolle.
export function filtereBuecher<T extends BuchFuerListe>(buecher: T[], suchtext: string): T[] {
  const suche = suchtext.trim().toLocaleLowerCase('de');
  if (suche.length === 0) return buecher;
  return buecher.filter((buch) => {
    const titel = buch.titel.toLocaleLowerCase('de');
    const autor = (buch.autor ?? '').toLocaleLowerCase('de');
    return titel.includes(suche) || autor.includes(suche);
  });
}

// Gibt eine sortierte Kopie zurück. Das Original bleibt unverändert.
// Bücher ohne Autor landen bei der Autor-Sortierung ganz unten.
export function sortiereBuecher<T extends BuchFuerListe>(buecher: T[], sortierung: Sortierung): T[] {
  const kopie = [...buecher];
  if (sortierung === 'titel') {
    return kopie.sort((a, b) => vergleiche(a.titel, b.titel));
  }
  return kopie.sort((a, b) => {
    if (a.autor === null && b.autor === null) return vergleiche(a.titel, b.titel);
    if (a.autor === null) return 1;
    if (b.autor === null) return -1;
    const nachAutor = vergleiche(a.autor, b.autor);
    return nachAutor !== 0 ? nachAutor : vergleiche(a.titel, b.titel);
  });
}

// Deutsche Sortierung: "ä" steht bei "a", Groß- und Kleinschreibung egal.
function vergleiche(a: string, b: string): number {
  return a.localeCompare(b, 'de', { sensitivity: 'base' });
}
