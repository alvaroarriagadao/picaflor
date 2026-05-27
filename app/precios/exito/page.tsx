import Link from "next/link";

export default function ExitoPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center px-5">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-sage/40 bg-sage/10 text-4xl">
        🎸
      </div>

      <h1 className="font-display text-3xl font-extrabold text-bone mb-3">
        ¡Bienvenido a Pro!
      </h1>
      <p className="text-stone-400 mb-8 max-w-sm leading-relaxed">
        Tu pago fue procesado correctamente. Ya tienes acceso completo a la
        biblioteca y al planificador.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/biblioteca"
          className="rounded-xl bg-ember px-6 py-3 font-display font-bold uppercase tracking-wider text-ink transition hover:bg-amber"
        >
          Explorar biblioteca →
        </Link>
        <Link
          href="/planificador"
          className="rounded-xl border border-smoke px-6 py-3 font-medium text-stone-400 transition hover:text-bone"
        >
          Ir al planificador
        </Link>
      </div>

      <p className="mt-8 text-xs text-stone-600">
        Gestiona tu suscripción desde{" "}
        <Link href="/perfil" className="text-stone-500 hover:text-bone transition underline">
          tu perfil
        </Link>
        .
      </p>
    </div>
  );
}
