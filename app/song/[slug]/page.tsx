type Params = Promise<{ slug: string }>;

export default async function SongPage(props: { params: Params }) {
  const { slug } = await props.params;

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <header className="border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <a
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm mb-4 inline-block"
        >
          ← Zurück
        </a>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Song: {slug}
        </h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Song-Renderer kommt in Phase 3...
          </p>
        </div>
      </main>
    </div>
  );
}
