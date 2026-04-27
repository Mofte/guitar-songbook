export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <header className="border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gitarren-Songbook
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
          Persönliches Songbook zum Gitarrelernen
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Songs werden hier angezeigt...
          </p>
        </div>
      </main>
    </div>
  );
}
