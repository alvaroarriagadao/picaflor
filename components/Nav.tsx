"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

const BASE_LINKS = [
  { href: "/practica", label: "Práctica" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/perfil", label: "Perfil" },
];

interface Props {
  isAdmin?: boolean;
}

export default function Nav({ isAdmin = false }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const links = isAdmin
    ? [...BASE_LINKS, { href: "/admin/ejercicios", label: "+ Ejercicio" }]
    : BASE_LINKS;

  return (
    <header className="sticky top-0 z-40 border-b border-smoke/60 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/practica" className="group flex items-center gap-2">
          <span className="text-xl text-ember transition group-hover:rotate-12">◆</span>
          <span className="font-display text-lg font-bold tracking-tight text-bone">
            Picaflor
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            const isAdminLink = l.href.startsWith("/admin");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  isAdminLink
                    ? "border border-ember/40 text-ember hover:bg-ember/10"
                    : active
                    ? "bg-smoke text-bone"
                    : "text-stone-400 hover:text-bone"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <button
            onClick={signOut}
            className="ml-2 rounded-lg px-3 py-1.5 text-sm text-stone-500 transition hover:text-rust"
          >
            Salir
          </button>
        </nav>
      </div>
    </header>
  );
}
