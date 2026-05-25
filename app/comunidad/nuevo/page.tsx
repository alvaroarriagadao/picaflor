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
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-2 text-stone-500 text-sm">
          <span className="text-amber">◆</span>
          <span className="uppercase tracking-widest font-display text-xs">Comunidad · Picaflor</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold text-bone">Comparte un ejercicio</h1>
        <p className="mt-2 text-stone-400 leading-relaxed">
          Envía un ejercicio de técnica a la comunidad. El equipo lo revisará y,
          si cumple los estándares, quedará visible para todos los guitarristas.
        </p>
      </div>

      {state.success && (
        <div className="mb-6 rounded-xl border border-sage/40 bg-sage/10 px-5 py-4">
          <p className="font-bold text-sage">¡Ejercicio enviado!</p>
          <p className="mt-1 text-sm text-stone-400">
            Lo revisaremos pronto. Gracias por contribuir a la comunidad.
          </p>
          <Link href="/biblioteca" className="mt-3 inline-block text-sm text-ember hover:underline">
            Ver biblioteca →
          </Link>
        </div>
      )}

      {state.error && (
        <div className="mb-6 rounded-xl border border-rust/40 bg-rust/10 px-4 py-3 text-rust text-sm">
          {state.error}
        </div>
      )}

      <div className="mb-6 rounded-xl border border-smoke bg-ash/40 p-4 text-sm text-stone-400">
        <p className="font-medium text-stone-300 mb-1">¿Qué buscamos?</p>
        <ul className="space-y-1 list-disc list-inside text-stone-500">
          <li>Ejercicios técnicos originales y bien descritos</li>
          <li>Tablatura correctamente formateada</li>
          <li>BPM realistas y progresivos</li>
          <li>Descripción clara que ayude al guitarrista a entender el objetivo</li>
        </ul>
      </div>

      <form ref={formRef} action={action} className="space-y-5">
        <Field label="Título del ejercicio" name="title" placeholder="Ej: Legato en tríadas ascendentes" required />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">Técnica</label>
            <select name="technique" required
              className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none focus:border-ember">
              <option value="">Selecciona…</option>
              {(Object.keys(TECHNIQUE_LABELS) as Technique[]).map((k) => (
                <option key={k} value={k}>{TECHNIQUE_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">Dificultad</label>
            <select name="difficulty" required
              className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none focus:border-ember">
              <option value="">Selecciona…</option>
              {DIFFICULTY_ORDER.map((d) => (
                <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="BPM inicio" name="bpm_start" type="number" placeholder="60" required />
          <Field label="BPM meta" name="bpm_target" type="number" placeholder="140" required />
        </div>

        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">Descripción</label>
          <textarea name="description" required rows={3} placeholder="Explica el ejercicio: qué trabaja, cómo ejecutarlo…"
            className="w-full resize-none rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
        </div>

        <Field label="En qué fijarte (focus)" name="focus" placeholder="El aspecto clave a observar" required />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider text-stone-500">Tablatura ASCII</label>
            <button type="button" onClick={() => setShowEditor((v) => !v)}
              className="text-xs text-ember underline hover:text-amber transition">
              {showEditor ? "Ocultar editor" : "Abrir editor visual ◆"}
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
          <textarea ref={tabRef} name="tab" required rows={8}
            placeholder={`e|--0--2--3--5--|
B|--0--2--3--5--|
G|--0--2--3--5--|
D|--------------|
A|--------------|
E|--------------|`}
            className="w-full resize-y rounded-lg border border-smoke bg-ink/60 px-4 py-3 font-mono text-sm text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
        </div>

        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
            Notas para el revisor{" "}
            <span className="normal-case text-stone-600">(opcional)</span>
          </label>
          <textarea name="submitter_notes" rows={2}
            placeholder="Contexto adicional, inspiración, o cualquier detalle que quieras compartir…"
            className="w-full resize-none rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-sm text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
        </div>

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

function Field({ label, name, placeholder, type = "text", required }: {
  label: string; name: string; placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">{label}</label>
      <input type={type} name={name} placeholder={placeholder} required={required}
        className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
    </div>
  );
}
