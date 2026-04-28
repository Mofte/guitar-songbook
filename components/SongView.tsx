"use client";

import { useState, useMemo, useEffect } from "react";
import type { Song } from "@/lib/schema";
import { transposeChordHtml } from "@/lib/transpose-html";

type Props = {
  song: Song;
  chordHtml: string;
};

const STORAGE_PREFIX = "songbook:settings:";

export default function SongView({ song, chordHtml }: Props) {
  const [transpose, setTranspose] = useState(0);

  const storageKey = `${STORAGE_PREFIX}${song.slug}`;

  // Load from localStorage on mount
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

  // Persist on change
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

  const transposeLabel =
    transpose === 0
      ? "±0"
      : transpose > 0
        ? `+${transpose}`
        : `${transpose}`;

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
      </header>

      <div
        className="chord-sheet"
        dangerouslySetInnerHTML={{ __html: transposedHtml }}
      />
    </article>
  );
}
