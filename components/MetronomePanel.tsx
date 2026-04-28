"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Metronome } from "@/lib/metronome";

type TimeSig = "4/4" | "3/4" | "6/8";

const BEATS: Record<TimeSig, number> = { "4/4": 4, "3/4": 3, "6/8": 6 };
const STORAGE_PREFIX = "songbook:metronome:";

// Tap Tempo: Mittelwert über bis zu MAX_INTERVALS aufeinanderfolgende Taps;
// nach TAP_RESET_MS Pause wird die Sequenz verworfen.
const TAP_RESET_MS = 2000;
const MAX_INTERVALS = 4;

function clampBpm(n: number): number {
  return Math.max(20, Math.min(300, Math.round(n)));
}

function resolveTimeSig(ts: string): TimeSig {
  if (ts === "3/4" || ts === "6/8") return ts;
  return "4/4";
}

type Props = {
  slug?: string;
  initialBpm?: number;
  initialTimeSig?: string;
  onBpmChange?: (bpm: number) => void;
};

export default function MetronomePanel({
  slug,
  initialBpm = 120,
  initialTimeSig = "4/4",
  onBpmChange,
}: Props) {
  const metronomeRef = useRef<Metronome | null>(null);
  const tapTimesRef = useRef<number[]>([]);
  const [bpm, setBpm] = useState(() => clampBpm(initialBpm));
  const [timeSig, setTimeSig] = useState<TimeSig>(() =>
    resolveTimeSig(initialTimeSig),
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState<number | null>(null);
  const [tapHint, setTapHint] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  const storageKey = slug ? `${STORAGE_PREFIX}${slug}` : null;

  useEffect(() => {
    const m = new Metronome({ onBeat: (beat) => setActiveBeat(beat) });
    metronomeRef.current = m;
    return () => m.dispose();
  }, []);

  useEffect(() => {
    if (!storageKey) {
      hydratedRef.current = true;
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (typeof data.bpm === "number") setBpm(clampBpm(data.bpm));
        if (typeof data.timeSig === "string")
          setTimeSig(resolveTimeSig(data.timeSig));
      }
    } catch {
      // corrupt entry → ignore
    }
    hydratedRef.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !hydratedRef.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ bpm, timeSig }));
    } catch {
      // quota exceeded etc. → ignore
    }
  }, [storageKey, bpm, timeSig]);

  useEffect(() => {
    metronomeRef.current?.setBpm(bpm);
    onBpmChange?.(bpm);
  }, [bpm, onBpmChange]);

  useEffect(() => {
    metronomeRef.current?.setTimeSignature(BEATS[timeSig]);
  }, [timeSig]);

  const togglePlay = useCallback(() => {
    const m = metronomeRef.current;
    if (!m) return;
    if (m.isPlaying()) {
      m.stop();
      setIsPlaying(false);
      setActiveBeat(null);
    } else {
      m.start(bpm, BEATS[timeSig]);
      setIsPlaying(true);
    }
  }, [bpm, timeSig]);

  const adjustBpm = (delta: number) =>
    setBpm((prev) => clampBpm(prev + delta));

  const handleTap = () => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    const last = taps[taps.length - 1];

    if (last !== undefined && now - last > TAP_RESET_MS) {
      tapTimesRef.current = [now];
      setTapHint("Tap …");
      return;
    }

    taps.push(now);
    while (taps.length > MAX_INTERVALS + 1) taps.shift();

    if (taps.length >= 2) {
      const span = taps[taps.length - 1] - taps[0];
      const avgMs = span / (taps.length - 1);
      const computed = clampBpm(60000 / avgMs);
      setBpm(computed);
      setTapHint(`${taps.length - 1} Tap${taps.length - 1 === 1 ? "" : "s"}`);
    } else {
      setTapHint("Tap …");
    }
  };

  const beatCount = BEATS[timeSig];

  // Wiederverwendete Klassen
  const buttonBase =
    "rounded bg-[var(--surface-2)] hover:bg-[var(--surface-hover)] border border-[var(--border)] font-mono text-[var(--text)] transition-colors";

  return (
    <div className="print:hidden mt-4 border border-[var(--border)] rounded-xl p-3 bg-[var(--surface)]">
      {/* Zeile 1: Beat-Anzeige + BPM + Tap (auf Mobile umbruchsfähig) */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5" role="status" aria-label="Taktanzeige">
          {Array.from({ length: beatCount }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`block w-4 h-4 rounded-full border-2 transition-colors duration-75 ${
                activeBeat === i
                  ? i === 0
                    ? "bg-[var(--amber-bright)] border-[var(--amber-bright)]"
                    : "bg-[var(--teal)] border-[var(--teal)]"
                  : "border-[var(--border)]"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => adjustBpm(-5)}
            className={`${buttonBase} w-8 h-7 text-xs`}
            aria-label="5 BPM langsamer"
          >
            −5
          </button>
          <button
            type="button"
            onClick={() => adjustBpm(-1)}
            className={`${buttonBase} w-6 h-7 text-sm`}
            aria-label="1 BPM langsamer"
          >
            −
          </button>
          <input
            type="number"
            min={20}
            max={300}
            value={bpm}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (Number.isFinite(v)) setBpm(clampBpm(v));
            }}
            className="w-14 text-center font-mono tabular-nums text-sm bg-[var(--bg)] border border-[var(--border)] rounded px-1 py-0.5 text-[var(--text)]"
            aria-label="BPM"
          />
          <button
            type="button"
            onClick={() => adjustBpm(1)}
            className={`${buttonBase} w-6 h-7 text-sm`}
            aria-label="1 BPM schneller"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => adjustBpm(5)}
            className={`${buttonBase} w-8 h-7 text-xs`}
            aria-label="5 BPM schneller"
          >
            +5
          </button>
          <span className="text-xs uppercase tracking-wider text-[var(--text-faint)] ml-1">
            BPM
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTap}
            className="px-3 py-1 rounded-lg border text-sm font-semibold transition-colors"
            style={{
              background: "var(--amber-tint)",
              borderColor: "var(--border)",
              color: "var(--amber-bright)",
            }}
            aria-label="Tap Tempo"
          >
            Tap
          </button>
          {tapHint && (
            <span className="text-xs text-[var(--text-faint)] tabular-nums">
              {tapHint}
            </span>
          )}
        </div>
      </div>

      {/* Zeile 2: Taktart + Start (eigene Reihe → mehr Luft auf Mobile) */}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <div className="flex gap-1" role="group" aria-label="Taktart">
          {(["4/4", "3/4", "6/8"] as const).map((ts) => {
            const active = timeSig === ts;
            return (
              <button
                key={ts}
                type="button"
                onClick={() => setTimeSig(ts)}
                aria-pressed={active}
                className={`px-2.5 py-0.5 rounded text-sm font-mono border transition-colors ${
                  active
                    ? "bg-[var(--teal-tint)] border-[var(--teal)] text-[var(--teal)]"
                    : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]"
                }`}
              >
                {ts}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={togglePlay}
          className={`px-4 py-1 rounded-lg text-sm font-semibold transition-colors ${
            isPlaying
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-[var(--teal)] hover:opacity-90 text-white"
          }`}
          aria-label={isPlaying ? "Metronom stoppen" : "Metronom starten"}
        >
          {isPlaying ? "■ Stop" : "▶ Start"}
        </button>
      </div>
    </div>
  );
}
