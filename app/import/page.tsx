import ImportTool from "@/components/ImportTool";

export default function ImportPage() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-[var(--border)] px-6 py-3">
        <a
          href="/"
          className="text-[var(--teal)] hover:opacity-80 transition-opacity text-sm"
        >
          ← Songbook
        </a>
      </nav>
      <main className="max-w-6xl mx-auto px-6 py-6">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--text)]">
            UG-Importer
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Ultimate-Guitar-Paste in ChordPro mit deutscher Notation umwandeln.
          </p>
        </header>
        <ImportTool />
      </main>
    </div>
  );
}
