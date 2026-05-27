"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin",            icon: "◈", label: "Dashboard"   },
  { href: "/admin/usuarios",   icon: "👥", label: "Usuarios"    },
  { href: "/admin/ejercicios", icon: "🎸", label: "Ejercicios"  },
  { href: "/admin/revisiones", icon: "✦", label: "Revisiones"  },
];

export default function AdminSidebar({ pendingCount }: { pendingCount: number }) {
  const path = usePathname();

  return (
    <>
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 min-h-screen border-r border-smoke bg-ash/60">
        {/* Brand */}
        <div className="px-5 py-6 border-b border-smoke">
          <div className="flex items-center gap-2">
            <span className="text-ember text-lg">◆</span>
            <div>
              <p className="font-display font-extrabold text-bone leading-none">Pickaflor</p>
              <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-0.5">Admin</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, icon, label }) => {
            const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
            const badge  = href === "/admin/revisiones" && pendingCount > 0 ? pendingCount : null;
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-ember/15 text-ember"
                    : "text-stone-400 hover:bg-smoke/60 hover:text-bone"
                }`}>
                <span className="text-base w-5 text-center">{icon}</span>
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber text-[10px] font-bold text-ink">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Back to app */}
        <div className="px-3 py-4 border-t border-smoke">
          <Link href="/practica"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-stone-600 hover:text-stone-400 transition">
            <span>←</span>
            <span>Volver a la app</span>
          </Link>
        </div>
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────────────── */}
      <div className="lg:hidden border-b border-smoke bg-ash/80 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-ember">◆</span>
            <span className="font-display font-bold text-bone text-sm">Admin</span>
          </div>
          <Link href="/practica" className="text-xs text-stone-500 hover:text-stone-300">← App</Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto">
          {NAV.map(({ href, icon, label }) => {
            const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
            const badge  = href === "/admin/revisiones" && pendingCount > 0 ? pendingCount : null;
            return (
              <Link key={href} href={href}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                  active ? "bg-ember/15 text-ember" : "text-stone-400 hover:text-bone"
                }`}>
                <span>{icon}</span>
                <span>{label}</span>
                {badge && (
                  <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber text-[9px] font-bold text-ink">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
