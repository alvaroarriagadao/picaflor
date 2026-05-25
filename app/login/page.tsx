"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErr(null);
    setMsg(null);
    if (!email || !password) {
      setErr("Ingresa tu correo y contraseña.");
      return;
    }
    setLoading(true);
    const supabase = createClient();

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErr("Credenciales incorrectas. Revisa tus datos.");
        setLoading(false);
        return;
      }
      router.push("/practica");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        setErr(error.message);
        setLoading(false);
        return;
      }
      setMsg(
        "Cuenta creada. Si la confirmación por correo está activa, revisa tu bandeja. Si no, ya puedes iniciar sesión."
      );
      setMode("login");
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5">
      {/* Atmósfera de fondo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-ember/20 blur-[120px]" />
        <div className="absolute -right-10 bottom-0 h-80 w-80 rounded-full bg-amber/10 blur-[140px]" />
      </div>

      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl text-ember">◆</div>
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-bone">
            Picaflor
          </h1>
          <p className="mt-3 text-stone-400">
            Un lick cada día. Técnica que se vuelve músculo.
          </p>
        </div>

        <div className="rounded-2xl border border-smoke bg-ash/60 p-7 backdrop-blur">
          <div className="mb-6 flex rounded-lg border border-smoke bg-ink/40 p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === "login"
                  ? "bg-ember text-ink"
                  : "text-stone-400 hover:text-bone"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === "signup"
                  ? "bg-ember text-ink"
                  : "text-stone-400 hover:text-bone"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
                Correo
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="tu@correo.com"
                className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-stone-500">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="••••••••"
                className="w-full rounded-lg border border-smoke bg-ink/60 px-4 py-3 text-bone outline-none transition placeholder:text-stone-600 focus:border-ember"
              />
            </div>

            {err && (
              <p className="rounded-lg border border-rust/40 bg-rust/10 px-3 py-2 text-sm text-rust">
                {err}
              </p>
            )}
            {msg && (
              <p className="rounded-lg border border-sage/40 bg-sage/10 px-3 py-2 text-sm text-sage">
                {msg}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full rounded-xl bg-ember py-3.5 font-display font-bold uppercase tracking-wider text-ink transition hover:bg-amber disabled:opacity-50"
            >
              {loading
                ? "Cargando…"
                : mode === "login"
                ? "Entrar"
                : "Crear cuenta"}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-stone-600">
          Hecho para guitarristas que practican en serio.
        </p>
      </div>
    </main>
  );
}
