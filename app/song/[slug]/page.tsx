import { notFound } from "next/navigation";
import { getSongBySlug } from "@/lib/songs";
import { renderChordPro } from "@/lib/renderer";
import SongView from "@/components/SongView";

type Params = Promise<{ slug: string }>;

export default async function SongPage(props: { params: Params }) {
  const { slug } = await props.params;
  const song = getSongBySlug(slug);

  if (!song) notFound();

  const chordHtml = renderChordPro(song.content);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <nav className="border-b border-gray-200 dark:border-gray-800 px-6 py-3">
        <a
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          ← Alle Songs
        </a>
      </nav>
      <SongView song={song} chordHtml={chordHtml} />
    </div>
  );
}
