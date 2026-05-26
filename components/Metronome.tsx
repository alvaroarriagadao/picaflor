"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type SoundType = "click" | "clave" | "digital";

const SOUND_META: Record<SoundType, { label: string; desc: string }> = {
  click:   { label: "Click",   desc: "Tono puro" },
  clave:   { label: "Clave",   desc: "Madera" },
  digital: { label: "Digital", desc: "Electrónico" },
};

interface MetronomeProps {
  initialBpm: number;
  bpmStart?: number;
  bpmTarget?: number;
}

export default function Metronome({ initialBpm, bpmStart, bpmTarget }: MetronomeProps) {
  const [bpm, setBpm]             = useState(initialBpm);
  const [playing, setPlaying]     = useState(false);
  const [beatsPerBar, setBeatsPerBar] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [soundType, setSoundType] = useState<SoundType>("click");
  const [volume, setVolume]       = useState(0.8);

  const audioCtxRef    = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const beatRef        = useRef(0);
  const timerRef       = useRef<number | null>(null);
  const bpmRef         = useRef(bpm);
  const beatsPerBarRef = useRef(beatsPerBar);
  const soundTypeRef   = useRef<SoundType>(soundType);
  const volumeRef      = useRef(volume);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { beatsPerBarRef.current = beatsPerBar; }, [beatsPerBar]);
  useEffect(() => { soundTypeRef.current = soundType; }, [soundType]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  const scheduleClick = useCallback((time: number, isDownbeat: boolean) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const vol  = volumeRef.current;
    const type = soundTypeRef.current;

    const gainNode = ctx.createGain();
    gainNode.connect(ctx.destination);

    if (type === "click") {
      // Sine wave – classic metronome click
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = isDownbeat ? 1500 : 900;
      gainNode.gain.setValueAtTime((isDownbeat ? 0.5 : 0.3) * vol, time);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
      osc.connect(gainNode);
      osc.start(time);
      osc.stop(time + 0.05);

    } else if (type === "clave") {
      // Triangle wave + short decay = woodblock / clave feel
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = isDownbeat ? 750 : 520;
      gainNode.gain.setValueAtTime((isDownbeat ? 0.85 : 0.55) * vol, time);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.012);
      osc.connect(gainNode);
      osc.start(time);
      osc.stop(time + 0.016);

    } else {
      // Square wave – digital / electronic beep
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.value = isDownbeat ? 660 : 440;
      gainNode.gain.setValueAtTime((isDownbeat ? 0.18 : 0.12) * vol, time);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
      osc.connect(gainNode);
      osc.start(time);
      osc.stop(time + 0.08);
    }
  }, []);

  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const lookahead = 0.1;
    while (nextNoteTimeRef.current < ctx.currentTime + lookahead) {
      const isDownbeat = beatRef.current % beatsPerBarRef.current === 0;
      scheduleClick(nextNoteTimeRef.current, isDownbeat);
      const beatToShow = beatRef.current % beatsPerBarRef.current;
      const t = (nextNoteTimeRef.current - ctx.currentTime) * 1000;
      window.setTimeout(() => setCurrentBeat(beatToShow), Math.max(0, t));
      nextNoteTimeRef.current += 60.0 / bpmRef.current;
      beatRef.current += 1;
    }
    timerRef.current = window.setTimeout(scheduler, 25);
  }, [scheduleClick]);

  const start = useCallback(() => {
    if (!audioCtxRef.current)
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    audioCtxRef.current?.close();
  }, []);

  const adjustBpm = (delta: number) =>
    setBpm(b => Math.min(280, Math.max(30, b + delta)));

  return (
    <div className="rounded-2xl border border-smoke bg-ash/60 p-6 backdrop-blur">
      {/* Header row: label + beat dots */}
      <div className="mb-5 flex items-center justify-between">
        <span className="font-display text-sm uppercase tracking-[0.2em] text-stone-400">
          Metrónomo
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: beatsPerBar }).map((_, i) => (
            <span key={i}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-75 ${
                playing && currentBeat === i
                  ? i === 0 ? "scale-125 bg-amber" : "scale-125 bg-ember"
                  : "bg-smoke"
              }`}
            />
          ))}
        </div>
      </div>

      {/* BPM display */}
      <div className="mb-6 text-center">
        <div className="font-display text-7xl font-extrabold tabular-nums tracking-tight text-bone">
          {bpm}
        </div>
        <div className="mt-1 text-xs uppercase tracking-[0.3em] text-stone-500">BPM</div>
      </div>

      {/* BPM Slider */}
      <input type="range" min={30} max={280} value={bpm}
        onChange={e => setBpm(Number(e.target.value))}
        className="mb-5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-smoke accent-ember"
      />

      {/* Fine adjust */}
      <div className="mb-5 grid grid-cols-4 gap-2">
        {[-5, -1, +1, +5].map(d => (
          <button key={d} onClick={() => adjustBpm(d)}
            className="rounded-lg border border-smoke bg-ink/40 py-2 font-mono text-sm text-stone-300 transition hover:border-ember hover:text-ember">
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>

      {/* BPM Presets */}
      {(bpmStart || bpmTarget) && (
        <div className="mb-5 flex gap-2">
          {bpmStart && (
            <button onClick={() => setBpm(bpmStart)}
              className="flex-1 rounded-lg border border-sage/40 bg-sage/10 py-2 text-xs uppercase tracking-wider text-sage transition hover:bg-sage/20">
              Inicio · {bpmStart}
            </button>
          )}
          {bpmTarget && (
            <button onClick={() => setBpm(bpmTarget)}
              className="flex-1 rounded-lg border border-amber/40 bg-amber/10 py-2 text-xs uppercase tracking-wider text-amber transition hover:bg-amber/20">
              Meta · {bpmTarget}
            </button>
          )}
        </div>
      )}

      {/* Time signature */}
      <div className="mb-5 flex items-center justify-center gap-2 text-sm text-stone-400">
        <span className="uppercase tracking-wider text-xs">Compás</span>
        {[3, 4, 6].map(n => (
          <button key={n} onClick={() => setBeatsPerBar(n)}
            className={`rounded px-2.5 py-1 font-mono transition text-sm ${
              beatsPerBar === n ? "bg-ember text-ink" : "bg-smoke text-stone-400 hover:text-bone"
            }`}>
            {n}/4
          </button>
        ))}
      </div>

      {/* ── Sound type ───────────────────────────────────────────── */}
      <div className="mb-4">
        <p className="mb-2 text-xs uppercase tracking-wider text-stone-500">Sonido</p>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(SOUND_META) as SoundType[]).map(s => (
            <button key={s} onClick={() => setSoundType(s)}
              className={`rounded-lg border py-2 text-center transition ${
                soundType === s
                  ? "border-ember/50 bg-ember/10 text-ember"
                  : "border-smoke bg-ink/30 text-stone-400 hover:text-bone"
              }`}>
              <p className="text-xs font-display font-bold">{SOUND_META[s].label}</p>
              <p className="text-[10px] text-stone-600 mt-0.5">{SOUND_META[s].desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Volume ───────────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-stone-500">Volumen</p>
          <span className="font-mono text-xs text-stone-400">{Math.round(volume * 100)}%</span>
        </div>
        <input type="range" min={0} max={1} step={0.05} value={volume}
          onChange={e => setVolume(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-smoke accent-ember"
        />
      </div>

      {/* Play/Stop */}
      <button onClick={toggle}
        className={`w-full rounded-xl py-4 font-display text-lg font-bold uppercase tracking-wider transition ${
          playing ? "bg-rust text-bone hover:bg-rust/80" : "bg-ember text-ink hover:bg-amber"
        }`}>
        {playing ? "Detener" : "Iniciar"}
      </button>
    </div>
  );
}
