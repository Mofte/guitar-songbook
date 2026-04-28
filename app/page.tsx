import { getAllSongs } from "@/lib/songs";
import SongList from "@/components/SongList";

export default function Home() {
  const songs = getAllSongs();

  return (
    <div className="min-h-screen">
      <header className="border-b border-[var(--border)] py-5 px-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[var(--text)]">
            Gitarren-Songbook
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {songs.length} {songs.length === 1 ? "Song" : "Songs"}
          </p>
        </div>
        <a
          href="/import"
          className="text-sm text-[var(--teal)] hover:opacity-80 transition-opacity shrink-0"
        >
          + Importer
        </a>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <SongList songs={songs} />
      </main>
    </div>
  );
}
