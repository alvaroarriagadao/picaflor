"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  /** URL pública del archivo .gp/.gpx/.gp5 en Supabase Storage */
  fileUrl: string;
  /** Nombre para mostrar */
  fileName?: string;
}

export default function GuitarProViewer({ fileUrl, fileName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<unknown>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    async function init() {
      try {
        setStatus("loading");

        // Dynamic import — no SSR
        const { AlphaTabApi } = await import("@coderline/alphatab");

        if (destroyed || !containerRef.current) return;

        const api = new AlphaTabApi(containerRef.current, {
          core: {
            // CDN para workers y fuentes — evita webpack/Next.js issues
            fontDirectory:
              "https://cdn.jsdelivr.net/npm/@coderline/alphatab@latest/dist/font/",
            scriptFile:
              "https://cdn.jsdelivr.net/npm/@coderline/alphatab@latest/dist/alphaTab.js",
            logLevel: 0, // silent
          },
          display: {
            layoutMode: 1, // Horizontal scroll
            staveProfile: 1, // Tab only (no notation staff)
          },
          player: {
            enablePlayer: false,
          },
        });

        apiRef.current = api;

        // Esperar a que el renderer esté listo
        api.renderStarted.on(() => setStatus("loading"));
        api.renderFinished.on(() => setStatus("ready"));
        api.error.on((e: unknown) => {
          const msg =
            e instanceof Error ? e.message : "Error al cargar la tablatura";
          setErrorMsg(msg);
          setStatus("error");
        });

        // Cargar archivo
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();

        if (!destroyed) {
          api.load(new Uint8Array(buffer).buffer);
        }
      } catch (e) {
        if (!destroyed) {
          setErrorMsg(e instanceof Error ? e.message : "Error desconocido");
          setStatus("error");
        }
      }
    }

    init();

    return () => {
      destroyed = true;
      if (apiRef.current) {
        try {
          (apiRef.current as { destroy?: () => void }).destroy?.();
        } catch {}
        apiRef.current = null;
      }
    };
  }, [fileUrl]);

  return (
    <div className="rounded-xl border border-smoke bg-white/5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-smoke px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-ember text-sm">♩</span>
          <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">
            {fileName ?? "Tablatura Guitar Pro"}
          </span>
        </div>
        <a
          href={fileUrl}
          download
          className="text-xs text-stone-500 hover:text-ember transition"
          title="Descargar archivo"
        >
          ↓ Descargar
        </a>
      </div>

      {/* Loading state */}
      {status === "loading" && (
        <div className="flex items-center justify-center gap-2 py-10 text-stone-500 text-sm">
          <span className="animate-pulse">◆</span>
          Cargando tablatura…
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="px-4 py-6 text-center">
          <p className="text-rust text-sm">No se pudo cargar la tablatura</p>
          {errorMsg && (
            <p className="mt-1 text-xs text-stone-600">{errorMsg}</p>
          )}
          <a
            href={fileUrl}
            download
            className="mt-3 inline-block rounded-lg border border-smoke px-4 py-2 text-xs text-stone-400 hover:text-ember transition"
          >
            ↓ Descargar y abrir en Guitar Pro
          </a>
        </div>
      )}

      {/* AlphaTab render target */}
      <div
        ref={containerRef}
        className={`overflow-x-auto px-2 py-2 ${
          status !== "ready" ? "invisible h-0" : ""
        }`}
      />
    </div>
  );
}
