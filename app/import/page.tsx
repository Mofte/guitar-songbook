import ImportTool from "@/components/ImportTool";

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <nav className="border-b border-gray-200 dark:border-gray-800 px-6 py-3">
        <a
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
        >
          ← Songbook
        </a>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            UG-Importer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Ultimate-Guitar-Paste in ChordPro mit deutscher Notation umwandeln.
          </p>
        </header>
        <ImportTool />
      </main>
    </div>
  );
}
