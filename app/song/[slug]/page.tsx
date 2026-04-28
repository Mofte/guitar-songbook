import { notFound } from "next/navigation";
import { getAllSongs, getSongBySlug } from "@/lib/songs";
import { renderChordPro } from "@/lib/renderer";
import SongView from "@/components/SongView";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return getAllSongs().map((song) => ({ slug: song.slug }));
}

export default async function SongPage(props: { params: Params }) {
  const { slug } = await props.params;
  const song = getSongBySlug(slug);

  if (!song) notFound();

  const chordHtml = renderChordPro(song.content);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <nav className="border-b border-gray-200 dark:border-gray-800 px-6 py-3 print:hidden">
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
