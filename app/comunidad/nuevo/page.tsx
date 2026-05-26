"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitExercise, type FormState } from "./actions";
import { TECHNIQUE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_ORDER } from "@/lib/types";
import type { Technique } from "@/lib/types";
import Link from "next/link";
import TabEditor from "@/components/TabEditor";

const INITIAL: FormState = { error: null, success: false };

export default function ComunidadNuevoPage() {
  const [state, action] = useFormState(submitExercise, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  const tabRef  = useRef<HTMLTextAreaElement>(null);
  const [showEditor, setShowEditor]       = useState(false);
  const [showDetails, setShowDetails]     = useState(false);
  const [imagePreview, setImagePreview]   = useState<string | null>(null);
  const [imageName, setImageName]         = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging]           = useState(false);
  // "Otro" technique state
  const [techSelect, setTechSelect]       = useState("");
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
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setImageName(file.name);
    // asignar al input
    const dt = new DataTransfer();
    dt.items.add(file);
    if (fileInputRef.current) fileInputRef.current.files = dt.files;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2 text-stone-500 text-sm">
          <span className="text-amber">◆</span>
          <span className="uppercase tracking-widest font-display text-xs">Comunidad · Picaflor</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold text-bone">Comparte un ejercicio</h1>
        <p className="mt-2 text-stone-400 leading-relaxed">
          Sube un screenshot o escribe la tablatura. El admin lo revisará antes de publicarlo.
        </p>
      </div>

      {/* Success */}
      {state.success && (
        <div className="mb-6 rounded-2xl border border-sage/40 bg-sage/10 px-5 py-5">
          <p className="font-display font-bold text-sage text-lg">¡Ejercicio enviado!</p>
          <p className="mt-1 text-sm text-stone-400">
            Lo revisaremos pronto. Gracias por contribuir a la comunidad.
          </p>
          <Link href="/biblioteca" className="mt-3 inline-block text-sm text-ember hover:underline transition">
            Ver biblioteca →
          </Link>
        </div>
      )}
      {state.error && (
        <div className="mb-6 rounded-xl border border-rust/40 bg-rust/10 px-4 py-3 text-rust text-sm">
          {state.error}
        </div>
      )}

      <form ref={formRef} action={action} className="space-y-6" encType="multipart/form-data">
        {/* Hidden technique field managed by state */}
        <input type="hidden" name="technique" value={finalTech} />

        {/* Título */}
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
            Título <span className="text-ember">*</span>
          </label>
          <input type="text" name="title" required
            placeholder="Ej: Legato en tríadas ascendentes"
            className="w-full rounded-xl border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
        </div>

        {/* Imagen */}
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
            Imagen del ejercicio{" "}
            <span className="normal-case text-stone-600">(screenshot · jpg, png, webp · max 8MB)</span>
          </label>

          {imagePreview ? (
            /* Preview */
            <div className="relative overflow-hidden rounded-2xl border border-ember/40 bg-ash/40">
              <img src={imagePreview} alt="Preview" className="w-full object-contain max-h-72" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-ink/80 px-4 py-2 backdrop-blur-sm">
                <span className="text-xs text-stone-400 truncate">{imageName}</span>
                <button type="button"
                  onClick={() => { setImagePreview(null); setImageName(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  className="text-xs text-stone-400 hover:text-rust transition shrink-0 ml-3">
                  × Cambiar imagen
                </button>
              </div>
            </div>
          ) : (
            /* Drop zone */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition ${
                dragging
                  ? "border-ember bg-ember/5"
                  : "border-smoke bg-ash/30 hover:border-ember/50 hover:bg-ash/50"
              }`}>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-smoke text-3xl">
                📷
              </div>
              <div className="text-center">
                <p className="font-medium text-stone-300">
                  {dragging ? "Suelta la imagen aquí" : "Arrastra tu screenshot aquí"}
                </p>
                <p className="text-sm text-stone-500 mt-1">o haz clic para seleccionar</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            name="exercise_image"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        {/* Separador o/y */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-smoke/60" />
          <span className="text-xs text-stone-600 uppercase tracking-wider">o también</span>
          <div className="flex-1 h-px bg-smoke/60" />
        </div>

        {/* Tablatura ASCII (opcional) */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider text-stone-500">
              Tablatura ASCII{" "}
              <span className="normal-case text-stone-600">(opcional)</span>
            </label>
            <button type="button" onClick={() => setShowEditor((v) => !v)}
              className="text-xs text-ember hover:text-amber underline transition">
              {showEditor ? "Ocultar editor" : "Editor visual ◆"}
            </button>
          </div>
          {showEditor && (
            <div className="mb-3">
              <TabEditor onInsert={(tab) => {
                if (tabRef.current) {
                  tabRef.current.value = tab;
                  tabRef.current.dispatchEvent(new Event("input", { bubbles: true }));
                }
                setShowEditor(false);
              }} />
            </div>
          )}
          <textarea ref={tabRef} name="tab" rows={6}
            placeholder={`e|--0--2--3--5--|
B|--0--2--3--5--|
G|--0--2--3--5--|
D|--------------|
A|--------------|
E|--------------|`}
            className="w-full resize-y rounded-xl border border-smoke bg-ink/60 px-4 py-3 font-mono text-sm text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
        </div>

        {/* Descripción */}
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
            Descripción{" "}
            <span className="normal-case text-stone-600">(opcional)</span>
          </label>
          <textarea name="description" rows={2}
            placeholder="Qué trabaja este ejercicio, cómo ejecutarlo…"
            className="w-full resize-none rounded-xl border border-smoke bg-ink/60 px-4 py-3 text-sm text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
        </div>

        {/* Detalles adicionales (colapsable) */}
        <div>
          <button type="button" onClick={() => setShowDetails(v => !v)}
            className="flex items-center gap-2 text-sm text-stone-400 hover:text-bone transition">
            <span className={`transition-transform duration-200 ${showDetails ? "rotate-90" : ""}`}>▶</span>
            Detalles adicionales
            <span className="text-xs text-stone-600">(técnica, dificultad, BPM, focus)</span>
          </button>

          {showDetails && (
            <div className="mt-4 space-y-4 rounded-2xl border border-smoke bg-ash/30 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">Técnica</label>
                  <select value={techSelect} onChange={e => setTechSelect(e.target.value)}
                    className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-sm text-bone outline-none focus:border-ember">
                    <option value="">Sin especificar</option>
                    {(Object.keys(TECHNIQUE_LABELS) as Technique[]).map((k) => (
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
                    className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-sm text-bone outline-none focus:border-ember">
                    <option value="">Sin especificar</option>
                    {DIFFICULTY_ORDER.map((d) => (
                      <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">BPM inicio</label>
                  <input type="number" name="bpm_start" placeholder="60"
                    className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-sm text-bone outline-none focus:border-ember placeholder:text-stone-600" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">BPM meta</label>
                  <input type="number" name="bpm_target" placeholder="140"
                    className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-sm text-bone outline-none focus:border-ember placeholder:text-stone-600" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">Focus</label>
                <input type="text" name="focus" placeholder="El aspecto clave a observar"
                  className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-sm text-bone outline-none focus:border-ember placeholder:text-stone-600" />
              </div>
            </div>
          )}
        </div>

        {/* Notas al revisor */}
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
            Nota para el revisor{" "}
            <span className="normal-case text-stone-600">(opcional)</span>
          </label>
          <textarea name="submitter_notes" rows={2}
            placeholder="Contexto, inspiración, fuente del ejercicio…"
            className="w-full resize-none rounded-xl border border-smoke bg-ink/60 px-4 py-3 text-sm text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <SubmitButton />
          <Link href="/biblioteca"
            className="rounded-xl border border-smoke px-6 py-3 font-medium text-stone-400 transition hover:text-bone">
            Ver biblioteca
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
      {pending ? "Enviando…" : "Enviar ejercicio"}
    </button>
  );
}
