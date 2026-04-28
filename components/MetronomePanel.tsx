"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Metronome } from "@/lib/metronome";

type TimeSig = "4/4" | "3/4" | "6/8";

const BEATS: Record<TimeSig, number> = { "4/4": 4, "3/4": 3, "6/8": 6 };

function resolveTimeSig(ts: string): TimeSig {
  if (ts === "3/4" || ts === "6/8") return ts;
  return "4/4";
}

type Props = {
  initialBpm?: number;
  initialTimeSig?: string;
};

export default function MetronomePanel({
  initialBpm = 120,
  initialTimeSig = "4/4",
}: Props) {
  const metronomeRef = useRef<Metronome | null>(null);
  const [bpm, setBpm] = useState(() => Math.max(20, Math.min(300, initialBpm)));
  const [timeSig, setTimeSig] = useState<TimeSig>(() =>
    resolveTimeSig(initialTimeSig),
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeBeat, setActiveBeat] = useState<number | null>(null);

  useEffect(() => {
    const m = new Metronome({ onBeat: (beat) => setActiveBeat(beat) });
    metronomeRef.current = m;
    return () => m.dispose();
  }, []);

  useEffect(() => {
    metronomeRef.current?.setBpm(bpm);
  }, [bpm]);

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
    setBpm((prev) => Math.max(20, Math.min(300, prev + delta)));

  const beatCount = BEATS[timeSig];

  return (
    <div className="print:hidden mt-4 border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-gray-50 dark:bg-gray-900/40">
      <div className="flex flex-wrap items-center gap-3">
        {/* Beat dots */}
        <div className="flex gap-1.5" role="status" aria-label="Taktanzeige">
          {Array.from({ length: beatCount }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`block w-4 h-4 rounded-full border-2 transition-colors duration-75 ${
                activeBeat === i
                  ? i === 0
                    ? "bg-blue-500 border-blue-500"
                    : "bg-emerald-400 border-emerald-400"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            />
          ))}
        </div>

        {/* BPM controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => adjustBpm(-5)}
            className="w-8 h-7 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs font-mono text-gray-800 dark:text-gray-200"
            aria-label="5 BPM langsamer"
          >
            −5
          </button>
          <button
            type="button"
            onClick={() => adjustBpm(-1)}
            className="w-6 h-7 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-mono text-gray-800 dark:text-gray-200"
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
              if (Number.isFinite(v)) setBpm(Math.max(20, Math.min(300, v)));
            }}
            className="w-14 text-center font-mono text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-1 py-0.5 text-gray-900 dark:text-white"
            aria-label="BPM"
          />
          <button
            type="button"
            onClick={() => adjustBpm(1)}
            className="w-6 h-7 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm font-mono text-gray-800 dark:text-gray-200"
            aria-label="1 BPM schneller"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => adjustBpm(5)}
            className="w-8 h-7 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-xs font-mono text-gray-800 dark:text-gray-200"
            aria-label="5 BPM schneller"
          >
            +5
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-0.5">
            BPM
          </span>
        </div>

        {/* Time signature */}
        <div className="flex gap-1" role="group" aria-label="Taktart">
          {(["4/4", "3/4", "6/8"] as const).map((ts) => (
            <button
              key={ts}
              type="button"
              onClick={() => setTimeSig(ts)}
              aria-pressed={timeSig === ts}
              className={`px-2.5 py-0.5 rounded text-sm font-mono ${
                timeSig === ts
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {ts}
            </button>
          ))}
        </div>

        {/* Start / Stop */}
        <button
          type="button"
          onClick={togglePlay}
          className={`px-4 py-1 rounded-lg text-sm font-semibold transition-colors ${
            isPlaying
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
          aria-label={isPlaying ? "Metronom stoppen" : "Metronom starten"}
        >
          {isPlaying ? "■ Stop" : "▶ Start"}
        </button>
      </div>
    </div>
  );
}
