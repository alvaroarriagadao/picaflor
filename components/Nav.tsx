"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase-client";
import dynamic from "next/dynamic";

const Tuner = dynamic(() => import("@/components/Tuner"), { ssr: false });

/* ── SVG icons ─────────────────────────────────────────────────────────────── */
const IconPractica = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M12 2L20.5 12L12 22L3.5 12Z" />
  </svg>
);
const IconPlan = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
  </svg>
);
const IconBiblioteca = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);
const IconComunidad = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconPerfil = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const IconTuner = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v4l3 3" />
  </svg>
);

/* ── Nav config ─────────────────────────────────────────────────────────────── */
const NAV_TABS = [
  { href: "/practica",     section: "/practica",     label: "Práctica",   Icon: IconPractica    },
  { href: "/planificador", section: "/planificador", label: "Plan",       Icon: IconPlan        },
  { href: "/biblioteca",   section: "/biblioteca",   label: "Biblioteca", Icon: IconBiblioteca  },
  { href: "/comunidad/nuevo", section: "/comunidad", label: "Comunidad",  Icon: IconComunidad   },
  { href: "/perfil",       section: "/perfil",       label: "Perfil",     Icon: IconPerfil      },
] as const;

const DESKTOP_LINKS = [
  { href: "/practica",        label: "Práctica"     },
  { href: "/planificador",    label: "Planificador" },
  { href: "/biblioteca",      label: "Biblioteca"   },
  { href: "/comunidad/nuevo", label: "Comunidad"    },
  { href: "/perfil",          label: "Perfil"       },
];

interface Props {
  isAdmin?: boolean;
  isPro?: boolean;
}

export default function Nav({ isAdmin = false, isPro = false }: Props) {
  const pathname   = usePathname();
  const router     = useRouter();
  const [tunerOpen, setTunerOpen] = useState(false);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* ── Top header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-smoke/60 bg-ink/90 backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-5">

          {/* Logo */}
          <Link href="/practica" className="group flex items-center gap-2">
            <span className="text-xl text-ember transition-transform duration-300 group-hover:rotate-12">◆</span>
            <span className="font-display text-lg font-bold tracking-tight text-bone">Picaflor</span>
          </Link>

          {/* ── Desktop nav (sm+) ──────────────────────────────────────── */}
          <nav className="hidden sm:flex items-center gap-0.5">
            {DESKTOP_LINKS.map((l) => {
              const active = pathname.startsWith(
                l.href === "/comunidad/nuevo" ? "/comunidad" : l.href
              );
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? "bg-smoke text-bone" : "text-stone-400 hover:text-bone"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}

            {/* Afinador */}
            <button
              onClick={() => setTunerOpen(true)}
              className="ml-1 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-stone-400 transition-colors hover:text-amber"
            >
              <IconTuner />
              <span>Afinador</span>
            </button>

            {/* Pro badge / upgrade CTA */}
            {isPro ? (
              <span className="ml-1 inline-flex items-center rounded-full border border-amber/40 bg-amber/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber">
                ◆ Pro
              </span>
            ) : (
              <Link
                href="/precios"
                className={`ml-1 rounded-lg border border-ember/40 bg-ember/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-ember transition-colors hover:bg-ember/20 ${
                  pathname.startsWith("/precios") ? "bg-ember/20" : ""
                }`}
              >
                ↑ Pro
              </Link>
            )}

            {/* Admin links */}
            {isAdmin && (
              <div className="ml-1 flex items-center gap-1">
                <Link
                  href="/admin/ejercicios"
                  className={`rounded-lg border border-ember/40 px-3 py-1.5 text-sm text-ember transition-colors hover:bg-ember/10 ${
                    pathname.startsWith("/admin/ejercicios") ? "bg-ember/10" : ""
                  }`}
                >
                  Ejercicios
                </Link>
                <Link
                  href="/admin/revisiones"
                  className={`rounded-lg border border-ember/40 px-3 py-1.5 text-sm text-ember transition-colors hover:bg-ember/10 ${
                    pathname.startsWith("/admin/revisiones") ? "bg-ember/10" : ""
                  }`}
                >
                  Revisiones
                </Link>
              </div>
            )}

            <button
              onClick={signOut}
              className="ml-1 rounded-lg px-3 py-2 text-sm text-stone-500 transition-colors hover:text-rust"
            >
              Salir
            </button>
          </nav>

          {/* ── Mobile utility buttons (xs only) ───────────────────────── */}
          <div className="flex sm:hidden items-center gap-1">
            {!isPro && (
              <Link
                href="/precios"
                className="rounded-lg border border-ember/40 bg-ember/10 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ember"
              >
                Pro
              </Link>
            )}
            {isPro && (
              <span className="rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
                ◆ Pro
              </span>
            )}
            <button
              onClick={() => setTunerOpen(true)}
              aria-label="Abrir afinador"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-400 transition-colors hover:text-amber active:bg-smoke"
            >
              <IconTuner />
            </button>
            <button
              onClick={signOut}
              aria-label="Cerrar sesión"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-500 transition-colors hover:text-rust active:bg-smoke text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom tab bar ──────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex sm:hidden border-t border-smoke/80 bg-ink/95 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Navegación principal"
      >
        {NAV_TABS.map(({ href, section, label, Icon }) => {
          const active = pathname.startsWith(section);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 transition-colors active:bg-smoke/50 ${
                active ? "text-ember" : "text-stone-600"
              }`}
            >
              <Icon />
              <span
                className={`text-[9px] font-medium leading-none tracking-wide ${
                  active ? "text-ember" : "text-stone-600"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Tuner modal */}
      <Tuner open={tunerOpen} onClose={() => setTunerOpen(false)} />
    </>
  );
}
