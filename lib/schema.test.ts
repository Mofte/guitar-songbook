import { describe, it, expect } from "vitest";
import matter from "gray-matter";
import { SongFrontmatterSchema } from "./schema";

/**
 * Reproduziert die Pipeline aus lib/songs.ts:parseSongFile, ohne
 * fs-Zugriff. Bestätigt, dass YAML-Frontmatter mit leeren
 * Optional-Feldern (gray-matter → null) durch das Strip+Schema-Setup
 * sauber läuft. Ohne Stripping würde Zod hier mit ZodError abbrechen
 * (genau das, was den Vercel-Build gekillt hat).
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

function parseFrontmatter(yaml: string) {
  const raw = `---\n${yaml}\n---\nbody`;
  const { data } = matter(raw);
  const cleaned = stripNullValues(data as Record<string, unknown>);
  return SongFrontmatterSchema.parse(cleaned);
}

describe("SongFrontmatterSchema", () => {
  it("akzeptiert leere Optional-Felder als null (YAML-default)", () => {
    const fm = parseFrontmatter(
      [
        "title: Test",
        "artist:",
        "bpm:",
        "stars:",
        "key:",
        "tags: []",
      ].join("\n"),
    );
    expect(fm.title).toBe("Test");
    expect(fm.artist).toBeUndefined();
    expect(fm.bpm).toBeUndefined();
    expect(fm.stars).toBeUndefined();
    expect(fm.key).toBeUndefined();
  });

  it("Felder mit Default greifen, wenn YAML-Wert null ist", () => {
    const fm = parseFrontmatter(
      ["title: Test", "timeSig:", "capo:", "status:", "tags:"].join("\n"),
    );
    expect(fm.timeSig).toBe("4/4");
    expect(fm.capo).toBe(0);
    expect(fm.status).toBe("lernen-aktuell");
    expect(fm.tags).toEqual([]);
  });

  it("vollständige Eingabe wird unverändert akzeptiert", () => {
    const fm = parseFrontmatter(
      [
        "title: Wonderwall",
        "artist: Oasis",
        "bpm: 87",
        "timeSig: 4/4",
        "capo: 2",
        "status: lernen-aktuell",
        "stars: 4",
        "tags: [Rock, Klassiker]",
        "key: Em",
      ].join("\n"),
    );
    expect(fm.title).toBe("Wonderwall");
    expect(fm.artist).toBe("Oasis");
    expect(fm.bpm).toBe(87);
    expect(fm.capo).toBe(2);
    expect(fm.stars).toBe(4);
    expect(fm.tags).toEqual(["Rock", "Klassiker"]);
    expect(fm.key).toBe("Em");
  });

  it("title bleibt required — fehlend → ZodError", () => {
    expect(() => parseFrontmatter("artist: Oasis")).toThrow();
  });

  it("ungültiger Status wird abgelehnt", () => {
    expect(() => parseFrontmatter("title: T\nstatus: erfunden")).toThrow();
  });

  it("stars außerhalb 1-5 wird abgelehnt", () => {
    expect(() => parseFrontmatter("title: T\nstars: 7")).toThrow();
  });
});
