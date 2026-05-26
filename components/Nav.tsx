"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import dynamic from "next/dynamic";

const Tuner = dynamic(() => import("@/components/Tuner"), { ssr: false });

const BASE_LINKS = [
  { href: "/practica",     label: "Práctica"     },
  { href: "/planificador", label: "Planificador" },
  { href: "/biblioteca",   label: "Biblioteca"   },
  { href: "/perfil",       label: "Perfil"       },
];

interface Props { isAdmin?: boolean }

export default function Nav({ isAdmin = false }: Props) {
  const pathname    = usePathname();
  const router      = useRouter();
  const [tunerOpen, setTunerOpen] = useState(false);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-smoke/60 bg-ink/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/practica" className="group flex items-center gap-2">
            <span className="text-xl text-ember transition group-hover:rotate-12">◆</span>
            <span className="font-display text-lg font-bold tracking-tight text-bone">Picaflor</span>
          </Link>

          <nav className="flex items-center gap-1">
            {BASE_LINKS.map(l => {
              const active = pathname.startsWith(l.href);
              return (
                <Link key={l.href} href={l.href}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    active ? "bg-smoke text-bone" : "text-stone-400 hover:text-bone"
                  }`}>
                  {l.label}
                </Link>
              );
            })}

            {/* Comunidad — para todos */}
            <Link href="/comunidad/nuevo"
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                pathname.startsWith("/comunidad")
                  ? "bg-smoke text-bone"
                  : "text-stone-400 hover:text-bone"
              }`}>
              Comunidad
            </Link>

            {/* Afinador */}
            <button onClick={() => setTunerOpen(true)}
              className="rounded-lg px-3 py-1.5 text-sm text-stone-400 hover:text-amber transition flex items-center gap-1">
              <span>♪</span>
              <span className="hidden sm:inline">Afinador</span>
            </button>

            {/* Admin menu */}
            {isAdmin && (
              <div className="relative ml-1 flex items-center gap-1">
                <Link href="/admin/ejercicios"
                  className={`rounded-lg border border-ember/40 px-3 py-1.5 text-sm text-ember transition hover:bg-ember/10 ${
                    pathname.startsWith("/admin/ejercicios") ? "bg-ember/10" : ""
                  }`}>
                  Ejercicios
                </Link>
                <Link href="/admin/revisiones"
                  className={`rounded-lg border border-ember/40 px-3 py-1.5 text-sm text-ember transition hover:bg-ember/10 ${
                    pathname.startsWith("/admin/revisiones") ? "bg-ember/10" : ""
                  }`}>
                  Revisiones
                </Link>
              </div>
            )}

            <button onClick={signOut}
              className="ml-2 rounded-lg px-3 py-1.5 text-sm text-stone-500 transition hover:text-rust">
              Salir
            </button>
          </nav>
        </div>
      </header>

      {/* Tuner modal — rendered outside header to avoid z-index clipping */}
      <Tuner open={tunerOpen} onClose={() => setTunerOpen(false)} />
    </>
  );
}
