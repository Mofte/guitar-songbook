import { describe, it, expect } from "vitest";
import { convertUgToChordPro, detectNotation } from "./ug-import";

describe("detectNotation", () => {
  it("erkennt deutsch via H", () => {
    expect(detectNotation("H Hm H7 C D")).toBe("de");
  });

  it("erkennt englisch via Bb", () => {
    expect(detectNotation("Bb F C Gm")).toBe("en");
  });

  it("erkennt deutsch via lowercase moll", () => {
    expect(detectNotation("am dm em G C")).toBe("de");
  });

  it("default englisch wenn ambig", () => {
    expect(detectNotation("C G Am F")).toBe("en");
  });

  it("Bb gewinnt gegen schwache dt. Hinweise", () => {
    expect(detectNotation("Bb F C Bb F C")).toBe("en");
  });
});

describe("convertUgToChordPro — Basisfälle", () => {
  it("simpler Chord-über-Lyric Merge", () => {
    const input = ["C       G       Am", "Hello   world   today"].join("\n");
    const out = convertUgToChordPro(input);
    expect(out).toBe("[C]Hello   [G]world   [Am]today");
  });

  it("Section-Header bleiben erhalten", () => {
    const input = [
      "[Verse 1]",
      "C       G",
      "Hello   world",
      "",
      "[Chorus]",
      "Am      F",
      "Goodbye there",
    ].join("\n");
    const out = convertUgToChordPro(input);
    expect(out).toContain("[Verse 1]");
    expect(out).toContain("[Chorus]");
    expect(out).toContain("[C]Hello   [G]world");
    expect(out).toContain("[Am]Goodbye [F]there");
  });

  it("Akkord über Wortmitte", () => {
    const input = ["    Am  G", "Walking down"].join("\n");
    const out = convertUgToChordPro(input);
    expect(out).toBe("Walk[Am]ing [G]down");
  });

  it("Akkord-Position über Lyric-Ende → angehängt mit Padding", () => {
    const input = ["          G", "Short"].join("\n");
    const out = convertUgToChordPro(input);
    expect(out).toBe("Short     [G]");
  });
});

describe("convertUgToChordPro — Pure Chord Lines", () => {
  it("Chord-Zeile ohne folgende Lyrics → Standalone", () => {
    const input = ["G  D  Em  C", "", "[Verse]", "C       G", "Hello   world"].join(
      "\n",
    );
    const out = convertUgToChordPro(input);
    expect(out).toContain("[G] [D] [Em] [C]");
  });

  it("Wiederholungs-Marker (x2) wird angehängt", () => {
    const input = ["G  D  Em  C  (x2)", "", "Hier kommt nichts"].join("\n");
    const out = convertUgToChordPro(input);
    expect(out).toContain("[G] [D] [Em] [C] (x2)");
  });
});

describe("convertUgToChordPro — Notation", () => {
  it("englischer Input wird zu deutsch konvertiert (B → H)", () => {
    const input = ["Bb       B", "Hello    world"].join("\n");
    const out = convertUgToChordPro(input);
    // Bb → B (dt.), B → H (dt.)
    expect(out).toBe("[B]Hello    [H]world");
  });

  it("deutscher Input bleibt deutsch", () => {
    const input = ["H       Hm", "Hello   world"].join("\n");
    const out = convertUgToChordPro(input);
    expect(out).toBe("[H]Hello   [Hm]world");
  });

  it("Slash-Chords werden korrekt konvertiert", () => {
    const input = ["D/F#    C/G", "Hello   world"].join("\n");
    const out = convertUgToChordPro(input);
    expect(out).toBe("[D/F#]Hello   [C/G]world");
  });
});

describe("convertUgToChordPro — Edge Cases", () => {
  it("leere Eingabe", () => {
    expect(convertUgToChordPro("")).toBe("");
  });

  it("nur Lyrics (keine Akkord-Zeilen)", () => {
    const input = ["First line", "Second line"].join("\n");
    expect(convertUgToChordPro(input)).toBe("First line\nSecond line");
  });

  it("Tabs werden zu Spaces normalisiert", () => {
    const input = ["C\t\tG", "Hello\t\tworld"].join("\n");
    const out = convertUgToChordPro(input);
    // Tab = 4 Spaces, C an col 0, G an col 9 (nach C + 8 Spaces)
    expect(out).toMatch(/^\[C\]Hello\s+\[G\]\s+world$/);
  });

  it("CRLF-Zeilenenden werden normalisiert", () => {
    const input = "C       G\r\nHello   world";
    const out = convertUgToChordPro(input);
    expect(out).toBe("[C]Hello   [G]world");
  });

  it("Doppelte Leerzeilen werden auf eine reduziert", () => {
    const input = ["[Verse]", "", "", "", "C", "Hello"].join("\n");
    const out = convertUgToChordPro(input);
    expect(out).toBe("[Verse]\n\n[C]Hello");
  });

  it("Bindestriche zwischen Akkorden", () => {
    const input = ["Am - G - C", "", "next stuff"].join("\n");
    const out = convertUgToChordPro(input);
    expect(out).toContain("[Am] [G] [C]");
  });
});

describe("convertUgToChordPro — realer UG-Paste", () => {
  it("Wonderwall-Style Paste", () => {
    const input = [
      "[Verse 1]",
      "Em7              G",
      "Today is gonna be the day",
      "Dsus4                       A7sus4",
      "That they're gonna throw it back to you",
      "",
      "[Chorus]",
      "C        D       Em7",
      "And all the roads we have to walk are winding",
    ].join("\n");

    const out = convertUgToChordPro(input);
    expect(out).toContain("[Verse 1]");
    // Em7 an col 0, G an col 17 (Em7 + 14 Spaces). Col 17 = Space zwischen
    // "be" und "the". Algorithmus fügt [G] genau dort ein.
    expect(out).toContain("[Em7]Today is gonna be[G] the day");
    expect(out).toContain("[Chorus]");
    // C(0), D(9), Em7(17) — D landet auf 'h' von "the", Em7 auf Space vor "we"
    expect(out).toContain("[C]And all t[D]he roads[Em7] we");
  });
});
