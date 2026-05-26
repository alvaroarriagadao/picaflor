"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Standard guitar tuning – string 1 (high) → 6 (low)
const GUITAR_STRINGS = [
  { name: "E4", string: 1, hz: 329.63 },
  { name: "B3", string: 2, hz: 246.94 },
  { name: "G3", string: 3, hz: 196.00 },
  { name: "D3", string: 4, hz: 146.83 },
  { name: "A2", string: 5, hz: 110.00 },
  { name: "E2", string: 6, hz: 82.41  },
];

const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

function hzToNoteInfo(freq: number) {
  if (freq <= 0) return null;
  const midiFloat = 12 * Math.log2(freq / 440) + 69;
  const midi  = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midi) * 100);
  const note  = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  const closest = GUITAR_STRINGS.reduce((a, b) =>
    Math.abs(a.hz - freq) < Math.abs(b.hz - freq) ? a : b
  );
  return { note, octave, cents, closest };
}

function detectPitch(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  const HALF = Math.floor(SIZE / 2);

  // RMS silence check
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  if (Math.sqrt(rms / SIZE) < 0.01) return -1;

  // Autocorrelation
  const c = new Float32Array(HALF);
  for (let lag = 0; lag < HALF; lag++) {
    for (let i = 0; i < HALF; i++) c[lag] += buffer[i] * buffer[i + lag];
  }

  // Skip initial downslope
  let d = 0;
  while (d < HALF - 1 && c[d] > c[d + 1]) d++;

  // Find max in guitar frequency range (60–1200 Hz)
  const minLag = Math.floor(sampleRate / 1200);
  const maxLag = Math.floor(sampleRate / 60);
  let maxC = -1, maxPos = -1;
  for (let i = Math.max(d, minLag); i <= Math.min(maxLag, HALF - 2); i++) {
    if (c[i] > maxC) { maxC = c[i]; maxPos = i; }
  }
  if (maxPos === -1) return -1;

  // Parabolic interpolation for sub-sample accuracy
  const y1 = c[maxPos - 1] ?? c[maxPos];
  const y2 = c[maxPos];
  const y3 = c[maxPos + 1] ?? c[maxPos];
  const denom = 2 * (2 * y2 - y1 - y3);
  const shift = denom !== 0 ? (y3 - y1) / denom : 0;
  return sampleRate / (maxPos + shift);
}

interface Props { open: boolean; onClose: () => void }

export default function Tuner({ open, onClose }: Props) {
  const [listening, setListening]     = useState(false);
  const [freq, setFreq]               = useState(-1);
  const [error, setError]             = useState<string | null>(null);
  const [playingHz, setPlayingHz]     = useState<number | null>(null);

  const audioCtxRef  = useRef<AudioContext | null>(null);
  const analyserRef  = useRef<AnalyserNode | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const rafRef       = useRef<number | null>(null);
  const refOscRef    = useRef<OscillatorNode | null>(null);

  const ensureCtx = useCallback(() => {
    if (!audioCtxRef.current)
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtxRef.current.state === "suspended") audioCtxRef.current.resume();
    return audioCtxRef.current;
  }, []);

  const stopListening = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current  = null;
    analyserRef.current = null;
    setListening(false);
    setFreq(-1);
  }, []);

  const stopReference = useCallback(() => {
    try { refOscRef.current?.stop(); } catch {}
    refOscRef.current = null;
    setPlayingHz(null);
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    try {
      const ctx = ensureCtx();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      analyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);
      setListening(true);

      const buf = new Float32Array(analyser.fftSize);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buf);
        setFreq(detectPitch(buf, ctx.sampleRate));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError("No se pudo acceder al micrófono. Verifica los permisos del navegador.");
    }
  }, [ensureCtx]);

  const playReference = useCallback((hz: number) => {
    const ctx = ensureCtx();
    try { refOscRef.current?.stop(); } catch {}
    refOscRef.current = null;

    if (playingHz === hz) { setPlayingHz(null); return; }

    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = hz;
    osc.type = "sine";
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    refOscRef.current = osc;
    setPlayingHz(hz);
  }, [ensureCtx, playingHz]);

  // Cleanup when closed
  useEffect(() => {
    if (!open) { stopListening(); stopReference(); }
  }, [open, stopListening, stopReference]);

  useEffect(() => () => {
    stopListening(); stopReference();
    audioCtxRef.current?.close();
  }, [stopListening, stopReference]);

  if (!open) return null;

  const info      = freq > 0 ? hzToNoteInfo(freq) : null;
  const cents     = info?.cents ?? 0;
  const inTune    = Math.abs(cents) <= 5;
  const slightOff = Math.abs(cents) <= 15;
  const needlePct = info ? Math.max(0, Math.min(100, (cents + 50) / 100 * 100)) : 50;

  const tuneColor = inTune ? "text-sage" : slightOff ? "text-amber" : "text-rust";
  const borderColor = inTune ? "border-sage/40 bg-sage/10"
    : slightOff ? "border-amber/30 bg-amber/5"
    : info ? "border-rust/30 bg-rust/5"
    : "border-smoke bg-ink/30";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-sm mx-0 sm:mx-4 overflow-hidden rounded-t-3xl sm:rounded-3xl border border-smoke bg-ash">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-smoke/60 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg text-amber">♪</span>
            <span className="font-display text-sm font-bold uppercase tracking-widest text-bone">
              Afinador
            </span>
            <span className="rounded-full bg-ember/20 px-2 py-0.5 text-[10px] text-ember font-bold uppercase tracking-wider">
              Standard E
            </span>
          </div>
          <button onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-smoke text-stone-400 hover:text-bone transition">
            ×
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Note display */}
          <div className={`rounded-2xl border px-4 py-5 text-center transition-all ${borderColor}`}>
            {info ? (
              <>
                <p className={`font-display text-7xl font-extrabold leading-none ${tuneColor}`}>
                  {info.note}
                  <span className="text-2xl text-stone-500">{info.octave}</span>
                </p>
                <p className="mt-2 text-sm text-stone-400 font-mono">{freq.toFixed(1)} Hz</p>
                <p className="mt-0.5 text-xs text-stone-600">
                  {info.closest.name} (cuerda {info.closest.string}) — {info.closest.hz} Hz
                </p>
              </>
            ) : (
              <div>
                <p className="font-display text-5xl font-bold text-stone-600">—</p>
                <p className="mt-2 text-xs text-stone-600">
                  {listening ? "Esperando señal…" : "Activa el micrófono para afinar"}
                </p>
              </div>
            )}
          </div>

          {/* Cents meter */}
          <div>
            <div className="relative h-8 rounded-full bg-smoke overflow-hidden">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-stone-500/50 -translate-x-1/2" />
              {/* Tuned zone */}
              <div className="absolute top-1/2 left-[calc(50%-8px)] w-4 h-full -translate-y-1/2 bg-sage/15 rounded-sm" />
              {/* Needle */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 h-5 w-1.5 rounded-full transition-all duration-75 shadow-sm ${
                  inTune ? "bg-sage" : slightOff ? "bg-amber" : "bg-rust"
                }`}
                style={{ left: `calc(${needlePct}% - 3px)` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-stone-600">
              <span>−50¢ · bajo</span>
              <span className={`font-mono font-bold text-xs ${tuneColor}`}>
                {info
                  ? inTune
                    ? "✓ afinado"
                    : cents > 0 ? `+${cents}¢ alto` : `${cents}¢ bajo`
                  : "0¢"}
              </span>
              <span>alto · +50¢</span>
            </div>
          </div>

          {/* Mic button */}
          <button
            onClick={listening ? stopListening : startListening}
            className={`w-full rounded-xl py-3 font-display font-bold uppercase tracking-wider text-sm transition ${
              listening
                ? "bg-rust/80 text-bone hover:bg-rust"
                : "bg-ember text-ink hover:bg-amber"
            }`}
          >
            {listening ? "⏹  Detener micrófono" : "🎤  Escuchar con micrófono"}
          </button>

          {error && <p className="text-xs text-rust text-center">{error}</p>}

          {/* Reference tones */}
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-stone-500">
              Cuerdas de referencia{" "}
              <span className="normal-case text-stone-600">(pulsa para escuchar)</span>
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {GUITAR_STRINGS.map(s => (
                <button key={s.string}
                  onClick={() => playReference(s.hz)}
                  className={`rounded-xl border py-2.5 text-center transition ${
                    playingHz === s.hz
                      ? "border-amber/50 bg-amber/15 text-amber"
                      : "border-smoke bg-ink/30 text-stone-300 hover:border-ember/40 hover:text-bone"
                  }`}>
                  <p className="font-display font-extrabold text-sm">{s.name.replace(/\d/, "")}</p>
                  <p className="text-[9px] text-stone-600 mt-0.5">{s.string}ª</p>
                </button>
              ))}
            </div>
            {playingHz !== null && (
              <button onClick={stopReference}
                className="mt-2 w-full text-xs text-stone-500 hover:text-rust transition">
                × Detener tono
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
