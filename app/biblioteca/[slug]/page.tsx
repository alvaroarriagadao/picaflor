import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import Metronome from "@/components/Metronome";
import TabDisplay from "@/components/TabDisplay";
import { DifficultyBadge, TechniqueBadge } from "@/components/Badges";
import ExerciseLogButton from "@/components/ExerciseLogButton";
import type { Exercise } from "@/lib/types";
import { todayStr } from "@/lib/daily";

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
  if (user) {
    const { data: log } = await supabase
      .from("practice_logs")
      .select("id")
      .eq("user_id", user.id)
      .eq("exercise_id", ex.id)
      .eq("practiced_on", todayStr())
      .maybeSingle();
    completedToday = !!log;
  }

  return (
    <div>
      <Link
        href="/biblioteca"
        className="mb-6 inline-flex items-center gap-1 text-sm text-stone-500 transition hover:text-ember"
      >
        ← Biblioteca
      </Link>

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
