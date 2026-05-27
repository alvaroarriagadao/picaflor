"use client";

import { useState, useTransition } from "react";
import { saveProfile } from "@/app/perfil/actions";

interface Profile {
  display_name: string | null;
  phone: string | null;
  instagram: string | null;
}

export default function ProfileEditForm({ profile }: { profile: Profile }) {
  const [editing, setEditing]     = useState(false);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg]             = useState<{ ok: boolean; text: string } | null>(null);

  const handleSubmit = (fd: FormData) => {
    setMsg(null);
    startTransition(async () => {
      const result = await saveProfile(fd);
      if (result.error) {
        setMsg({ ok: false, text: result.error });
      } else {
        setMsg({ ok: true, text: "Perfil guardado." });
        setEditing(false);
      }
    });
  };

  if (!editing) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl font-bold text-bone">Mi perfil</h2>
          <button
            onClick={() => setEditing(true)}
            className="rounded-xl border border-smoke px-4 py-1.5 text-sm text-stone-400 transition hover:border-ember/40 hover:text-bone"
          >
            {profile.display_name || profile.phone || profile.instagram ? "Editar" : "+ Completar perfil"}
          </button>
        </div>

        <div className="rounded-2xl border border-smoke bg-ash/40 p-5 space-y-3">
          <ProfileRow
            icon="👤"
            label="Nombre"
            value={profile.display_name}
            placeholder="Sin nombre"
          />
          <ProfileRow
            icon="📱"
            label="WhatsApp"
            value={profile.phone}
            placeholder="Sin teléfono"
          />
          <ProfileRow
            icon="📸"
            label="Instagram"
            value={profile.instagram ? `@${profile.instagram}` : null}
            placeholder="Sin Instagram"
          />
        </div>

        {msg?.ok && (
          <p className="mt-2 text-xs text-sage">{msg.text}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="font-display text-2xl font-bold text-bone mb-4">Editar perfil</h2>

      <form action={handleSubmit} className="rounded-2xl border border-ember/30 bg-ember/5 p-5 space-y-4">
        <Field
          name="display_name"
          label="Nombre"
          placeholder="Ej: Álvaro Arriagada"
          defaultValue={profile.display_name ?? ""}
          type="text"
        />
        <Field
          name="phone"
          label="WhatsApp (opcional)"
          placeholder="+56 9 1234 5678"
          defaultValue={profile.phone ?? ""}
          type="tel"
        />
        <div>
          <label className="mb-1 block text-xs uppercase tracking-wider text-stone-500">
            Instagram (opcional)
          </label>
          <div className="flex items-center rounded-lg border border-smoke bg-ink/60 overflow-hidden focus-within:border-ember transition">
            <span className="px-3 text-stone-500 text-sm select-none">@</span>
            <input
              type="text"
              name="instagram"
              defaultValue={profile.instagram ?? ""}
              placeholder="tuusuario"
              className="flex-1 bg-transparent px-2 py-2.5 text-sm text-bone outline-none placeholder:text-stone-600"
            />
          </div>
        </div>

        {msg?.ok === false && (
          <p className="text-xs text-rust">{msg.text}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-ember px-5 py-2 text-sm font-display font-bold uppercase tracking-wider text-ink transition hover:bg-amber disabled:opacity-50"
          >
            {isPending ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setMsg(null); }}
            className="rounded-xl border border-smoke px-5 py-2 text-sm text-stone-400 transition hover:text-bone"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  name, label, placeholder, defaultValue, type,
}: {
  name: string; label: string; placeholder: string; defaultValue: string; type: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-wider text-stone-500">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-smoke bg-ink/60 px-3 py-2.5 text-sm text-bone outline-none focus:border-ember placeholder:text-stone-600 transition"
      />
    </div>
  );
}

function ProfileRow({
  icon, label, value, placeholder,
}: {
  icon: string; label: string; value: string | null; placeholder: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-7 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-stone-600">{label}</p>
        <p className={`text-sm mt-0.5 ${value ? "text-stone-200" : "text-stone-600 italic"}`}>
          {value ?? placeholder}
        </p>
      </div>
    </div>
  );
}
