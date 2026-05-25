"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateExercise, type FormState } from "../actions";
import { TECHNIQUE_LABELS, DIFFICULTY_LABELS, DIFFICULTY_ORDER } from "@/lib/types";
import type { Exercise, Technique } from "@/lib/types";
import Link from "next/link";
import TabEditor from "@/components/TabEditor";
import { createClient } from "@/lib/supabase-client";
import { notFound, useRouter } from "next/navigation";

const INITIAL: FormState = { error: null, success: false };

export default function EditarEjercicioPage({ params }: { params: { id: string } }) {
  const [exercise, setExercise] = useState<Exercise | null | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("exercises")
      .select("*")
      .eq("id", params.id)
      .single()
      .then(({ data }) => setExercise(data as Exercise | null));
  }, [params.id]);

  if (exercise === undefined)
    return <div className="py-20 text-center text-stone-500 animate-pulse">Cargando ejercicio…</div>;
  if (exercise === null) return notFound();

  return <EditForm exercise={exercise} />;
}

function EditForm({ exercise }: { exercise: Exercise }) {
  const boundAction = updateExercise.bind(null, exercise.id);
  const [state, action] = useFormState(boundAction, INITIAL);
  const tabRef = useRef<HTMLTextAreaElement>(null);
  const [showEditor, setShowEditor] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state.success) router.push("/admin/ejercicios");
  }, [state.success, router]);

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/ejercicios" className="text-sm text-stone-500 hover:text-ember transition">
          ← Volver a ejercicios
        </Link>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-bone">Editar ejercicio</h1>
        <p className="mt-1 text-stone-400 font-mono text-sm">/{exercise.slug}</p>
      </div>

      {state.error && (
        <div className="mb-6 rounded-xl border border-rust/40 bg-rust/10 px-4 py-3 text-rust">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Título" name="title" defaultValue={exercise.title} required />
          <Field label="Slug (URL)" name="slug" defaultValue={exercise.slug} required />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">Técnica</label>
            <select name="technique" defaultValue={exercise.technique} required
              className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none focus:border-ember">
              {(Object.keys(TECHNIQUE_LABELS) as Technique[]).map((k) => (
                <option key={k} value={k}>{TECHNIQUE_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">Dificultad</label>
            <select name="difficulty" defaultValue={exercise.difficulty} required
              className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none focus:border-ember">
              {DIFFICULTY_ORDER.map((d) => (
                <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="BPM inicio" name="bpm_start" type="number" defaultValue={String(exercise.bpm_start)} required />
          <Field label="BPM meta" name="bpm_target" type="number" defaultValue={String(exercise.bpm_target)} required />
        </div>

        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">Descripción</label>
          <textarea name="description" defaultValue={exercise.description} required rows={3}
            className="w-full resize-none rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
        </div>

        <Field label="Focus" name="focus" defaultValue={exercise.focus} required />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider text-stone-500">Tablatura ASCII</label>
            <button type="button" onClick={() => setShowEditor((v) => !v)}
              className="text-xs text-ember underline hover:text-amber transition">
              {showEditor ? "Ocultar editor visual" : "Abrir editor visual ◆"}
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
          <textarea ref={tabRef} name="tab" defaultValue={exercise.tab} required rows={8}
            className="w-full resize-y rounded-lg border border-smoke bg-ink/60 px-4 py-3 font-mono text-sm text-bone outline-none transition focus:border-ember" />
        </div>

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
      {pending ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}

function Field({ label, name, defaultValue, type = "text", required }: {
  label: string; name: string; defaultValue?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">{label}</label>
      <input type={type} name={name} defaultValue={defaultValue} required={required}
        className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember" />
    </div>
  );
}
