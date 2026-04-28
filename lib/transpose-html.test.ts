import { describe, it, expect } from "vitest";
import { transposeChordHtml } from "./transpose-html";

describe("transposeChordHtml", () => {
  it("0 Halbtöne → unverändert", () => {
    const html = '<div class="chord">Am</div>';
    expect(transposeChordHtml(html, 0)).toBe(html);
  });

  it("transponiert einzelnen Akkord", () => {
    const html = '<div class="chord">Am</div>';
    expect(transposeChordHtml(html, 2)).toBe('<div class="chord">Hm</div>');
  });

  it("transponiert mehrere Akkorde inkl. Slash und H/B", () => {
    const html =
      '<div class="chord">H</div><div class="lyrics">Hallo</div><div class="chord">D/F#</div>';
    expect(transposeChordHtml(html, 1)).toBe(
      '<div class="chord">C</div><div class="lyrics">Hallo</div><div class="chord">D#/G</div>',
    );
  });

  it("ignoriert leere chord-Divs", () => {
    const html = '<div class="chord"></div><div class="chord">C</div>';
    expect(transposeChordHtml(html, 2)).toBe(
      '<div class="chord"></div><div class="chord">D</div>',
    );
  });

  it("ignoriert ungültige Akkorde gracefully", () => {
    const html = '<div class="chord">??</div>';
    expect(transposeChordHtml(html, 2)).toBe(html);
  });
});
