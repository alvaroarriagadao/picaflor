import { notFound } from "next/navigation";
import Link from "next/link";
import dynamicImport from "next/dynamic";
import { createClient } from "@/lib/supabase-server";
import Metronome from "@/components/Metronome";
import TabDisplay from "@/components/TabDisplay";
import { DifficultyBadge, TechniqueBadge } from "@/components/Badges";
import ExerciseLogButton from "@/components/ExerciseLogButton";
import FavoriteButton from "@/components/FavoriteButton";
import type { Exercise } from "@/lib/types";
import { todayStr } from "@/lib/daily";

// Cargado sólo en cliente — AlphaTab usa APIs de navegador
const GuitarProViewer = dynamicImport(
  () => import("@/components/GuitarProViewer"),
  { ssr: false }
);

export const dynamic = "force-dynamic";

export default async function ExerciseDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: exercise } = await supabase
    .from("exercises")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!exercise) notFound();
  const ex = exercise as Exercise;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let completedToday = false;
  let isFavorited = false;

  if (user) {
    const [{ data: log }, { data: fav }] = await Promise.all([
      supabase
        .from("practice_logs")
        .select("id")
        .eq("user_id", user.id)
        .eq("exercise_id", ex.id)
        .eq("practiced_on", todayStr())
        .maybeSingle(),
      supabase
        .from("user_favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("exercise_id", ex.id)
        .maybeSingle(),
    ]);
    completedToday = !!log;
    isFavorited = !!fav;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/biblioteca"
          className="inline-flex items-center gap-1 text-sm text-stone-500 transition hover:text-ember"
        >
          ← Biblioteca
        </Link>
        <FavoriteButton exerciseId={ex.id} initialFavorited={isFavorited} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <TechniqueBadge technique={ex.technique} />
        <DifficultyBadge difficulty={ex.difficulty} />
      </div>

      <h1 className="font-display text-4xl font-extrabold tracking-tight text-bone sm:text-5xl">
        {ex.title}
      </h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <p className="text-lg leading-relaxed text-stone-300">
            {ex.description}
          </p>

          <div className="rounded-xl border border-smoke/60 bg-ash/40 p-4">
            <p className="text-xs uppercase tracking-wider text-stone-500">
              En qué fijarte
            </p>
            <p className="mt-1 text-stone-300">{ex.focus}</p>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-stone-500">
              Tablatura
            </p>
            <TabDisplay tab={ex.tab} />
          </div>

          {ex.tab_file_url && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-stone-500">
                Visor Guitar Pro
              </p>
              <GuitarProViewer
                fileUrl={ex.tab_file_url}
                fileName={`${ex.title}.gp`}
              />
            </div>
          )}

          <ExerciseLogButton
            exerciseId={ex.id}
            completedToday={completedToday}
          />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Metronome
            initialBpm={ex.bpm_start}
            bpmStart={ex.bpm_start}
            bpmTarget={ex.bpm_target}
          />
        </div>
      </div>
    </div>
  );
}
