import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { SongFrontmatterSchema, type Song } from "./schema";

const songsDir = path.join(process.cwd(), "songs");

function fileToSlug(filename: string): string {
  return filename.replace(/\.cho$/, "");
}

function parseSongFile(filepath: string, slug: string): Song {
  const raw = fs.readFileSync(filepath, "utf-8");
  const { data, content } = matter(raw);
  const frontmatter = SongFrontmatterSchema.parse(data);
  return { ...frontmatter, slug, content: content.trim() };
}

export function getAllSongs(): Song[] {
  if (!fs.existsSync(songsDir)) return [];

  return fs
    .readdirSync(songsDir)
    .filter((f) => f.endsWith(".cho"))
    .map((filename) => {
      const slug = fileToSlug(filename);
      return parseSongFile(path.join(songsDir, filename), slug);
    });
}

export function getSongBySlug(slug: string): Song | null {
  const filepath = path.join(songsDir, `${slug}.cho`);
  if (!fs.existsSync(filepath)) return null;
  return parseSongFile(filepath, slug);
}
