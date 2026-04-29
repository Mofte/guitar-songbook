import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { SongFrontmatterSchema, type Song } from "./schema";

const songsDir = path.join(process.cwd(), "songs");

// Modul-Level-Cache: in Production wird das Dateisystem genau einmal pro
// Build/Server-Lifetime gelesen. In Dev wechselt Next die Modul-Instanz
// bei Hot-Reload, also bleibt frische Daten-Sicht erhalten.
let cachedSongs: Song[] | null = null;
const cachedBySlug = new Map<string, Song>();

function fileToSlug(filename: string): string {
  return filename.replace(/\.cho$/, "");
}

/**
 * YAML interpretiert leere Felder (`bpm:`, `key:`) als `null`. Zod's
 * `.optional()` akzeptiert nur `undefined`; ohne Stripping würde
 * jeder Song mit leerem Optional-Feld die Validierung sprengen.
 * Defaults (`.default(...)`) greifen ebenfalls erst bei `undefined`,
 * deshalb hier proaktiv null-Felder entfernen.
 */
function stripNullValues(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null) out[key] = value;
  }
  return out;
}

function parseSongFile(filepath: string, slug: string): Song {
  const raw = fs.readFileSync(filepath, "utf-8");
  const { data, content } = matter(raw);
  const cleaned = stripNullValues(data as Record<string, unknown>);
  const frontmatter = SongFrontmatterSchema.parse(cleaned);
  return { ...frontmatter, slug, content: content.trim() };
}

export function getAllSongs(): Song[] {
  if (cachedSongs) return cachedSongs;
  if (!fs.existsSync(songsDir)) {
    cachedSongs = [];
    return cachedSongs;
  }

  const songs = fs
    .readdirSync(songsDir)
    .filter((f) => f.endsWith(".cho"))
    .map((filename) => {
      const slug = fileToSlug(filename);
      return parseSongFile(path.join(songsDir, filename), slug);
    });

  cachedSongs = songs;
  for (const s of songs) cachedBySlug.set(s.slug, s);
  return cachedSongs;
}

export function getSongBySlug(slug: string): Song | null {
  if (cachedBySlug.has(slug)) return cachedBySlug.get(slug) ?? null;

  const filepath = path.join(songsDir, `${slug}.cho`);
  if (!fs.existsSync(filepath)) return null;
  const song = parseSongFile(filepath, slug);
  cachedBySlug.set(slug, song);
  return song;
}
