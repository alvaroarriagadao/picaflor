"use client";

import { useState, useCallback, useRef } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const STRING_NAMES = ["e", "B", "G", "D", "A", "E"] as const;
const DEFAULT_BEATS = 8;
const PICK_SYMBOLS = ["↓", "↑", ""] as const;
type PickSymbol = (typeof PICK_SYMBOLS)[number];

// ─── Types ───────────────────────────────────────────────────────────────────

interface TabState {
  beats: number;
  cells: Record<string, string>; // key: `${stringIdx}-${beatIdx}`
  picking: Record<number, PickSymbol>; // beatIdx → symbol
}

function cellKey(s: number, b: number) {
  return `${s}-${b}`;
}

// ─── ASCII generator ─────────────────────────────────────────────────────────

function generateTab(state: TabState): string {
  const { beats, cells, picking } = state;

  // compute column widths
  const colWidths: number[] = Array.from({ length: beats }, (_, b) => {
    let max = 1;
    for (let s = 0; s < 6; s++) {
      const v = cells[cellKey(s, b)] ?? "";
      if (v.length > max) max = v.length;
    }
    return max;
  });

  // build string rows
  const lines: string[] = STRING_NAMES.map((name, s) => {
    let row = `${name}|`;
    for (let b = 0; b < beats; b++) {
      const val = cells[cellKey(s, b)] ?? "";
      const w = colWidths[b];
      const padded = val.padEnd(w, "-");
      row += `--${padded}`;
    }
    row += "--|";
    return row;
  });

  // build picking row
  const hasAnyPick = Object.values(picking).some((v) => v !== "");
  if (hasAnyPick) {
    let pickRow = "  "; // 2 spaces for "e|" prefix
    for (let b = 0; b < beats; b++) {
      const sym = picking[b] ?? "";
      const w = colWidths[b];
      // arrow goes at center of the note column: "--" prefix + first char
      const colTotal = 2 + w; // "--" + content
      // place arrow at position 2 (after "--", at first char of content)
      pickRow += " " + sym.padEnd(colTotal - 1, " ");
    }
    lines.push(pickRow.trimEnd());
  }

  return lines.join("\n");
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Props {
  onInsert?: (tab: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TabEditor({ onInsert }: Props) {
  const [state, setState] = useState<TabState>({
    beats: DEFAULT_BEATS,
    cells: {},
    picking: {},
  });
  const [activeCell, setActiveCell] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  const generatedTab = generateTab(state);

  // ── Cell handlers ────────────────────────────────────────────────────────

  const updateCell = useCallback((s: number, b: number, val: string) => {
    // allow fret numbers 0-24, h, p, b, ~, x, /, \
    const sanitized = val.replace(/[^0-9hpb~x/\\]/g, "").slice(0, 4);
    setState((prev) => ({
      ...prev,
      cells: { ...prev.cells, [cellKey(s, b)]: sanitized },
    }));
  }, []);

  const clearCell = useCallback((s: number, b: number) => {
    setState((prev) => {
      const next = { ...prev.cells };
      delete next[cellKey(s, b)];
      return { ...prev, cells: next };
    });
  }, []);

  const cyclePick = useCallback((b: number) => {
    setState((prev) => {
      const cur = prev.picking[b] ?? "";
      const idx = PICK_SYMBOLS.indexOf(cur as PickSymbol);
      const next = PICK_SYMBOLS[(idx + 1) % PICK_SYMBOLS.length];
      const updated = { ...prev.picking };
      if (next === "") {
        delete updated[b];
      } else {
        updated[b] = next;
      }
      return { ...prev, picking: updated };
    });
  }, []);

  // ── Beat management ──────────────────────────────────────────────────────

  const addBeat = () =>
    setState((p) => ({ ...p, beats: p.beats + 1 }));

  const removeBeat = () => {
    if (state.beats <= 1) return;
    const last = state.beats - 1;
    setState((prev) => {
      const cells = { ...prev.cells };
      const picking = { ...prev.picking };
      for (let s = 0; s < 6; s++) delete cells[cellKey(s, last)];
      delete picking[last];
      return { ...prev, beats: prev.beats - 1, cells, picking };
    });
  };

  const clearAll = () =>
    setState({ beats: DEFAULT_BEATS, cells: {}, picking: {} });

  // ── Copy / Insert ────────────────────────────────────────────────────────

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedTab);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // ── Keyboard nav ────────────────────────────────────────────────────────

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    s: number,
    b: number
  ) => {
    if (e.key === "Tab" || e.key === "ArrowRight") {
      e.preventDefault();
      const next =
        b + 1 < state.beats
          ? inputRefs.current[cellKey(s, b + 1)]
          : inputRefs.current[cellKey((s + 1) % 6, 0)];
      next?.focus();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev =
        b > 0
          ? inputRefs.current[cellKey(s, b - 1)]
          : inputRefs.current[cellKey((s + 5) % 6, state.beats - 1)];
      prev?.focus();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      inputRefs.current[cellKey((s + 1) % 6, b)]?.focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      inputRefs.current[cellKey((s + 5) % 6, b)]?.focus();
    }
    if (e.key === "Backspace" && (e.target as HTMLInputElement).value === "") {
      e.preventDefault();
      clearCell(s, b);
    }
    if (e.key === "Delete") {
      e.preventDefault();
      clearCell(s, b);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-smoke bg-ash/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-bone">
          Editor de tablatura
        </h3>
        <div className="flex items-center gap-2 text-xs text-stone-500">
          <kbd className="rounded border border-smoke px-1.5 py-0.5 font-mono">Tab</kbd>
          <span>navegar</span>
          <span className="mx-1 text-stone-700">·</span>
          <kbd className="rounded border border-smoke px-1.5 py-0.5 font-mono">↑↓</kbd>
          <span>cuerdas</span>
        </div>
      </div>

      {/* Grid */}
      <div className="mb-4 overflow-x-auto">
        <table className="border-collapse">
          <tbody>
            {STRING_NAMES.map((name, s) => (
              <tr key={name}>
                {/* String label */}
                <td className="pr-2 text-right font-mono text-sm font-bold text-ember">
                  {name}
                </td>
                {/* Cells */}
                {Array.from({ length: state.beats }, (_, b) => {
                  const key = cellKey(s, b);
                  const val = state.cells[key] ?? "";
                  const isActive = activeCell === key;
                  return (
                    <td
                      key={b}
                      className="relative px-px"
                    >
                      {/* Fret line decoration */}
                      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center">
                        <div className="h-px w-full bg-smoke/60" />
                      </div>
                      <input
                        ref={(el) => {
                          if (el) inputRefs.current[key] = el;
                        }}
                        type="text"
                        value={val}
                        maxLength={4}
                        onChange={(e) => updateCell(s, b, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, s, b)}
                        onFocus={() => setActiveCell(key)}
                        onBlur={() => setActiveCell(null)}
                        className={`relative z-10 h-8 w-10 rounded text-center font-mono text-sm transition outline-none ${
                          val
                            ? "bg-smoke text-amber"
                            : isActive
                            ? "bg-smoke/60 text-stone-300"
                            : "bg-transparent text-stone-600 hover:bg-smoke/30"
                        } ${isActive ? "ring-1 ring-ember/60" : ""}`}
                        placeholder="·"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Picking direction row */}
            <tr>
              <td className="pr-2 text-right text-xs text-stone-600">púa</td>
              {Array.from({ length: state.beats }, (_, b) => {
                const sym = state.picking[b] ?? "";
                return (
                  <td key={b} className="px-px">
                    <button
                      type="button"
                      onClick={() => cyclePick(b)}
                      title="Click para cambiar dirección de púa"
                      className={`h-8 w-10 rounded font-mono text-sm transition ${
                        sym === "↓"
                          ? "bg-ember/20 text-ember"
                          : sym === "↑"
                          ? "bg-amber/20 text-amber"
                          : "text-stone-700 hover:text-stone-500"
                      }`}
                    >
                      {sym || "·"}
                    </button>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Beat controls */}
      <div className="mb-5 flex items-center gap-2">
        <span className="text-xs text-stone-500">{state.beats} tiempos</span>
        <button
          type="button"
          onClick={addBeat}
          className="rounded-lg border border-smoke px-3 py-1 text-sm text-stone-400 transition hover:border-ember/40 hover:text-ember"
        >
          + tiempo
        </button>
        <button
          type="button"
          onClick={removeBeat}
          disabled={state.beats <= 1}
          className="rounded-lg border border-smoke px-3 py-1 text-sm text-stone-400 transition hover:text-rust disabled:opacity-30"
        >
          − tiempo
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="ml-auto text-xs text-stone-600 transition hover:text-rust"
        >
          Limpiar todo
        </button>
      </div>

      {/* Preview */}
      <div className="mb-4">
        <p className="mb-2 text-xs uppercase tracking-wider text-stone-500">
          Vista previa
        </p>
        <div className="overflow-x-auto rounded-xl border border-smoke bg-ink/80 p-4">
          <pre className="tab-block text-sm text-amber">{generatedTab}</pre>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyToClipboard}
          className="rounded-xl border border-smoke px-4 py-2 text-sm font-medium text-stone-300 transition hover:border-ember/40 hover:text-ember"
        >
          {copied ? "✓ Copiado" : "Copiar tablatura"}
        </button>
        {onInsert && (
          <button
            type="button"
            onClick={() => onInsert(generatedTab)}
            className="rounded-xl bg-ember px-4 py-2 text-sm font-bold text-ink transition hover:bg-amber"
          >
            Usar esta tablatura →
          </button>
        )}
      </div>
    </div>
  );
}
