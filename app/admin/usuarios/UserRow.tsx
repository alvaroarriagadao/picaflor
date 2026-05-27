"use client";

import { useState, useTransition } from "react";
import { grantPro, revokePro, sendPasswordReset, deleteUser } from "./actions";

interface UserInfo {
  id: string;
  email: string;
  created_at: string;
  plan: "free" | "pro";
  provider: string | null;
  isAdmin: boolean;
  contributionCount: number;
}

export default function UserRow({ user }: { user: UserInfo }) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const act = (fn: () => Promise<{ error: string | null }>, successMsg: string) => {
    setMsg(null);
    startTransition(async () => {
      const r = await fn();
      setMsg(r.error ? `Error: ${r.error}` : successMsg);
    });
  };

  const planBadge = user.isAdmin
    ? <span className="rounded-full bg-ember/20 border border-ember/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ember">Admin</span>
    : user.plan === "pro"
    ? <span className="rounded-full bg-amber/20 border border-amber/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
        Pro {user.provider === "admin" ? "· manual" : user.provider === "contribution" ? "· aportes" : user.provider ? `· ${user.provider}` : ""}
      </span>
    : <span className="rounded-full border border-smoke px-2 py-0.5 text-[10px] font-medium text-stone-500">Free</span>;

  return (
    <div className={`rounded-2xl border px-5 py-4 transition ${
      user.plan === "pro" ? "border-amber/20 bg-amber/3" : "border-smoke bg-ash/30"
    }`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        {/* Left: user info */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-medium text-bone text-sm truncate">{user.email}</p>
            {planBadge}
          </div>
          <p className="text-xs text-stone-600">
            Registrado {new Date(user.created_at).toLocaleDateString("es-CL")}
            {user.contributionCount > 0 && (
              <span className="ml-2 text-stone-500">· {user.contributionCount} aporte{user.contributionCount !== 1 ? "s" : ""} aprobado{user.contributionCount !== 1 ? "s" : ""}</span>
            )}
          </p>
        </div>

        {/* Right: actions */}
        {!user.isAdmin && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {user.plan !== "pro" ? (
              <button
                onClick={() => act(() => grantPro(user.id), "✓ Pro asignado")}
                disabled={isPending}
                className="rounded-lg bg-amber/15 border border-amber/40 px-3 py-1.5 text-xs font-bold text-amber transition hover:bg-amber/25 disabled:opacity-50"
              >
                ◆ Asignar Pro
              </button>
            ) : (
              <button
                onClick={() => act(() => revokePro(user.id), "✓ Vuelto a Free")}
                disabled={isPending}
                className="rounded-lg border border-smoke px-3 py-1.5 text-xs text-stone-400 transition hover:border-stone-500 hover:text-stone-300 disabled:opacity-50"
              >
                Quitar Pro
              </button>
            )}

            <button
              onClick={() => act(() => sendPasswordReset(user.email), "✓ Email enviado")}
              disabled={isPending}
              className="rounded-lg border border-smoke px-3 py-1.5 text-xs text-stone-400 transition hover:border-stone-500 hover:text-stone-300 disabled:opacity-50"
              title="Enviar email de reseteo de contraseña"
            >
              🔑 Reset
            </button>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={isPending}
                className="rounded-lg border border-smoke px-3 py-1.5 text-xs text-stone-600 transition hover:border-rust/40 hover:text-rust disabled:opacity-50"
                title="Eliminar cuenta"
              >
                ×
              </button>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs text-rust">¿Confirmar?</span>
                <button
                  onClick={() => act(() => deleteUser(user.id), "✓ Eliminado")}
                  disabled={isPending}
                  className="rounded-lg bg-rust/15 border border-rust/40 px-2 py-1 text-xs text-rust hover:bg-rust/25"
                >Sí</button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg border border-smoke px-2 py-1 text-xs text-stone-500"
                >No</button>
              </div>
            )}
          </div>
        )}
      </div>

      {msg && (
        <p className={`mt-2 text-xs ${msg.startsWith("Error") ? "text-rust" : "text-sage"}`}>
          {msg}
        </p>
      )}
    </div>
  );
}
