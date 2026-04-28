import chordData from "@/data/chords.json";
import { normalizeChord } from "./notation";

export type ChordDiagram = {
  fingers: [number, number | "x"][];
  barres: { fromString: number; toString: number; fret: number }[];
  position?: number;
};

const DB = chordData as unknown as Record<string, ChordDiagram>;

/**
 * Sucht ein Akkord-Diagramm in der DB. Akzeptiert sowohl exakte Schreibweise
 * als auch normalisierte (Kleinbuchstaben-Moll wird auf Großschreibung gehoben).
 * Gibt null zurück, wenn der Akkord nicht in der DB ist.
 */
export function getChordDiagram(name: string): ChordDiagram | null {
  const trimmed = name.trim();
  if (!trimmed) return null;

  if (DB[trimmed]) return DB[trimmed];

  try {
    const normalized = normalizeChord(trimmed);
    if (DB[normalized]) return DB[normalized];
  } catch {
    // Parser-Fehler (z.B. ungültiger Akkord) → null
  }

  return null;
}

export function hasChordDiagram(name: string): boolean {
  return getChordDiagram(name) !== null;
}
