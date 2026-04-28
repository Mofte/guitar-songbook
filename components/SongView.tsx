"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import type { Song } from "@/lib/schema";
import { transposeChordHtml } from "@/lib/transpose-html";
import { getChordDiagram } from "@/lib/chords";
import ChordDiagram from "./ChordDiagram";
import MetronomePanel from "./MetronomePanel";

type Props = {
  song: Song;
  chordHtml: string;
};

type Tooltip = {
  chord: string;
  x: number;
  y: number;
};

const STORAGE_PREFIX = "songbook:settings:";

// Tooltip ist mit transform: translateX(-50%) zentriert; halbe Breite
// (Diagramm 110px + 2×8px Padding ≈ 63px) muss vom Viewport-Rand wegbleiben.
const TOOLTIP_HALF_WIDTH = 63;
const TOOLTIP_VIEWPORT_MARGIN = 8;

function clampTooltipX(rawX: number): number {
  if (typeof window === "undefined") return rawX;
  const min = TOOLTIP_HALF_WIDTH + TOOLTIP_VIEWPORT_MARGIN;
  const max = window.innerWidth - TOOLTIP_HALF_WIDTH - TOOLTIP_VIEWPORT_MARGIN;
  if (max < min) return rawX;
  return Math.min(Math.max(rawX, min), max);
}

export default function SongView({ song, chordHtml }: Props) {
  const [transpose, setTranspose] = useState(0);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Autoscroll
  const [autoscrollOn, setAutoscrollOn] = useState(false);
  const [scrollPxPerBeat, setScrollPxPerBeat] = useState(10);
  const metronomeBpmRef = useRef(song.bpm ?? 120);
  const scrollPxPerBeatRef = useRef(scrollPxPerBeat);
  const rafRef = useRef<number | null>(null);
  const lastRafTimeRef = useRef<number | null>(null);

  useEffect(() => {
    scrollPxPerBeatRef.current = scrollPxPerBeat;
  }, [scrollPxPerBeat]);

  const storageKey = `${STORAGE_PREFIX}${song.slug}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.transpose === "number") {
        setTranspose(data.transpose);
      }
    } catch {
      // corrupt entry → ignore
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ transpose }));
    } catch {
      // quota exceeded etc. → ignore
    }
  }, [storageKey, transpose]);

  const transposedHtml = useMemo(
    () => transposeChordHtml(chordHtml, transpose),
    [chordHtml, transpose],
  );

  // Attach hover/tap listeners to all .chord divs after each render
  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return;

    const chordDivs = el.querySelectorAll<HTMLDivElement>(".chord");
    const cleanups: Array<() => void> = [];

    chordDivs.forEach((div) => {
      const text = div.textContent?.trim() ?? "";
      if (!text || !getChordDiagram(text)) return;

      div.classList.add("chord-interactive");

      const show = () => {
        const rect = div.getBoundingClientRect();
        setTooltip({
          chord: text,
          x: clampTooltipX(rect.left + rect.width / 2),
          y: rect.bottom + 4,
        });
      };

      const hide = () => setTooltip(null);

      const toggle = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        const rect = div.getBoundingClientRect();
        setTooltip((prev) =>
          prev?.chord === text
            ? null
            : {
                chord: text,
                x: clampTooltipX(rect.left + rect.width / 2),
                y: rect.bottom + 4,
              },
        );
      };

      div.addEventListener("mouseenter", show);
      div.addEventListener("mouseleave", hide);
      div.addEventListener("click", toggle);

      cleanups.push(() => {
        div.classList.remove("chord-interactive");
        div.removeEventListener("mouseenter", show);
        div.removeEventListener("mouseleave", hide);
        div.removeEventListener("click", toggle);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [transposedHtml]);

  // Close tooltip when clicking outside
  useEffect(() => {
    if (!tooltip) return;
    const close = () => setTooltip(null);
    window.addEventListener("scroll", close, { passive: true });
    document.addEventListener("click", close);
    return () => {
      window.removeEventListener("scroll", close);
      document.removeEventListener("click", close);
    };
  }, [tooltip]);

  // rAF autoscroll loop — reads refs so speed/BPM changes take effect without restarting
  useEffect(() => {
    if (!autoscrollOn) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRafTimeRef.current = null;
      return;
    }

    const step = (timestamp: number) => {
      if (lastRafTimeRef.current !== null) {
        const dt = timestamp - lastRafTimeRef.current;
        const pxPerSec = (metronomeBpmRef.current * scrollPxPerBeatRef.current) / 60;
        window.scrollBy(0, (pxPerSec * dt) / 1000);

        const atBottom =
          window.scrollY + window.innerHeight >=
          document.documentElement.scrollHeight - 10;
        if (atBottom) {
          setAutoscrollOn(false);
          return;
        }
      }
      lastRafTimeRef.current = timestamp;
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastRafTimeRef.current = null;
    };
  }, [autoscrollOn]);

  // Spacebar toggles autoscroll; ignored when focus is in an editable field
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        setAutoscrollOn((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const transposeLabel =
    transpose === 0 ? "±0" : transpose > 0 ? `+${transpose}` : `${transpose}`;

  const tooltipData = tooltip ? getChordDiagram(tooltip.chord) : null;

  return (
    <article className="max-w-3xl mx-auto px-4 py-6">
      <header className="mb-6 border-b border-[var(--border)] pb-4">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)]">
          {song.title}
        </h1>
        {song.artist && (
          <p className="font-display italic text-[var(--text-muted)] text-lg mt-0.5">
            {song.artist}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-3 items-center">
          {song.capo > 0 && (
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{
                background: "var(--amber-tint)",
                color: "var(--amber-bright)",
                border: "1px solid var(--border)",
              }}
            >
              Capo {song.capo}
            </span>
          )}
          {song.key && (
            <span className="font-display italic text-sm text-[var(--text)] px-1.5 py-0 rounded border border-[var(--border)] bg-[var(--surface)]">
              {song.key}
            </span>
          )}
          {song.bpm && (
            <span className="text-xs font-mono tabular-nums px-1.5 py-0.5 rounded text-[var(--text-muted)] border border-[var(--border)] bg-[var(--surface)]">
              {song.bpm} BPM
            </span>
          )}
          {song.timeSig && (
            <span className="text-xs font-mono tabular-nums px-1.5 py-0.5 rounded text-[var(--text-muted)] border border-[var(--border)] bg-[var(--surface)]">
              {song.timeSig}
            </span>
          )}
          {song.stars && (
            <span
              className="text-amber-400 dark:text-amber-300 text-sm ml-1 tracking-tight"
              aria-label={`${song.stars} Sterne`}
            >
              {"★".repeat(song.stars)}
              {"☆".repeat(5 - song.stars)}
            </span>
          )}
        </div>

        {song.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {song.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full text-[var(--text-faint)] border border-[var(--border)] bg-transparent tracking-wide"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 print:hidden">
          <span className="text-xs uppercase tracking-wider text-[var(--text-faint)] mr-1">
            Transpose
          </span>
          <button
            type="button"
            onClick={() => setTranspose((t) => t - 1)}
            className="w-8 h-8 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] font-mono transition-colors"
            aria-label="Einen Halbton tiefer"
          >
            −
          </button>
          <span
            className={`min-w-[3.5rem] text-center font-mono text-sm tabular-nums ${
              transpose === 0
                ? "text-[var(--text-faint)]"
                : "text-[var(--amber-bright)] font-bold"
            }`}
          >
            {transposeLabel}
          </span>
          <button
            type="button"
            onClick={() => setTranspose((t) => t + 1)}
            className="w-8 h-8 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] font-mono transition-colors"
            aria-label="Einen Halbton höher"
          >
            +
          </button>
          {transpose !== 0 && (
            <button
              type="button"
              onClick={() => setTranspose(0)}
              className="text-xs text-[var(--text-faint)] hover:text-[var(--text)] px-2 transition-colors"
            >
              ↺ Reset
            </button>
          )}
        </div>

        <MetronomePanel
          slug={song.slug}
          initialBpm={song.bpm ?? 120}
          initialTimeSig={song.timeSig}
          onBpmChange={(bpm) => { metronomeBpmRef.current = bpm; }}
        />

        {/* Autoscroll */}
        <div className="print:hidden mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setAutoscrollOn((prev) => !prev)}
            aria-pressed={autoscrollOn}
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors border ${
              autoscrollOn
                ? "bg-[var(--teal-tint)] border-[var(--teal)] text-[var(--teal)]"
                : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
            }`}
            aria-label={autoscrollOn ? "Autoscroll stoppen" : "Autoscroll starten"}
          >
            {autoscrollOn ? "⏸ Scroll" : "⏬ Scroll"}
          </button>

          <div className="flex items-center gap-1">
            <span className="text-xs uppercase tracking-wider text-[var(--text-faint)] mr-1">
              Speed
            </span>
            <button
              type="button"
              onClick={() => setScrollPxPerBeat((p) => Math.max(1, p - 1))}
              className="w-6 h-6 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] font-mono transition-colors"
              aria-label="Langsamer scrollen"
            >
              −
            </button>
            <span className="text-xs font-mono w-8 text-center tabular-nums text-[var(--text-muted)]">
              {scrollPxPerBeat}
            </span>
            <button
              type="button"
              onClick={() => setScrollPxPerBeat((p) => Math.min(40, p + 1))}
              className="w-6 h-6 rounded bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[var(--text)] font-mono transition-colors"
              aria-label="Schneller scrollen"
            >
              +
            </button>
          </div>

          <span className="flex items-center gap-1.5 text-xs text-[var(--text-faint)]">
            <kbd className="shortcut">Space</kbd>
          </span>
        </div>
      </header>

      <div
        ref={sheetRef}
        className="chord-sheet"
        dangerouslySetInnerHTML={{ __html: transposedHtml }}
      />

      {tooltip && tooltipData && (
        <div
          role="tooltip"
          className="fixed z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 print:hidden"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
        >
          <ChordDiagram name={tooltip.chord} data={tooltipData} size={110} />
        </div>
      )}
    </article>
  );
}
