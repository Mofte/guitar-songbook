# Gitarren-Songbook

Persönliches Songbook zum Gitarrenlernen — kuratiert, deutschsprachig
notiert, mit Akkord-Griffbildern, Metronom, Transpose, Autoscroll und
UG-Importer. Statisch deploybar auf Vercel oder einem beliebigen
Static-Host.

Songs werden als ChordPro-Dateien (`.cho` mit YAML-Frontmatter) im
Repo gepflegt. Beim Build erzeugt Next.js für jeden Song eine
vorab gerenderte Seite.

## Features

- **Song-Anzeige** — `chordsheetjs` rendert Akkorde spaltentreu über
  den Lyrics; Sektionen (Verse/Chorus/Bridge) bekommen farbige Labels.
- **Deutsche Notation** — `H` und `B` (statt `B`/`Bb`), kleinbuchstaben-Moll
  zugelassen. Bidirektionales Mapping de↔en mit Idempotenz-Tests.
- **Transpose** — ±12 Halbtöne, deutsche Notation bleibt deutsch (Pipeline
  `dt → engl → transponieren → engl → dt`, `preferFlat` aus Original-Akkord
  abgeleitet). Pro Song persistiert in `localStorage`.
- **Akkord-Diagramme** — `svguitar` rendert SVG-Griffbilder, sowohl als
  Hover-/Tap-Tooltip in der Chord-Sheet als auch im aufklappbaren
  Übersichts-Panel oberhalb des Songtexts.
- **Metronom** — Web-Audio-Lookahead-Scheduler nach Chris Wilson
  (25 ms Tick, 100 ms Lookahead, präzise an `audioContext.currentTime`),
  visuelle Beat-Anzeige, Tap-Tempo, Taktart 4/4 / 3/4 / 6/8.
- **Autoscroll** — `requestAnimationFrame`-Engine, Geschwindigkeit ist an
  die BPM gekoppelt (`bpm × px/beat ÷ 60`). Spacebar startet/stoppt.
  Auto-Stop am Seitenende.
- **UG-Importer** — fügt Ultimate-Guitar-Pastes spaltenweise zu
  ChordPro zusammen, erkennt en/de-Notation und konvertiert nach Bedarf.
  Liefert Frontmatter-Template beim Download mit.
- **Print-Optimierung** — A4, Akkorde schwarz, Sektionsumbruch
  vermeidend, Tags ausgeblendet, Akkord-Übersicht als kompaktes Grid
  am Seitenanfang.
- **Persistierte Settings** pro Song-Slug in `localStorage`:
  `transpose`, `scrollPxPerBeat`, Metronom-`bpm`/`timeSig`,
  Chord-Overview offen/zu.

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack-Build)
- **React 19**, **Tailwind CSS 4**
- **chordsheetjs** für ChordPro-Parsing und HTML-Rendering
- **svguitar** für Akkord-Griffbilder
- **gray-matter** für YAML-Frontmatter
- **zod** für Frontmatter-Validierung
- **vitest** für Unit-Tests
- **next/font/google** lädt Inter (UI), Lora (Display), Geist Mono (Akkorde)

## Schnellstart

```bash
npm install
npm run dev          # http://localhost:3000
npm run test         # 117 Tests
npm run build        # SSG-Build (alle Songs vorab)
npm run lint
```

## Songs hinzufügen

1. Datei `songs/<slug>.cho` anlegen (Slug wird URL-Pfad: `/song/<slug>`)
2. YAML-Frontmatter ausfüllen, dann ChordPro-Body:

```chordpro
---
title: Wonderwall
artist: Oasis
bpm: 87
timeSig: 4/4
capo: 2
status: lernen-aktuell    # lernen-aktuell | kann-ich | archiv
stars: 4                   # 1–5
tags: [Rock, Klassiker]
key: Em
---

[Verse]
[Em7]Today is gonna be the day
[Dsus4]That they're gonna throw it back to you

[Chorus]
[C]And all the [D]roads we have to [Em7]walk are winding
```

Felder validiert das Zod-Schema in `lib/schema.ts`. Erlaubte
Sektions-Marker (`[Verse]`, `[Chorus]`, `[Bridge]`, mit
optionaler Nummer) werden vom Renderer in ChordPro-Direktiven
übersetzt — normale `[Akkord]`-Notation bleibt unverändert.

Die Songliste auf `/` zeigt alle Songs gefiltert nach Status,
sortierbar via Suche.

## UG-Import

Auf `/import` einen Ultimate-Guitar-Paste einfügen. Heuristik:

- Akkordzeile direkt über Lyric-Zeile → spaltenweiser Merge
  (Akkord-Position in der Akkordzeile entspricht Spalten-Index in der
  Folgezeile; Insertion rückwärts, damit frühere Indizes stabil bleiben)
- Pure Akkordzeile ohne Folge-Lyrics → `[C] [G] [Am]`-Standalone
- Section-Header `[Verse 1]`, `[Chorus]` bleiben erhalten
- `N.C.`, `(x2)`, `|`, `-` werden als Marker erkannt, aber nicht in
  Klammern gesetzt
- Notations-Erkennung scoring-basiert: `H/Hm/H7` → +2 dt., `Bb*` → +2 engl.,
  lowercase `am/dm` → +1 dt.; Default englisch
- Englische Akkorde werden in deutsche umgesetzt (`B → H`, `Bb → B`)
  bevor sie ins Output gehen — das Songbook bleibt notations-konsistent

Download liefert die Datei mit Frontmatter-Template, das du in
`songs/` ablegst und ausfüllst.

## Akkord-Datenbank

Griffbilder liegen in `data/chords.json` im SVGuitarChord-Format:

```json
{
  "Em": {
    "fingers": [[1, 0], [2, 0], [3, 0], [4, 2], [5, 2], [6, 0]],
    "barres": [],
    "position": 1
  }
}
```

- **Saiten** 1 (high e) bis 6 (low E), Bünde relativ zur `position`
- `"x"` für nicht angeschlagene Saiten, `0` für leer
- `position` ist der Anfangsbund des Diagramm-Fensters
- Lookup über `lib/chords.ts:getChordDiagram(name)` — fällt von
  exakter Schreibweise auf normalisierte zurück; gibt `null` für
  unbekannte Akkorde

Beim Erweitern einfach den Akkord-Namen als Key ergänzen.

## Architektur

```
app/
  page.tsx              ← Songbook-Liste (Server Component)
  song/[slug]/page.tsx  ← Song-Anzeige; generateStaticParams für SSG
  import/page.tsx       ← UG-Importer
  layout.tsx            ← Lädt Geist + Inter + Lora via next/font
  globals.css           ← Design-Tokens (Surfaces/Akzente),
                          chord-sheet, kbd-Badges, Print

lib/
  schema.ts             ← Zod SongFrontmatterSchema
  songs.ts              ← getAllSongs / getSongBySlug, mit Modul-Cache
  notation.ts           ← parseChord, de↔en, transposeGerman
  renderer.ts           ← ChordPro → HTML (chordsheetjs, server-only)
  transpose-html.ts     ← Regex-basiertes Re-Mapping client-side
  metronome.ts          ← Web-Audio-Lookahead-Scheduler
  chords.ts             ← Diagramm-Lookup
  extract-chords.ts     ← Akkord-Liste aus gerendertem HTML
  ug-import.ts          ← UG-Paste → ChordPro mit Notations-Erkennung

components/
  SongView.tsx          ← Song-Anzeige mit Transpose, Tooltip,
                          Autoscroll, Spacebar-Listener,
                          Settings-Persistenz
  SongList.tsx          ← Suche, Status-Filter, Sortierung
  MetronomePanel.tsx    ← BPM/Tap/TimeSig/Start, eigenes Storage
  ChordOverview.tsx     ← Aufklapp-Panel mit Griffbildern
  ChordDiagram.tsx      ← SVGuitarChord-Wrapper
  ImportTool.tsx        ← UG-Paste/Preview/Download

data/
  chords.json           ← Griffbild-Datenbank

songs/
  *.cho                 ← Beispiel-Songs (Wonderwall, Stairway, …)
```

### Server vs. Client

- **Server**: `lib/songs.ts`, `lib/renderer.ts` (greift auf `fs` und
  `chordsheetjs` zu) — laufen nur im Build/SSR
- **Client**: alles unter `components/` plus `lib/notation.ts`,
  `lib/transpose-html.ts`, `lib/metronome.ts`, `lib/extract-chords.ts`,
  `lib/ug-import.ts`, `lib/chords.ts`
- ChordSheetJS bleibt aus Performance-Gründen außerhalb des
  Client-Bundles; Transpose passiert per Regex auf dem fertig
  gerenderten HTML

### Caching

`lib/songs.ts` hält ein Modul-Level-Cache (`cachedSongs: Song[] | null`,
`cachedBySlug: Map`). Bei statischem Build heißt das: `fs.readdirSync`
läuft nur einmal pro Build.

## Tastatur-Shortcuts

| Taste | Wirkung |
|---|---|
| Space | Autoscroll start/stop |

(Keine Shortcuts in Eingabefeldern — Listener prüft auf
`INPUT/TEXTAREA/SELECT`.)

## Design-System

Eigenes Token-System statt generischem „Next.js-Starter-Look":

- **Surfaces** warmes Holz-Schwarz (`#131110`/`#1c1a16`/`#25221d`),
  nie reines `#000`
- **Akzente** Amber für alles Akkord-bezogene (Chord-Text, Capo-Chip,
  Tap-Button, Beat-1-Dot, `chord-interactive`-Tint), Teal für UI-Aktionen
  (aktiver Filter, Taktart, Start, Autoscroll-on)
- **Status-Badges** je eigene Farbe: Lernen (amber), Kann ich (teal),
  Archiv (stone)
- **Typografie** Lora für Display/Headlines, Inter für UI/Body,
  Geist Mono für Akkorde und BPM
- **Sektions-Labels** mit 2px-Border-Left in eigener Farbe pro Typ
  (Verse: faint, Chorus: teal, Bridge: violett)
- **Touch-Targets** alle interaktiven Buttons ≥ 36×36px (Material
  Design Tap-Target-Guideline)
- **Print** A4, schwarze Akkorde, Sektionen umbruchsicher,
  Akkord-Overview als kompaktes Grid am Seitenanfang

Alle Farb-Tokens in `app/globals.css:root` und unter
`@media (prefers-color-scheme: dark)` definiert.

## Tests

```bash
npm run test         # einmalig (CI-Modus)
npm run test:watch   # Watch-Modus
```

Aktuell **117 Tests** in 4 Dateien:

- `lib/notation.test.ts` (84) — de↔en-Mapping, Transpose, Slash-Chords,
  Idempotenz-Tests, `preferFlat`-Verhalten
- `lib/transpose-html.test.ts` (5) — Regex-basierte Chord-Substitution
- `lib/ug-import.test.ts` (21) — Notations-Erkennung, Merge-Algorithmus,
  Tabs/CRLF-Normalisierung, Section-Header, realer UG-Paste
- `lib/extract-chords.test.ts` (7) — Reihenfolge des ersten Auftretens,
  Dedupe, Slash-Chords, Klassen-Reihenfolge

## Deployment auf Vercel

1. Repo verbinden, Default-Settings akzeptieren
2. Build-Command: `npm run build`
3. Output: `.next/` (Next.js-default)
4. `/song/[slug]` wird durch `generateStaticParams` für jeden Song
   vorab gerendert — kein Server-Compute zur Laufzeit

Lokal verifizieren:

```bash
npm run build
npm start
```

Der Build sollte ohne Warnings durchlaufen und die SSG-Seiten in der
Routen-Tabelle als `●` (SSG) listen.

## Lizenz

Privat. Songtexte/Akkorde sind Eigentum ihrer jeweiligen Rechte­inhaber
und nur zur persönlichen Lern­nutzung im Repo.
