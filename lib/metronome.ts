/**
 * Metronom mit Web-Audio-Lookahead-Scheduler nach Chris Wilson.
 *
 * Architektur:
 * - `setInterval` läuft alle 25 ms und prüft, ob neue Beats geplant werden müssen.
 * - Beats werden bis zu 100 ms im Voraus mit `audioContext.currentTime`
 *   exakt eingeplant (`oscillator.start(scheduledTime)`).
 * - Niemals `Date.now()` oder `setInterval` für die Beat-Erzeugung selbst nutzen
 *   — `setInterval` jittert hörbar (5–20 ms Drift).
 *
 * Click-Sounds:
 * - Akzent (Beat 0): 1000 Hz, lauter
 * - Normal: 800 Hz, leiser
 * - Beide: kurze Sinus-Hüllkurve mit Attack 1 ms, Decay 50 ms.
 */

export type MetronomeBeatCallback = (
  beatInMeasure: number,
  totalBeats: number,
) => void;

export type MetronomeOptions = {
  onBeat?: MetronomeBeatCallback;
};

export class Metronome {
  // Konfiguration
  private bpm = 120;
  private beatsPerMeasure = 4;

  // Laufzeit-State
  private audioContext: AudioContext | null = null;
  private isRunning = false;
  private currentBeat = 0;
  private totalBeats = 0;
  private nextNoteTime = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private onBeat?: MetronomeBeatCallback;

  // Chris-Wilson-Tuning
  private readonly lookahead = 25; // ms — Scheduler-Tick
  private readonly scheduleAheadTime = 0.1; // s — wie weit voraus geplant wird

  constructor(options: MetronomeOptions = {}) {
    this.onBeat = options.onBeat;
  }

  /**
   * Startet das Metronom. Muss aus einem User-Gesture-Kontext aufgerufen werden
   * (Click/Touch) wegen der Browser-Autoplay-Policy.
   */
  start(bpm = this.bpm, beatsPerMeasure = this.beatsPerMeasure): void {
    if (this.isRunning) return;

    this.bpm = clampBpm(bpm);
    this.beatsPerMeasure = clampBeats(beatsPerMeasure);
    this.currentBeat = 0;
    this.totalBeats = 0;

    if (!this.audioContext) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) throw new Error("Web Audio API nicht verfügbar");
      this.audioContext = new Ctor();
    } else if (this.audioContext.state === "suspended") {
      void this.audioContext.resume();
    }

    this.isRunning = true;
    // Kleine Anlaufverzögerung, damit der erste Beat nicht direkt am Limit liegt
    this.nextNoteTime = this.audioContext.currentTime + 0.05;
    this.timerId = setInterval(() => this.scheduler(), this.lookahead);
  }

  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    // AudioContext nicht schließen — wir wollen ihn beim nächsten start() wiederverwenden
  }

  setBpm(bpm: number): void {
    this.bpm = clampBpm(bpm);
  }

  setTimeSignature(beatsPerMeasure: number): void {
    const next = clampBeats(beatsPerMeasure);
    this.beatsPerMeasure = next;
    if (this.currentBeat >= next) this.currentBeat = 0;
  }

  isPlaying(): boolean {
    return this.isRunning;
  }

  getBpm(): number {
    return this.bpm;
  }

  getBeatsPerMeasure(): number {
    return this.beatsPerMeasure;
  }

  /** Vollständig aufräumen — beim Component-Unmount aufrufen. */
  dispose(): void {
    this.stop();
    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }
  }

  // -- Internals -----------------------------------------------------------

  private scheduler(): void {
    if (!this.audioContext || !this.isRunning) return;

    const horizon =
      this.audioContext.currentTime + this.scheduleAheadTime;

    while (this.nextNoteTime < horizon) {
      this.scheduleClick(this.currentBeat, this.nextNoteTime);
      this.notifyUiAtTime(
        this.currentBeat,
        this.totalBeats,
        this.nextNoteTime,
      );

      this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
      this.totalBeats += 1;
      this.nextNoteTime += 60.0 / this.bpm;
    }
  }

  private scheduleClick(beat: number, time: number): void {
    if (!this.audioContext) return;
    const isAccent = beat === 0;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = "sine";
    osc.frequency.value = isAccent ? 1000 : 800;

    // Hüllkurve: 1 ms Attack, 50 ms Decay → kurzer, klarer Click
    const peak = isAccent ? 0.5 : 0.3;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(peak, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    osc.connect(gain).connect(this.audioContext.destination);

    osc.start(time);
    osc.stop(time + 0.06);
  }

  private notifyUiAtTime(
    beat: number,
    total: number,
    time: number,
  ): void {
    if (!this.onBeat || !this.audioContext) return;
    const delayMs = (time - this.audioContext.currentTime) * 1000;
    setTimeout(() => {
      // Nach dem Scheduling kann das Metronom gestoppt worden sein —
      // dann den Callback nicht feuern.
      if (!this.isRunning) return;
      this.onBeat?.(beat, total);
    }, Math.max(0, delayMs));
  }
}

function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return 120;
  return Math.max(20, Math.min(300, Math.round(bpm)));
}

function clampBeats(n: number): number {
  if (!Number.isFinite(n)) return 4;
  return Math.max(1, Math.min(16, Math.round(n)));
}
