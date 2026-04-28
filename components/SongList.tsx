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

const STATUS_BADGE_CLASS: Record<Song["status"], string> = {
  "lernen-aktuell": "badge-lernen",
  "kann-ich": "badge-kannich",
  archiv: "badge-archiv",
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
          className="w-full max-w-md px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm placeholder:text-[var(--text-faint)] focus:outline-none focus:border-[var(--teal)] focus:ring-2 focus:ring-[var(--teal-tint)] transition-colors"
        />
      </div>

      {/* Status tabs */}
      <div
        className="flex flex-wrap gap-2 mb-6"
        role="group"
        aria-label="Status-Filter"
      >
        {(
          [
            ["all", `Alle (${songs.length})`],
            ["lernen-aktuell", `Lernen (${counts["lernen-aktuell"]})`],
            ["kann-ich", `Kann ich (${counts["kann-ich"]})`],
            ["archiv", `Archiv (${counts.archiv})`],
          ] as const
        ).map(([value, label]) => {
          const active = statusFilter === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              aria-pressed={active}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                active
                  ? "bg-[var(--teal-tint)] border border-[var(--teal)] text-[var(--teal)] font-medium"
                  : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Song list */}
      {filtered.length === 0 ? (
        <p className="text-[var(--text-faint)] text-sm text-center py-12">
          Keine Songs gefunden.
        </p>
      ) : (
        <ul className="space-y-1">
          {filtered.map((song) => (
            <li key={song.slug}>
              <Link
                href={`/song/${song.slug}`}
                className="flex items-start gap-4 py-3 px-3 -mx-3 rounded-lg hover:bg-[var(--surface)] transition-colors group"
              >
                {/* Stars */}
                <span
                  className="text-amber-400 dark:text-amber-300 text-sm mt-0.5 shrink-0 w-20 tabular-nums tracking-tight"
                  aria-label={`${song.stars ?? 0} von 5 Sternen`}
                >
                  {song.stars
                    ? "★".repeat(song.stars) + "☆".repeat(5 - song.stars)
                    : "☆☆☆☆☆"}
                </span>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <span className="font-display text-lg font-medium text-[var(--text)] group-hover:text-[var(--teal)] transition-colors">
                    {song.title}
                  </span>
                  {song.artist && (
                    <span className="font-display italic text-[var(--text-muted)] text-sm ml-2">
                      {song.artist}
                    </span>
                  )}

                  {/* Chips — typ-spezifisch */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
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
                    {song.timeSig && song.timeSig !== "4/4" && (
                      <span className="text-xs font-mono tabular-nums px-1.5 py-0.5 rounded text-[var(--text-muted)] border border-[var(--border)] bg-[var(--surface)]">
                        {song.timeSig}
                      </span>
                    )}
                    {song.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 rounded-full text-[var(--text-faint)] border border-[var(--border)] bg-transparent tracking-wide"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status badge */}
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 mt-0.5 ${STATUS_BADGE_CLASS[song.status]}`}
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
