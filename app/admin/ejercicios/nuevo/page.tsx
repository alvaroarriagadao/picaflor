"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createExercise, type FormState } from "./actions";
import {
  TECHNIQUE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_ORDER,
} from "@/lib/types";
import type { Technique, Difficulty } from "@/lib/types";
import Link from "next/link";
import TabEditor from "@/components/TabEditor";

const INITIAL: FormState = { error: null, success: false };

// ─── Difficulty badge colours (inline — no import needed) ────────────────────
const DIFF_STYLES: Record<Difficulty, string> = {
  principiante: "border-sage/40 bg-sage/10 text-sage",
  intermedio:   "border-amber/40 bg-amber/10 text-amber",
  avanzado:     "border-ember/40 bg-ember/10 text-ember",
  experto:      "border-rust/50 bg-rust/15 text-rust",
};

// ─── Live preview panel ──────────────────────────────────────────────────────

interface PreviewData {
  title:       string;
  technique:   string;
  difficulty:  string;
  bpmStart:    string;
  bpmTarget:   string;
  description: string;
  focus:       string;
  tab:         string;
  imagePreview: string | null;
}

function ExercisePreviewPanel({ data }: { data: PreviewData }) {
  const hasContent =
    data.title || data.description || data.focus || data.tab || data.imagePreview;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-smoke/60 bg-ash/20 p-10 text-center">
        <span className="text-4xl opacity-30">🎸</span>
        <p className="text-sm text-stone-600">
          Empieza a rellenar el formulario y aquí verás cómo quedará el ejercicio.
        </p>
      </div>
    );
  }

  const isDiff = (DIFFICULTY_ORDER as string[]).includes(data.difficulty);
  const isTech = Object.keys(TECHNIQUE_LABELS).includes(data.technique);

  return (
    <div className="rounded-2xl border border-smoke/60 bg-ash/40 overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {isTech && (
            <span className="inline-flex items-center rounded-full border border-smoke bg-smoke/40 px-3 py-1 text-xs font-medium uppercase tracking-wider text-stone-300">
              {TECHNIQUE_LABELS[data.technique as Technique]}
            </span>
          )}
          {isDiff && (
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider ${DIFF_STYLES[data.difficulty as Difficulty]}`}>
              {DIFFICULTY_LABELS[data.difficulty as Difficulty]}
            </span>
          )}
        </div>

        <h2 className="font-display text-xl font-extrabold text-bone leading-tight">
          {data.title || <span className="text-stone-600">Sin título</span>}
        </h2>

        {(data.bpmStart || data.bpmTarget) && (
          <div className="mt-2 flex items-center gap-2 text-xs text-stone-400">
            <span className="font-mono">
              {data.bpmStart ? `${data.bpmStart} BPM` : "—"}
            </span>
            <span className="text-stone-600">→ meta</span>
            <span className="font-mono font-bold text-amber">
              {data.bpmTarget ? `${data.bpmTarget} BPM` : "—"}
            </span>
          </div>
        )}
      </div>

      {/* Image */}
      {data.imagePreview && (
        <div className="mx-5 mb-3 overflow-hidden rounded-xl border border-smoke/50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={data.imagePreview} alt="Imagen del ejercicio" className="w-full object-contain max-h-48" />
        </div>
      )}

      {/* Description */}
      {data.description && (
        <div className="px-5 pb-3">
          <p className="text-sm text-stone-400 leading-relaxed">{data.description}</p>
        </div>
      )}

      {/* Focus */}
      {data.focus && (
        <div className="mx-5 mb-3 rounded-lg border border-ember/20 bg-ember/5 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ember mb-1">En qué fijarte</p>
          <p className="text-sm text-stone-300">{data.focus}</p>
        </div>
      )}

      {/* Tab */}
      {data.tab && (
        <div className="px-5 pb-5">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500">Tablatura</p>
          <div className="overflow-x-auto rounded-xl border border-smoke bg-ink/80 p-4">
            <pre className="tab-block text-xs text-amber sm:text-sm"
              style={{ whiteSpace: "pre", minWidth: "max-content" }}>
              {data.tab}
            </pre>
          </div>
        </div>
      )}

      {!data.tab && !data.description && !data.focus && !data.imagePreview && data.title && (
        <div className="px-5 pb-5 text-xs text-stone-600 italic">
          Agrega descripción, focus o tablatura para ver más detalles.
        </div>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function NuevoEjercicioPage() {
  const [state, action]   = useFormState(createExercise, INITIAL);
  const formRef            = useRef<HTMLFormElement>(null);
  const tabRef             = useRef<HTMLTextAreaElement>(null);
  const fileInputRef       = useRef<HTMLInputElement>(null);

  const [showEditor, setShowEditor]     = useState(false);
  const [showPreview, setShowPreview]   = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName]       = useState<string | null>(null);
  const [dragging, setDragging]         = useState(false);

  // Technique selector
  const [techSelect, setTechSelect] = useState<string>("");
  const [customTech, setCustomTech] = useState("");
  const finalTech = techSelect === "__otro__" ? customTech.trim() : techSelect;

  // ── Preview data (mirrors form fields) ────────────────────────────────────
  const [preview, setPreview] = useState<PreviewData>({
    title: "", technique: "", difficulty: "",
    bpmStart: "", bpmTarget: "", description: "",
    focus: "", tab: "", imagePreview: null,
  });

  const p = (field: Partial<PreviewData>) =>
    setPreview(prev => ({ ...prev, ...field }));

  // Sync technique into preview state
  useEffect(() => { p({ technique: finalTech }); }, [finalTech]);
  // Sync image into preview state
  useEffect(() => { p({ imagePreview }); }, [imagePreview]);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setImagePreview(null); setImageName(null);
      setTechSelect(""); setCustomTech("");
      setPreview({ title: "", technique: "", difficulty: "", bpmStart: "", bpmTarget: "", description: "", focus: "", tab: "", imagePreview: null });
    }
  }, [state.success]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 8 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setImageName(file.name);
    const dt = new DataTransfer();
    dt.items.add(file);
    if (fileInputRef.current) fileInputRef.current.files = dt.files;
  };

  return (
    <div>
      {/* Back + header */}
      <div className="mb-6">
        <Link href="/admin/ejercicios"
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-ember transition mb-3">
          ← Admin · Ejercicios
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-bone">Nuevo ejercicio</h1>
            <p className="mt-1 text-stone-400">Agrega un ejercicio directamente a la biblioteca.</p>
          </div>
          {/* Preview toggle */}
          <button type="button" onClick={() => setShowPreview(v => !v)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
              showPreview
                ? "border-ember/40 bg-ember/10 text-ember"
                : "border-smoke text-stone-400 hover:border-ember/30 hover:text-ember"
            }`}>
            <span className="text-base">👁</span>
            {showPreview ? "Ocultar preview" : "Ver preview"}
          </button>
        </div>
      </div>

      {state.success && (
        <div className="mb-6 rounded-xl border border-sage/40 bg-sage/10 px-4 py-3 text-sage">
          ✓ Ejercicio creado correctamente.{" "}
          <Link href="/biblioteca" className="underline hover:text-bone">Ver en biblioteca →</Link>
        </div>
      )}
      {state.error && (
        <div className="mb-6 rounded-xl border border-rust/40 bg-rust/10 px-4 py-3 text-rust">
          {state.error}
        </div>
      )}

      {/* ── Two-column layout on xl ─────────────────────────────────────────── */}
      <div className={`gap-8 ${showPreview ? "xl:grid xl:grid-cols-[1fr_380px]" : ""}`}>

        {/* ── Form column ─────────────────────────────────────────────────── */}
        <form ref={formRef} action={action} className="space-y-5" encType="multipart/form-data">
          <input type="hidden" name="technique" value={finalTech} />

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
                Título <span className="text-ember ml-1">*</span>
              </label>
              <input type="text" name="title" required placeholder="Ej: Alternate picking diagonal"
                onChange={e => p({ title: e.target.value })}
                className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
            </div>
            <Field label="Slug (URL)" name="slug" placeholder="Ej: alt-picking-diagonal" required />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Technique */}
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
                Técnica <span className="normal-case text-stone-600">(opcional)</span>
              </label>
              <select value={techSelect}
                onChange={e => setTechSelect(e.target.value)}
                className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none focus:border-ember">
                <option value="">Sin especificar</option>
                {(Object.keys(TECHNIQUE_LABELS) as Technique[]).map(k => (
                  <option key={k} value={k}>{TECHNIQUE_LABELS[k]}</option>
                ))}
                <option value="__otro__">Otro / Personalizado…</option>
              </select>
              {techSelect === "__otro__" && (
                <input type="text" value={customTech}
                  onChange={e => setCustomTech(e.target.value)}
                  placeholder="Escribe la técnica…"
                  className="mt-2 w-full rounded-lg border border-ember/50 bg-ink/60 px-4 py-2.5 text-sm text-bone outline-none focus:border-ember placeholder:text-stone-600" />
              )}
            </div>

            {/* Difficulty */}
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">Dificultad</label>
              <select name="difficulty"
                onChange={e => p({ difficulty: e.target.value })}
                className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none focus:border-ember">
                <option value="">Sin especificar</option>
                {DIFFICULTY_ORDER.map(d => (
                  <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">BPM inicio</label>
              <input type="number" name="bpm_start" placeholder="60"
                onChange={e => p({ bpmStart: e.target.value })}
                className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">BPM meta</label>
              <input type="number" name="bpm_target" placeholder="140"
                onChange={e => p({ bpmTarget: e.target.value })}
                className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
              Descripción <span className="normal-case text-stone-600">(opcional)</span>
            </label>
            <textarea name="description" rows={3}
              onChange={e => p({ description: e.target.value })}
              placeholder="Explica el ejercicio: qué trabaja, cómo ejecutarlo…"
              className="w-full resize-none rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
              En qué fijarte (focus)
            </label>
            <input type="text" name="focus"
              onChange={e => p({ focus: e.target.value })}
              placeholder="Una línea: el aspecto clave a observar (opcional)"
              className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
          </div>

          {/* ── Imagen ─────────────────────────────────────────────────────── */}
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
              Imagen / Screenshot{" "}
              <span className="normal-case text-stone-600">(opcional · jpg, png, webp · max 8 MB)</span>
            </label>
            {imagePreview ? (
              <div className="relative overflow-hidden rounded-2xl border border-ember/40 bg-ash/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="w-full object-contain max-h-64" />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/80 px-4 py-2 backdrop-blur-sm">
                  <span className="text-xs text-stone-400 truncate">{imageName}</span>
                  <button type="button"
                    onClick={() => { setImagePreview(null); setImageName(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    className="text-xs text-stone-400 hover:text-rust transition shrink-0 ml-3">
                    × Cambiar
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 transition ${
                  dragging ? "border-ember bg-ember/5" : "border-smoke bg-ink/30 hover:border-ember/40"
                }`}>
                <span className="text-3xl">📷</span>
                <p className="text-sm text-stone-400">{dragging ? "Suelta aquí" : "Arrastra o haz clic para subir imagen"}</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" name="exercise_image"
              accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {/* ── Tablatura ASCII ─────────────────────────────────────────────── */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-stone-500">
                Tablatura ASCII{" "}
                <span className="normal-case text-stone-600">(opcional si hay imagen)</span>
              </label>
              <button type="button" onClick={() => setShowEditor(v => !v)}
                className="text-xs text-ember underline hover:text-amber transition">
                {showEditor ? "Ocultar editor visual" : "Abrir editor visual ◆"}
              </button>
            </div>

            {showEditor && (
              <div className="mb-3">
                <TabEditor onInsert={tab => {
                  if (tabRef.current) {
                    tabRef.current.value = tab;
                    tabRef.current.dispatchEvent(new Event("input", { bubbles: true }));
                  }
                  p({ tab });
                  setShowEditor(false);
                }} />
              </div>
            )}

            <textarea ref={tabRef} name="tab" rows={8}
              onChange={e => p({ tab: e.target.value })}
              placeholder={`e|--1--2--3--4--|
B|--1--2--3--4--|
G|--1--2--3--4--|
D|--1--2--3--4--|
A|--1--2--3--4--|
E|--1--2--3--4--|
    ↓  ↑  ↓  ↑`}
              className="w-full resize-y rounded-lg border border-smoke bg-ink/60 px-4 py-3 font-mono text-sm text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
            <p className="mt-1 text-xs text-stone-600">
              Formato: e|, B|, G|, D|, A|, E| · Usa el editor visual para generar la tablatura
            </p>
          </div>

          {/* Guitar Pro file */}
          <GpFileField />

          <div className="flex gap-3 pt-2">
            <SubmitButton />
            <Link href="/admin/ejercicios"
              className="rounded-xl border border-smoke px-6 py-3 font-medium text-stone-400 transition hover:text-bone">
              Cancelar
            </Link>
          </div>
        </form>

        {/* ── Preview column ───────────────────────────────────────────────── */}
        {showPreview && (
          <div className="mt-6 xl:mt-0">
            <div className="xl:sticky xl:top-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                  Vista previa en tiempo real
                </span>
                <span className="text-[10px] text-stone-700">— así se verá el ejercicio</span>
              </div>
              <ExercisePreviewPanel data={preview} />
              <p className="mt-2 text-[10px] text-stone-700 text-center">
                La vista previa se actualiza mientras escribes
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}
      className="rounded-xl bg-ember px-6 py-3 font-display font-bold uppercase tracking-wider text-ink transition hover:bg-amber disabled:opacity-50">
      {pending ? "Guardando…" : "Crear ejercicio"}
    </button>
  );
}

function GpFileField() {
  const [fileName, setFileName] = useState<string | null>(null);
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
        Archivo Guitar Pro{" "}
        <span className="normal-case text-stone-600">(opcional · .gp .gp5 .gpx .gp3 .gp4 .gp7)</span>
      </label>
      <label className={`flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-4 py-4 transition ${
        fileName ? "border-ember/50 bg-ember/5" : "border-smoke bg-ink/40 hover:border-ember/40"
      }`}>
        <span className="text-xl text-ember">♩</span>
        <div className="min-w-0 flex-1">
          {fileName
            ? <span className="truncate text-sm font-medium text-amber">{fileName}</span>
            : <span className="text-sm text-stone-400">Arrastra o haz clic para adjuntar tablatura Guitar Pro</span>}
        </div>
        {fileName && <span className="shrink-0 text-xs text-sage">✓ listo</span>}
        <input type="file" name="tab_file" accept=".gp,.gp3,.gp4,.gp5,.gpx,.gp7" className="sr-only"
          onChange={e => setFileName(e.target.files?.[0]?.name ?? null)} />
      </label>
    </div>
  );
}

function Field({ label, name, placeholder, type = "text", required }: {
  label: string; name: string; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
        {label}
        {required && <span className="text-ember ml-1">*</span>}
      </label>
      <input type={type} name={name} placeholder={placeholder} required={required}
        className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
    </div>
  );
}
