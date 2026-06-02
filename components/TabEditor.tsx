"use client";

import { useState, useCallback, useRef } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const STRING_NAMES = ["e", "B", "G", "D", "A", "E"] as const;
const DEFAULT_BEATS = 16;
const PICK_SYMBOLS = ["↓", "↑", ""] as const;
type PickSymbol = (typeof PICK_SYMBOLS)[number];

// ─── Types ───────────────────────────────────────────────────────────────────

interface TabState {
  beats: number;
  cells: Record<string, string>;
  picking: Record<number, PickSymbol>;
}

function cellKey(s: number, b: number) { return `${s}-${b}`; }

// ─── ASCII generator ─────────────────────────────────────────────────────────

function generateTab(state: TabState): string {
  const { beats, cells, picking } = state;

  const colWidths: number[] = Array.from({ length: beats }, (_, b) => {
    let max = 1;
    for (let s = 0; s < 6; s++) {
      const v = cells[cellKey(s, b)] ?? "";
      if (v.length > max) max = v.length;
    }
    return max;
  });

  const lines: string[] = STRING_NAMES.map((name, s) => {
    let row = `${name}|`;
    for (let b = 0; b < beats; b++) {
      const val = cells[cellKey(s, b)] ?? "";
      row += `--${val.padEnd(colWidths[b], "-")}`;
    }
    return row + "--|";
  });

  const hasAnyPick = Object.values(picking).some(v => v !== "");
  if (hasAnyPick) {
    let pickRow = "  ";
    for (let b = 0; b < beats; b++) {
      const sym = picking[b] ?? "";
      const w = colWidths[b];
      pickRow += " " + sym.padEnd(1 + w, " ");
    }
    lines.push(pickRow.trimEnd());
  }

  return lines.join("\n");
}

// ─── Component ───────────────────────────────────────────────────────────────

interface Props { onInsert?: (tab: string) => void; }

export default function TabEditor({ onInsert }: Props) {
  const [state, setState] = useState<TabState>({ beats: DEFAULT_BEATS, cells: {}, picking: {} });
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  const generatedTab = generateTab(state);

  // ── Cell handlers ────────────────────────────────────────────────────────

  const updateCell = useCallback((s: number, b: number, val: string) => {
    const sanitized = val.replace(/[^0-9hpb~x/\\]/g, "").slice(0, 4);
    setState(prev => ({ ...prev, cells: { ...prev.cells, [cellKey(s, b)]: sanitized } }));
  }, []);

  const clearCell = useCallback((s: number, b: number) => {
    setState(prev => {
      const next = { ...prev.cells };
      delete next[cellKey(s, b)];
      return { ...prev, cells: next };
    });
  }, []);

  const cyclePick = useCallback((b: number) => {
    setState(prev => {
      const cur = prev.picking[b] ?? "";
      const idx = PICK_SYMBOLS.indexOf(cur as PickSymbol);
      const next = PICK_SYMBOLS[(idx + 1) % PICK_SYMBOLS.length];
      const updated = { ...prev.picking };
      if (next === "") delete updated[b]; else updated[b] = next;
      return { ...prev, picking: updated };
    });
  }, []);

  // ── Beat management ──────────────────────────────────────────────────────

  const addBeats = (n: number) => {
    setState(p => ({ ...p, beats: p.beats + n }));
    // Scroll right after adding beats
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }, 50);
  };

  const removeBeats = (n: number) => {
    setState(prev => {
      const newBeats = Math.max(1, prev.beats - n);
      const cells = { ...prev.cells };
      const picking = { ...prev.picking };
      for (let b = newBeats; b < prev.beats; b++) {
        for (let s = 0; s < 6; s++) delete cells[cellKey(s, b)];
        delete picking[b];
      }
      return { ...prev, beats: newBeats, cells, picking };
    });
  };

  const clearAll = () => setState({ beats: DEFAULT_BEATS, cells: {}, picking: {} });

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedTab);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ── Keyboard nav ─────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, s: number, b: number) => {
    if (e.key === "Tab" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = b + 1 < state.beats
        ? inputRefs.current[cellKey(s, b + 1)]
        : inputRefs.current[cellKey((s + 1) % 6, 0)];
      next?.focus();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = b > 0
        ? inputRefs.current[cellKey(s, b - 1)]
        : inputRefs.current[cellKey((s + 5) % 6, state.beats - 1)];
      prev?.focus();
    }
    if (e.key === "ArrowDown") { e.preventDefault(); inputRefs.current[cellKey((s + 1) % 6, b)]?.focus(); }
    if (e.key === "ArrowUp")   { e.preventDefault(); inputRefs.current[cellKey((s + 5) % 6, b)]?.focus(); }
    if (e.key === "Backspace" && (e.target as HTMLInputElement).value === "") {
      e.preventDefault(); clearCell(s, b);
    }
    if (e.key === "Delete") { e.preventDefault(); clearCell(s, b); }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const filledBeats = new Set(Object.keys(state.cells).map(k => parseInt(k.split("-")[1])));

  return (
    <div className="rounded-2xl border border-smoke bg-ash/40 p-5">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-display text-lg font-bold text-bone">Editor de tablatura</h3>
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <kbd className="rounded border border-smoke px-1.5 py-0.5 font-mono">Tab/→</kbd>
          <span>navegar</span>
          <span className="mx-1 text-stone-700">·</span>
          <kbd className="rounded border border-smoke px-1.5 py-0.5 font-mono">↑↓</kbd>
          <span>cuerdas</span>
        </div>
      </div>

      {/* Beat counter + controls */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-stone-400 border border-smoke rounded px-2 py-1">
          {state.beats} notas
        </span>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => addBeats(1)}
            className="rounded border border-smoke px-2 py-1 text-xs text-stone-400 hover:border-ember/40 hover:text-ember transition">
            +1
          </button>
          <button type="button" onClick={() => addBeats(4)}
            className="rounded border border-smoke px-2 py-1 text-xs text-stone-400 hover:border-ember/40 hover:text-ember transition">
            +4
          </button>
          <button type="button" onClick={() => addBeats(8)}
            className="rounded border border-smoke px-2 py-1 text-xs text-stone-400 hover:border-ember/40 hover:text-ember transition">
            +8
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => removeBeats(1)} disabled={state.beats <= 1}
            className="rounded border border-smoke px-2 py-1 text-xs text-stone-400 hover:text-rust transition disabled:opacity-30">
            −1
          </button>
          <button type="button" onClick={() => removeBeats(4)} disabled={state.beats <= 4}
            className="rounded border border-smoke px-2 py-1 text-xs text-stone-400 hover:text-rust transition disabled:opacity-30">
            −4
          </button>
        </div>
        <button type="button" onClick={clearAll}
          className="ml-auto text-xs text-stone-600 hover:text-rust transition">
          Limpiar todo
        </button>
      </div>

      {/* ── Grid — horizontally scrollable ───────────────────────────────── */}
      <div
        ref={scrollRef}
        className="mb-3 overflow-x-auto rounded-xl border border-smoke/50 bg-ink/40 pb-1"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* Beat numbers ruler */}
        <div className="flex pl-8 pt-1 pb-0.5 min-w-max">
          {Array.from({ length: state.beats }, (_, b) => (
            <div key={b}
              className={`w-8 text-center text-[9px] font-mono shrink-0 ${
                filledBeats.has(b) ? "text-amber" : "text-stone-700"
              }`}>
              {b + 1}
            </div>
          ))}
        </div>

        {/* String rows */}
        <table className="border-collapse min-w-max">
          <tbody>
            {STRING_NAMES.map((name, s) => (
              <tr key={name}>
                {/* String label */}
                <td className="w-8 pr-1 text-right font-mono text-sm font-bold text-ember select-none pl-1">
                  {name}
                </td>
                {Array.from({ length: state.beats }, (_, b) => {
                  const key = cellKey(s, b);
                  const val = state.cells[key] ?? "";
                  const isActive = activeCell === key;
                  // Group separator every 4 beats
                  const isGroupStart = b > 0 && b % 4 === 0;
                  return (
                    <td key={b} className={`relative px-px ${isGroupStart ? "border-l border-stone-700/40" : ""}`}>
                      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center">
                        <div className="h-px w-full bg-smoke/50" />
                      </div>
                      <input
                        ref={el => { if (el) inputRefs.current[key] = el; }}
                        type="text"
                        value={val}
                        maxLength={4}
                        onChange={e => updateCell(s, b, e.target.value)}
                        onKeyDown={e => handleKeyDown(e, s, b)}
                        onFocus={() => setActiveCell(key)}
                        onBlur={() => setActiveCell(null)}
                        className={`relative z-10 h-7 w-8 rounded text-center font-mono text-xs outline-none transition ${
                          val
                            ? "bg-smoke text-amber"
                            : isActive
                            ? "bg-smoke/60 text-stone-300"
                            : "bg-transparent text-stone-700 hover:bg-smoke/20"
                        } ${isActive ? "ring-1 ring-ember/70" : ""}`}
                        placeholder="·"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Picking row */}
            <tr>
              <td className="pr-1 text-right text-[10px] text-stone-600 font-mono pl-1 w-8">púa</td>
              {Array.from({ length: state.beats }, (_, b) => {
                const sym = state.picking[b] ?? "";
                const isGroupStart = b > 0 && b % 4 === 0;
                return (
                  <td key={b} className={`px-px ${isGroupStart ? "border-l border-stone-700/40" : ""}`}>
                    <button type="button" onClick={() => cyclePick(b)} title="Click → dirección de púa"
                      className={`h-7 w-8 rounded font-mono text-xs transition ${
                        sym === "↓" ? "bg-ember/20 text-ember"
                        : sym === "↑" ? "bg-amber/20 text-amber"
                        : "text-stone-700 hover:text-stone-500"
                      }`}>
                      {sym || "·"}
                    </button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Scroll hint */}
      {state.beats > 20 && (
        <p className="mb-3 text-[10px] text-stone-600 flex items-center gap-1">
          <span>←</span> Desplaza horizontalmente para ver todas las notas <span>→</span>
        </p>
      )}

      {/* Vista previa ASCII */}
      <div className="mb-4">
        <p className="mb-1.5 text-xs uppercase tracking-wider text-stone-500">Vista previa ASCII</p>
        <div className="overflow-x-auto rounded-xl border border-smoke bg-ink/80 p-3"
          style={{ scrollbarWidth: "thin" }}>
          <pre className="font-mono text-xs text-amber" style={{ whiteSpace: "pre", minWidth: "max-content" }}>
            {generatedTab}
          </pre>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copyToClipboard}
          className="rounded-xl border border-smoke px-4 py-2 text-sm font-medium text-stone-300 transition hover:border-ember/40 hover:text-ember">
          {copied ? "✓ Copiado" : "Copiar tablatura"}
        </button>
        {onInsert && (
          <button type="button" onClick={() => onInsert(generatedTab)}
            className="rounded-xl bg-ember px-4 py-2 text-sm font-bold text-ink transition hover:bg-amber">
            Usar esta tablatura →
          </button>
        )}
      </div>
    </div>
  );
}
