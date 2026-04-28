"use client";

import type { Song } from "@/lib/schema";

type Props = {
  song: Song;
  chordHtml: string;
};

export default function SongView({ song, chordHtml }: Props) {
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
            <span className="text-amber-500">
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
      </header>

      <div
        className="chord-sheet"
        dangerouslySetInnerHTML={{ __html: chordHtml }}
      />
    </article>
  );
}
