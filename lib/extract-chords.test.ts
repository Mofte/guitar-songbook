import { describe, it, expect } from "vitest";
import { extractUniqueChords } from "./extract-chords";

describe("extractUniqueChords", () => {
  it("extrahiert Akkorde aus chordsheetjs-Output in Auftrittsreihenfolge", () => {
    const html = `
      <div class="chord-sheet">
        <div class="row">
          <div class="column"><div class="chord">C</div><div class="lyrics">Hello </div></div>
          <div class="column"><div class="chord">G</div><div class="lyrics">world</div></div>
        </div>
        <div class="row">
          <div class="column"><div class="chord">Am</div><div class="lyrics">today</div></div>
          <div class="column"><div class="chord">C</div><div class="lyrics"> again</div></div>
        </div>
      </div>
    `;
    expect(extractUniqueChords(html)).toEqual(["C", "G", "Am"]);
  });

  it("filtert leere Akkord-Slots heraus", () => {
    const html = `
      <div class="row">
        <div class="column"><div class="chord">G</div><div class="lyrics">x</div></div>
        <div class="column"><div class="chord"></div><div class="lyrics">y</div></div>
        <div class="column"><div class="chord">D</div><div class="lyrics">z</div></div>
      </div>
    `;
    expect(extractUniqueChords(html)).toEqual(["G", "D"]);
  });

  it("dedupliziert wiederholte Akkorde", () => {
    const html = `
      <div class="chord">G</div>
      <div class="chord">D</div>
      <div class="chord">G</div>
      <div class="chord">D</div>
      <div class="chord">G</div>
    `;
    expect(extractUniqueChords(html)).toEqual(["G", "D"]);
  });

  it("kommt mit Slash-Chords zurecht", () => {
    const html = `
      <div class="chord">D/F#</div>
      <div class="chord">C/G</div>
      <div class="chord">D/F#</div>
    `;
    expect(extractUniqueChords(html)).toEqual(["D/F#", "C/G"]);
  });

  it("ignoriert <div class='chord-sheet'> (kein echter Akkord-Slot)", () => {
    const html = `<div class="chord-sheet"><div class="chord">Em</div></div>`;
    expect(extractUniqueChords(html)).toEqual(["Em"]);
  });

  it("leeres HTML → leeres Array", () => {
    expect(extractUniqueChords("")).toEqual([]);
    expect(extractUniqueChords("<p>kein chord</p>")).toEqual([]);
  });

  it("klassen-reihenfolge unabhängig (chord auch hinten)", () => {
    const html = `<div class="foo chord">G</div><div class="chord bar">D</div>`;
    expect(extractUniqueChords(html)).toEqual(["G", "D"]);
  });
});
