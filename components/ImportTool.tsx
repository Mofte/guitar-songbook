"use client";

import { useState, useMemo } from "react";
import { convertUgToChordPro, detectNotation } from "@/lib/ug-import";

const FRONTMATTER_TEMPLATE = `---
title:
artist:
bpm:
timeSig: 4/4
capo: 0
status: lernen-aktuell
stars: 3
tags: []
key:
---

`;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function ImportTool() {
  const [input, setInput] = useState("");
  const [filename, setFilename] = useState("");
  const [copied, setCopied] = useState(false);

  const { output, notation, hasContent } = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      return { output: "", notation: null as null | "de" | "en", hasContent: false };
    }
    return {
      output: convertUgToChordPro(input),
      notation: detectNotation(input),
      hasContent: true,
    };
  }, [input]);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard-API blockiert (z.B. unsicherer Kontext) → still ignore
    }
  };

  const handleDownload = () => {
    if (!output) return;
    const slug = (filename.trim() ? slugify(filename) : "song") || "song";
    const content = FRONTMATTER_TEMPLATE + output + "\n";
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.cho`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setInput("");
    setFilename("");
  };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="ug-input"
              className="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              UG-Paste
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {input.length} Zeichen
            </span>
          </div>
          <textarea
            id="ug-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"[Verse 1]\nC       G       Am\nHello   world   today"}
            spellCheck={false}
            className="w-full h-[60vh] p-3 font-mono text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Output */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="cp-output"
              className="text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              ChordPro
            </label>
            {notation && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                  notation === "de"
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                }`}
                title={notation === "de" ? "Deutsche Notation erkannt" : "Englische Notation erkannt → wird zu Deutsch konvertiert"}
              >
                erkannt: {notation === "de" ? "deutsch" : "englisch → dt."}
              </span>
            )}
          </div>
          <textarea
            id="cp-output"
            value={output}
            readOnly
            placeholder="Konvertiertes ChordPro erscheint hier …"
            className="w-full h-[60vh] p-3 font-mono text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="dateiname (slug)"
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Dateiname"
        />
        <button
          type="button"
          onClick={handleDownload}
          disabled={!hasContent}
          className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white transition-colors"
        >
          ↓ Download .cho
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!hasContent}
          className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 dark:text-gray-200 transition-colors"
        >
          {copied ? "✓ Kopiert" : "📋 Kopieren"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasContent}
          className="px-3 py-1.5 text-sm rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ↺ Reset
        </button>
      </div>

      {/* Hinweise */}
      <details className="mt-6 text-sm text-gray-600 dark:text-gray-400">
        <summary className="cursor-pointer font-semibold">
          Hinweise zum Importer
        </summary>
        <ul className="mt-2 ml-4 list-disc space-y-1 text-xs">
          <li>
            Akkord-Zeile direkt über Lyric-Zeile (UG-Standard) wird automatisch
            zusammengeführt — Spaltenposition wird respektiert.
          </li>
          <li>
            Section-Header wie <code>[Verse 1]</code> oder <code>[Chorus]</code>{" "}
            bleiben erhalten und werden vom Renderer als Sektion gestylt.
          </li>
          <li>
            Englische Notation (mit <code>Bb</code>) wird automatisch in
            deutsche Notation konvertiert (<code>B → H</code>,{" "}
            <code>Bb → B</code>).
          </li>
          <li>
            Pure Akkord-Zeilen ohne Folgezeile werden zu{" "}
            <code>[C] [G] [Am]</code>-Form.
          </li>
          <li>
            Der Download enthält ein Frontmatter-Template — Felder bitte vor
            dem Speichern in <code>songs/</code> ausfüllen.
          </li>
        </ul>
      </details>
    </div>
  );
}
