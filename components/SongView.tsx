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
          x: rect.left + rect.width / 2,
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
                x: rect.left + rect.width / 2,
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
      <header className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {song.title}
        </h1>
        {song.artist && (
          <p className="text-gray-500 dark:text-gray-400 mt-1">{song.artist}</p>
        )}

        <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-600 dark:text-gray-400">
          {song.capo > 0 && (
            <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
              Capo {song.capo}
            </span>
          )}
          {song.bpm && (
            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              {song.bpm} BPM
            </span>
          )}
          {song.timeSig && (
            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              {song.timeSig}
            </span>
          )}
          {song.key && (
            <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              {song.key}
            </span>
          )}
          {song.stars && (
            <span className="text-amber-500" aria-label={`${song.stars} Sterne`}>
              {"★".repeat(song.stars)}
              {"☆".repeat(5 - song.stars)}
            </span>
          )}
        </div>

        {song.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {song.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-4 print:hidden">
          <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mr-1">
            Transpose
          </span>
          <button
            type="button"
            onClick={() => setTranspose((t) => t - 1)}
            className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-mono"
            aria-label="Einen Halbton tiefer"
          >
            −
          </button>
          <span
            className={`min-w-[3.5rem] text-center font-mono text-sm tabular-nums ${
              transpose === 0
                ? "text-gray-500 dark:text-gray-400"
                : "text-blue-600 dark:text-blue-400 font-bold"
            }`}
          >
            {transposeLabel}
          </span>
          <button
            type="button"
            onClick={() => setTranspose((t) => t + 1)}
            className="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-mono"
            aria-label="Einen Halbton höher"
          >
            +
          </button>
          {transpose !== 0 && (
            <button
              type="button"
              onClick={() => setTranspose(0)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-2"
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
            className={`px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${
              autoscrollOn
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
            aria-label={autoscrollOn ? "Autoscroll stoppen" : "Autoscroll starten"}
          >
            {autoscrollOn ? "⏸ Scroll" : "⏬ Scroll"}
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setScrollPxPerBeat((p) => Math.max(1, p - 1))}
              className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-mono text-gray-800 dark:text-gray-200"
              aria-label="Langsamer scrollen"
            >
              −
            </button>
            <span className="text-xs font-mono w-16 text-center tabular-nums text-gray-600 dark:text-gray-400">
              {scrollPxPerBeat} px/♩
            </span>
            <button
              type="button"
              onClick={() => setScrollPxPerBeat((p) => Math.min(40, p + 1))}
              className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-mono text-gray-800 dark:text-gray-200"
              aria-label="Schneller scrollen"
            >
              +
            </button>
          </div>

          <span className="text-xs text-gray-400 dark:text-gray-500">
            Leertaste
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
