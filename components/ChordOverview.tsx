"use client";

import { useState } from "react";
import { getChordDiagram } from "@/lib/chords";
import ChordDiagram from "./ChordDiagram";

const STORAGE_KEY = "songbook:chord-overview-open";

type Props = {
  /** Akkordnamen in Auftrittsreihenfolge (nach Transponierung). */
  chords: string[];
};

export default function ChordOverview({ chords }: Props) {
  // Persistiert offen/zu über Sessions hinweg, damit der User nicht
  // jedes Mal neu aufklappen muss, wenn er es einmal aufgemacht hat.
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const withDiagram = chords
    .map((c) => ({ name: c, data: getChordDiagram(c) }))
    .filter((x): x is { name: string; data: NonNullable<ReturnType<typeof getChordDiagram>> } =>
      x.data !== null,
    );

  if (withDiagram.length === 0) return null;

  return (
    <section
      className="chord-overview mb-6 border border-[var(--border)] rounded-lg overflow-hidden"
      aria-label="Akkord-Übersicht"
    >
      {/* Bildschirm: kollabierbarer Header */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="chord-overview-toggle w-full flex items-center justify-between gap-3 px-4 py-2.5 print:hidden"
      >
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          <span className="text-xs uppercase tracking-widest text-[var(--text-faint)] mr-1">
            Akkorde
          </span>
          {withDiagram.map((c) => (
            <span key={c.name} className="chip-chord-preview">
              {c.name}
            </span>
          ))}
        </div>
        <span
          aria-hidden="true"
          className="text-[var(--text-faint)] text-xs shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▾
        </span>
      </button>

      {/* Bildschirm: aufgeklapptes Grid */}
      {open && (
        <div className="chord-overview-grid px-4 py-3 border-t border-[var(--border)] print:hidden">
          {withDiagram.map((c) => (
            <div key={c.name} className="chord-overview-item">
              <ChordDiagram name={c.name} data={c.data} size={85} />
            </div>
          ))}
        </div>
      )}

      {/* Druck: immer aufgeklappt, kompakteres Grid (siehe @media print) */}
      <div className="hidden print:block">
        <div className="chord-overview-grid px-2 py-2">
          {withDiagram.map((c) => (
            <div key={c.name} className="chord-overview-item">
              <ChordDiagram name={c.name} data={c.data} size={70} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
