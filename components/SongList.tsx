"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Song } from "@/lib/schema";

type StatusFilter = "all" | "lernen-aktuell" | "kann-ich" | "archiv";

const STATUS_ORDER: Record<Song["status"], number> = {
  "lernen-aktuell": 0,
  "kann-ich": 1,
  archiv: 2,
};

const STATUS_LABEL: Record<Song["status"], string> = {
  "lernen-aktuell": "Lernen",
  "kann-ich": "Kann ich",
  archiv: "Archiv",
};

const STATUS_COLORS: Record<Song["status"], string> = {
  "lernen-aktuell":
    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "kann-ich":
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  archiv: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

type Props = { songs: Song[] };

export default function SongList({ songs }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const counts = useMemo(() => {
    const c = { "lernen-aktuell": 0, "kann-ich": 0, archiv: 0 };
    for (const s of songs) c[s.status]++;
    return c;
  }, [songs]);

  const filtered = useMemo(() => {
    let list = [...songs];

    if (statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist?.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    list.sort((a, b) => {
      const sd = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (sd !== 0) return sd;
      const starDiff = (b.stars ?? 0) - (a.stars ?? 0);
      if (starDiff !== 0) return starDiff;
      return a.title.localeCompare(b.title, "de");
    });

    return list;
  }, [songs, statusFilter, query]);

  return (
    <div>
      {/* Search */}
      <div className="mb-5">
        <input
          type="search"
          placeholder="Titel, Interpret oder Tag suchen …"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-md px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Status-Filter">
        {(
          [
            ["all", `Alle (${songs.length})`],
            ["lernen-aktuell", `Lernen (${counts["lernen-aktuell"]})`],
            ["kann-ich", `Kann ich (${counts["kann-ich"]})`],
            ["archiv", `Archiv (${counts.archiv})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setStatusFilter(value)}
            aria-pressed={statusFilter === value}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === value
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Song list */}
      {filtered.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-12">
          Keine Songs gefunden.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {filtered.map((song) => (
            <li key={song.slug}>
              <Link
                href={`/song/${song.slug}`}
                className="flex items-start gap-4 py-3.5 px-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group"
              >
                {/* Stars */}
                <span
                  className="text-amber-400 text-sm mt-0.5 shrink-0 w-20 tabular-nums"
                  aria-label={`${song.stars ?? 0} von 5 Sternen`}
                >
                  {song.stars ? "★".repeat(song.stars) + "☆".repeat(5 - song.stars) : "☆☆☆☆☆"}
                </span>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {song.title}
                  </span>
                  {song.artist && (
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                      {song.artist}
                    </span>
                  )}

                  {/* Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {song.capo > 0 && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300">
                        Capo {song.capo}
                      </span>
                    )}
                    {song.key && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {song.key}
                      </span>
                    )}
                    {song.bpm && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {song.bpm} BPM
                      </span>
                    )}
                    {song.timeSig && song.timeSig !== "4/4" && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {song.timeSig}
                      </span>
                    )}
                    {song.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status badge */}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${STATUS_COLORS[song.status]}`}
                >
                  {STATUS_LABEL[song.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
