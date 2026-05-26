"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createExercise, type FormState } from "./actions";
import { TECHNIQUE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_ORDER } from "@/lib/types";
import type { Technique } from "@/lib/types";
import Link from "next/link";
import TabEditor from "@/components/TabEditor";

const INITIAL: FormState = { error: null, success: false };

export default function NuevoEjercicioPage() {
  const [state, action] = useFormState(createExercise, INITIAL);
  const formRef    = useRef<HTMLFormElement>(null);
  const tabRef     = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showEditor, setShowEditor]       = useState(false);
  const [imagePreview, setImagePreview]   = useState<string | null>(null);
  const [imageName, setImageName]         = useState<string | null>(null);
  const [dragging, setDragging]           = useState(false);

  // Technique selector with "Otro" option
  const [techSelect, setTechSelect]       = useState<string>("");
  const [customTech, setCustomTech]       = useState("");
  const finalTech = techSelect === "__otro__" ? customTech.trim() : techSelect;

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setImagePreview(null);
      setImageName(null);
      setTechSelect("");
      setCustomTech("");
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
      <div className="mb-8">
        <Link href="/admin/ejercicios"
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-ember transition mb-3">
          ← Admin · Ejercicios
        </Link>
        <h1 className="font-display text-3xl font-extrabold text-bone">Nuevo ejercicio</h1>
        <p className="mt-1 text-stone-400">Agrega un ejercicio directamente a la biblioteca.</p>
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

      <form ref={formRef} action={action} className="space-y-5" encType="multipart/form-data">

        {/* Hidden fields for managed state */}
        <input type="hidden" name="technique" value={finalTech} />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Título" name="title" placeholder="Ej: Alternate picking diagonal" required />
          <Field label="Slug (URL)" name="slug" placeholder="Ej: alt-picking-diagonal" required />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Technique with "Otro" */}
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
              Técnica <span className="normal-case text-stone-600">(opcional)</span>
            </label>
            <select value={techSelect} onChange={e => setTechSelect(e.target.value)}
              className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none focus:border-ember">
              <option value="">Sin especificar</option>
              {(Object.keys(TECHNIQUE_LABELS) as Technique[]).map(k => (
                <option key={k} value={k}>{TECHNIQUE_LABELS[k]}</option>
              ))}
              <option value="__otro__">Otro / Personalizado…</option>
            </select>
            {techSelect === "__otro__" && (
              <input type="text" value={customTech} onChange={e => setCustomTech(e.target.value)}
                placeholder="Escribe la técnica…"
                className="mt-2 w-full rounded-lg border border-ember/50 bg-ink/60 px-4 py-2.5 text-sm text-bone outline-none focus:border-ember placeholder:text-stone-600" />
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">Dificultad</label>
            <select name="difficulty"
              className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none focus:border-ember">
              <option value="">Sin especificar</option>
              {DIFFICULTY_ORDER.map(d => (
                <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="BPM inicio" name="bpm_start" type="number" placeholder="60" />
          <Field label="BPM meta" name="bpm_target" type="number" placeholder="140" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
            Descripción <span className="normal-case text-stone-600">(opcional)</span>
          </label>
          <textarea name="description" rows={3}
            placeholder="Explica el ejercicio: qué trabaja, cómo ejecutarlo…"
            className="w-full resize-none rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
        </div>

        <Field label="En qué fijarte (focus)" name="focus"
          placeholder="Una línea: el aspecto clave a observar (opcional)" />

        {/* ── Imagen (nueva) ─────────────────────────────────────── */}
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

        {/* ── Tablatura ASCII ────────────────────────────────────── */}
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
                setShowEditor(false);
              }} />
            </div>
          )}

          <textarea ref={tabRef} name="tab" rows={8}
            placeholder={`e|--1--2--3--4--|
B|--1--2--3--4--|
G|--1--2--3--4--|
D|--1--2--3--4--|
A|--1--2--3--4--|
E|--1--2--3--4--|
    ↓  ↑  ↓  ↑`}
            className="w-full resize-y rounded-lg border border-smoke bg-ink/60 px-4 py-3 font-mono text-sm text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
          <p className="mt-1 text-xs text-stone-600">
            Formato: e|, B|, G|, D|, A|, E| · Puedes usar el editor visual para generar la tablatura
          </p>
        </div>

        {/* Archivo Guitar Pro (opcional) */}
        <GpFileField />

        <div className="flex gap-3 pt-2">
          <SubmitButton />
          <Link href="/admin/ejercicios"
            className="rounded-xl border border-smoke px-6 py-3 font-medium text-stone-400 transition hover:text-bone">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}

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
