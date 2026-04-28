import { describe, it, expect } from "vitest";
import {
  parseChord,
  germanToEnglish,
  englishToGerman,
  normalizeChord,
  transposeEnglish,
  transposeGerman,
} from "./notation";

describe("parseChord", () => {
  it("zerlegt einen einfachen Dur-Akkord", () => {
    expect(parseChord("C")).toEqual({
      root: "C",
      accidental: "",
      suffix: "",
      bass: undefined,
    });
  });

  it("zerlegt einen Moll-Akkord (großgeschrieben)", () => {
    expect(parseChord("Am")).toEqual({
      root: "A",
      accidental: "",
      suffix: "m",
      bass: undefined,
    });
  });

  it("interpretiert kleingeschriebenen Grundton als Moll", () => {
    expect(parseChord("am")).toEqual({
      root: "A",
      accidental: "",
      suffix: "m",
      bass: undefined,
    });
  });

  it("dupliziert kein m wenn Kleinbuchstabe + m kombiniert sind", () => {
    expect(parseChord("am").suffix).toBe("m");
  });

  it("erkennt Vorzeichen # und b", () => {
    expect(parseChord("C#").accidental).toBe("#");
    expect(parseChord("Eb").accidental).toBe("b");
  });

  it("trennt b5/m7b5-Suffix vom Grundton-Vorzeichen", () => {
    expect(parseChord("Hm7b5")).toEqual({
      root: "H",
      accidental: "",
      suffix: "m7b5",
      bass: undefined,
    });
  });

  it("zerlegt Slash-Akkorde", () => {
    expect(parseChord("D/F#")).toEqual({
      root: "D",
      accidental: "",
      suffix: "",
      bass: { root: "F", accidental: "#" },
    });
  });

  it("zerlegt Slash-Akkorde mit deutschem H als Bass", () => {
    expect(parseChord("D/H")).toEqual({
      root: "D",
      accidental: "",
      suffix: "",
      bass: { root: "H", accidental: "" },
    });
  });
});

describe("germanToEnglish", () => {
  it("H → B", () => {
    expect(germanToEnglish("H")).toBe("B");
  });

  it("Hm → Bm", () => {
    expect(germanToEnglish("Hm")).toBe("Bm");
  });

  it("H7 → B7", () => {
    expect(germanToEnglish("H7")).toBe("B7");
  });

  it("Hmaj7 → Bmaj7", () => {
    expect(germanToEnglish("Hmaj7")).toBe("Bmaj7");
  });

  it("Hm7b5 → Bm7b5 (b5-Suffix bleibt erhalten)", () => {
    expect(germanToEnglish("Hm7b5")).toBe("Bm7b5");
  });

  it("B → Bb", () => {
    expect(germanToEnglish("B")).toBe("Bb");
  });

  it("Bm → Bbm", () => {
    expect(germanToEnglish("Bm")).toBe("Bbm");
  });

  it("B7 → Bb7", () => {
    expect(germanToEnglish("B7")).toBe("Bb7");
  });

  it("am → Am (Kleinbuchstaben-Moll wird normalisiert)", () => {
    expect(germanToEnglish("am")).toBe("Am");
  });

  it("hm → Bm (Kleinbuchstabe + H-Konvertierung)", () => {
    expect(germanToEnglish("hm")).toBe("Bm");
  });

  it("D/H → D/B (Slash mit H im Bass)", () => {
    expect(germanToEnglish("D/H")).toBe("D/B");
  });

  it("H/F# → B/F#", () => {
    expect(germanToEnglish("H/F#")).toBe("B/F#");
  });

  it("C, D, E, F, G bleiben unverändert", () => {
    expect(germanToEnglish("C")).toBe("C");
    expect(germanToEnglish("D")).toBe("D");
    expect(germanToEnglish("Em")).toBe("Em");
    expect(germanToEnglish("F#m7")).toBe("F#m7");
    expect(germanToEnglish("G")).toBe("G");
  });

  it("Eb bleibt Eb (kein H/B-Konflikt)", () => {
    expect(germanToEnglish("Eb")).toBe("Eb");
  });
});

describe("englishToGerman", () => {
  it("B → H", () => {
    expect(englishToGerman("B")).toBe("H");
  });

  it("Bm → Hm", () => {
    expect(englishToGerman("Bm")).toBe("Hm");
  });

  it("B7 → H7", () => {
    expect(englishToGerman("B7")).toBe("H7");
  });

  it("Bm7b5 → Hm7b5", () => {
    expect(englishToGerman("Bm7b5")).toBe("Hm7b5");
  });

  it("Bb → B (englisch Bb wird deutsches B)", () => {
    expect(englishToGerman("Bb")).toBe("B");
  });

  it("Bbm → Bm", () => {
    expect(englishToGerman("Bbm")).toBe("Bm");
  });

  it("Am → Am (bleibt)", () => {
    expect(englishToGerman("Am")).toBe("Am");
  });

  it("D/B → D/H", () => {
    expect(englishToGerman("D/B")).toBe("D/H");
  });

  it("B/F# → H/F#", () => {
    expect(englishToGerman("B/F#")).toBe("H/F#");
  });

  it("C, D, E, F, G bleiben unverändert", () => {
    expect(englishToGerman("C")).toBe("C");
    expect(englishToGerman("F#m7")).toBe("F#m7");
  });
});

describe("normalizeChord", () => {
  it("am → Am", () => {
    expect(normalizeChord("am")).toBe("Am");
  });

  it("hm → Hm (kein dt./engl.-Konvertierung, nur Casing)", () => {
    expect(normalizeChord("hm")).toBe("Hm");
  });

  it("D7 bleibt D7", () => {
    expect(normalizeChord("D7")).toBe("D7");
  });

  it("d → Dm (Kleinbuchstabe ohne m wird zu Moll)", () => {
    expect(normalizeChord("d")).toBe("Dm");
  });
});

describe("Idempotenz: dt ↔ engl roundtrip", () => {
  const germanCases = [
    "H",
    "Hm",
    "H7",
    "Hmaj7",
    "Hm7b5",
    "B",
    "Bm",
    "B7",
    "C",
    "Cm",
    "C#",
    "C#m7",
    "Eb",
    "F#",
    "G",
    "Gm",
    "Am",
    "D/H",
    "H/F#",
    "G/H",
  ];

  germanCases.forEach((dt) => {
    it(`dt → engl → dt: ${dt}`, () => {
      const back = englishToGerman(germanToEnglish(dt));
      expect(back).toBe(normalizeChord(dt));
    });
  });

  const englishCases = [
    "B",
    "Bm",
    "Bb",
    "Bbm",
    "C",
    "C#m7",
    "D/B",
    "F#",
    "Eb",
    "Am",
    "Em",
  ];

  englishCases.forEach((en) => {
    it(`engl → dt → engl: ${en}`, () => {
      const back = germanToEnglish(englishToGerman(en));
      expect(back).toBe(normalizeChord(en));
    });
  });
});

describe("transposeEnglish", () => {
  it("C +2 = D", () => {
    expect(transposeEnglish("C", 2)).toBe("D");
  });

  it("C +1 = C# (sharp default)", () => {
    expect(transposeEnglish("C", 1)).toBe("C#");
  });

  it("C +1 = Db (preferFlat)", () => {
    expect(transposeEnglish("C", 1, true)).toBe("Db");
  });

  it("D -2 = C", () => {
    expect(transposeEnglish("D", -2)).toBe("C");
  });

  it("Suffix bleibt: Cm7 +2 = Dm7", () => {
    expect(transposeEnglish("Cm7", 2)).toBe("Dm7");
  });

  it("Slash transponiert: D/F# +2 = E/G#", () => {
    expect(transposeEnglish("D/F#", 2)).toBe("E/G#");
  });

  it("B +1 = C", () => {
    expect(transposeEnglish("B", 1)).toBe("C");
  });

  it("Wrap-around: B +12 = B", () => {
    expect(transposeEnglish("B", 12)).toBe("B");
  });

  it("Negative Wrap-around: C -1 = B", () => {
    expect(transposeEnglish("C", -1)).toBe("B");
  });
});

describe("transposeGerman", () => {
  it("H +1 = C", () => {
    expect(transposeGerman("H", 1)).toBe("C");
  });

  it("H +2 = C# (kein Spezial-Mapping nötig)", () => {
    expect(transposeGerman("H", 2)).toBe("C#");
  });

  it("Hm +5 = Em", () => {
    expect(transposeGerman("Hm", 5)).toBe("Em");
  });

  it("B +1 = H (dt. B → engl. Bb +1 = engl. B → dt. H)", () => {
    expect(transposeGerman("B", 1)).toBe("H");
  });

  it("am +2 = Hm", () => {
    expect(transposeGerman("am", 2)).toBe("Hm");
  });

  it("Slash dt: D/H +2 = E/C# (Bass auch transponiert)", () => {
    expect(transposeGerman("D/H", 2)).toBe("E/C#");
  });

  it("Property: transposeGerman(x, 0) === normalizeChord(x) für dt. Cases", () => {
    const cases = ["H", "Hm", "B", "Bm", "C", "Am", "D/H", "F#m7"];
    for (const c of cases) {
      expect(transposeGerman(c, 0)).toBe(normalizeChord(c));
    }
  });

  it("Property: 12 Halbtöne hoch und runter ergibt Original", () => {
    const cases = ["H", "Hm", "B", "Bm7b5", "C", "Am", "D/H"];
    for (const c of cases) {
      expect(transposeGerman(transposeGerman(c, 12), -12)).toBe(
        normalizeChord(c),
      );
    }
  });
});
