import { getAllSongs } from "@/lib/songs";
import SongList from "@/components/SongList";

export default function Home() {
  const songs = getAllSongs();

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <header className="border-b border-gray-200 dark:border-gray-800 py-4 px-6 flex items-baseline justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gitarren-Songbook
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            {songs.length} {songs.length === 1 ? "Song" : "Songs"}
          </p>
        </div>
        <a
          href="/import"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline shrink-0"
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
