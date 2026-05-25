"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface MetronomeProps {
  initialBpm: number;
  bpmStart?: number;
  bpmTarget?: number;
}

export default function Metronome({
  initialBpm,
  bpmStart,
  bpmTarget,
}: MetronomeProps) {
  const [bpm, setBpm] = useState(initialBpm);
  const [playing, setPlaying] = useState(false);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const bpmRef = useRef(bpm);
  const beatsPerBarRef = useRef(beatsPerBar);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);
  useEffect(() => {
    beatsPerBarRef.current = beatsPerBar;
  }, [beatsPerBar]);

  // Programa un click usando el reloj de alta precisión de Web Audio
  const scheduleClick = useCallback((time: number, isDownbeat: boolean) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = isDownbeat ? 1500 : 900;
    gain.gain.setValueAtTime(isDownbeat ? 0.5 : 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  }, []);

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const lookahead = 0.1; // segundos
    while (nextNoteTimeRef.current < ctx.currentTime + lookahead) {
      const isDownbeat = beatRef.current % beatsPerBarRef.current === 0;
      scheduleClick(nextNoteTimeRef.current, isDownbeat);
      const beatToShow = beatRef.current % beatsPerBarRef.current;
      const t = (nextNoteTimeRef.current - ctx.currentTime) * 1000;
      window.setTimeout(() => setCurrentBeat(beatToShow), Math.max(0, t));
      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;
      beatRef.current += 1;
    }
    timerRef.current = window.setTimeout(scheduler, 25);
  }, [scheduleClick]);

  const start = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    beatRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    setPlaying(true);
    scheduler();
  }, [scheduler]);

  const stop = useCallback(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    setPlaying(false);
    setCurrentBeat(0);
  }, []);

  const toggle = () => (playing ? stop() : start());

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      audioCtxRef.current?.close();
    };
  }, []);

  const adjustBpm = (delta: number) =>
    setBpm((b) => Math.min(280, Math.max(30, b + delta)));

  return (
    <div className="rounded-2xl border border-smoke bg-ash/60 p-6 backdrop-blur">
      <div className="mb-5 flex items-center justify-between">
        <span className="font-display text-sm uppercase tracking-[0.2em] text-stone-400">
          Metrónomo
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: beatsPerBar }).map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-75 ${
                playing && currentBeat === i
                  ? i === 0
                    ? "scale-125 bg-amber"
                    : "scale-125 bg-ember"
                  : "bg-smoke"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="mb-6 text-center">
        <div className="font-display text-7xl font-extrabold tabular-nums tracking-tight text-bone">
          {bpm}
        </div>
        <div className="mt-1 text-xs uppercase tracking-[0.3em] text-stone-500">
          BPM
        </div>
      </div>

      {/* Slider */}
      <input
        type="range"
        min={30}
        max={280}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        className="mb-5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-smoke accent-ember"
      />

      {/* Botones de ajuste fino */}
      <div className="mb-5 grid grid-cols-4 gap-2">
        {[-5, -1, +1, +5].map((d) => (
          <button
            key={d}
            onClick={() => adjustBpm(d)}
            className="rounded-lg border border-smoke bg-ink/40 py-2 font-mono text-sm text-stone-300 transition hover:border-ember hover:text-ember"
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>

      {/* Presets del ejercicio */}
      {(bpmStart || bpmTarget) && (
        <div className="mb-5 flex gap-2">
          {bpmStart && (
            <button
              onClick={() => setBpm(bpmStart)}
              className="flex-1 rounded-lg border border-sage/40 bg-sage/10 py-2 text-xs uppercase tracking-wider text-sage transition hover:bg-sage/20"
            >
              Inicio · {bpmStart}
            </button>
          )}
          {bpmTarget && (
            <button
              onClick={() => setBpm(bpmTarget)}
              className="flex-1 rounded-lg border border-amber/40 bg-amber/10 py-2 text-xs uppercase tracking-wider text-amber transition hover:bg-amber/20"
            >
              Meta · {bpmTarget}
            </button>
          )}
        </div>
      )}

      {/* Compás */}
      <div className="mb-5 flex items-center justify-center gap-2 text-sm text-stone-400">
        <span className="uppercase tracking-wider">Compás</span>
        {[3, 4, 6].map((n) => (
          <button
            key={n}
            onClick={() => setBeatsPerBar(n)}
            className={`rounded px-2.5 py-1 font-mono transition ${
              beatsPerBar === n
                ? "bg-ember text-ink"
                : "bg-smoke text-stone-400 hover:text-bone"
            }`}
          >
            {n}/4
          </button>
        ))}
      </div>

      <button
        onClick={toggle}
        className={`w-full rounded-xl py-4 font-display text-lg font-bold uppercase tracking-wider transition ${
          playing
            ? "bg-rust text-bone hover:bg-rust/80"
            : "bg-ember text-ink hover:bg-amber"
        }`}
      >
        {playing ? "Detener" : "Iniciar"}
      </button>
    </div>
  );
}
