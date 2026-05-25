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
  const formRef = useRef<HTMLFormElement>(null);
  const tabRef = useRef<HTMLTextAreaElement>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-bone">
          Nuevo ejercicio
        </h1>
        <p className="mt-1 text-stone-400">
          Agrega un ejercicio a la biblioteca de Picaflor.
        </p>
      </div>

      {state.success && (
        <div className="mb-6 rounded-xl border border-sage/40 bg-sage/10 px-4 py-3 text-sage">
          ✓ Ejercicio creado correctamente.{" "}
          <Link href="/biblioteca" className="underline hover:text-bone">
            Ver en biblioteca →
          </Link>
        </div>
      )}
      {state.error && (
        <div className="mb-6 rounded-xl border border-rust/40 bg-rust/10 px-4 py-3 text-rust">
          {state.error}
        </div>
      )}

      <form ref={formRef} action={action} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Título" name="title" placeholder="Ej: Alternate picking diagonal" required />
          <Field
            label="Slug (URL)"
            name="slug"
            placeholder="Ej: alt-picking-diagonal"
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
              Técnica
            </label>
            <select
              name="technique"
              required
              className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none focus:border-ember"
            >
              <option value="">Selecciona…</option>
              {(Object.keys(TECHNIQUE_LABELS) as Technique[]).map((k) => (
                <option key={k} value={k}>
                  {TECHNIQUE_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
              Dificultad
            </label>
            <select
              name="difficulty"
              required
              className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none focus:border-ember"
            >
              <option value="">Selecciona…</option>
              {DIFFICULTY_ORDER.map((d) => (
                <option key={d} value={d}>
                  {DIFFICULTY_LABELS[d]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="BPM inicio" name="bpm_start" type="number" placeholder="60" required />
          <Field label="BPM meta" name="bpm_target" type="number" placeholder="140" required />
        </div>

        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
            Descripción
          </label>
          <textarea
            name="description"
            required
            rows={3}
            placeholder="Explica el ejercicio: qué trabaja, cómo ejecutarlo..."
            className="w-full resize-none rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember"
          />
        </div>

        <Field
          label="En qué fijarte (focus)"
          name="focus"
          placeholder="Una línea: el aspecto clave a observar"
          required
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider text-stone-500">
              Tablatura ASCII
            </label>
            <button
              type="button"
              onClick={() => setShowEditor((v) => !v)}
              className="text-xs text-ember underline hover:text-amber transition"
            >
              {showEditor ? "Ocultar editor visual" : "Abrir editor visual ◆"}
            </button>
          </div>

          {showEditor && (
            <div className="mb-3">
              <TabEditor
                onInsert={(tab) => {
                  if (tabRef.current) {
                    tabRef.current.value = tab;
                    tabRef.current.dispatchEvent(
                      new Event("input", { bubbles: true })
                    );
                  }
                  setShowEditor(false);
                }}
              />
            </div>
          )}

          <textarea
            ref={tabRef}
            name="tab"
            required
            rows={8}
            placeholder={`e|--1--2--3--4--|
B|--1--2--3--4--|
G|--1--2--3--4--|
D|--1--2--3--4--|
A|--1--2--3--4--|
E|--1--2--3--4--|
    ↓  ↑  ↓  ↑`}
            className="w-full resize-y rounded-lg border border-smoke bg-ink/60 px-4 py-3 font-mono text-sm text-bone outline-none transition placeholder:text-stone-600 focus:border-ember"
          />
          <p className="mt-1 text-xs text-stone-600">
            Formato: e|, B|, G|, D|, A|, E| · Puedes usar el editor visual para generar la tablatura
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <SubmitButton />
          <Link
            href="/biblioteca"
            className="rounded-xl border border-smoke px-6 py-3 font-medium text-stone-400 transition hover:text-bone"
          >
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
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-ember px-6 py-3 font-display font-bold uppercase tracking-wider text-ink transition hover:bg-amber disabled:opacity-50"
    >
      {pending ? "Guardando…" : "Crear ejercicio"}
    </button>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
        {label}
      </label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember"
      />
    </div>
  );
}
