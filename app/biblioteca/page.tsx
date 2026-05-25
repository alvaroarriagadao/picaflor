import { createClient } from "@/lib/supabase-server";
import LibraryClient from "@/components/LibraryClient";
import type { Exercise } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const supabase = await createClient();

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("difficulty", { ascending: true })
    .order("title", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let practicedIds: string[] = [];
  let favoriteIds: string[] = [];

  if (user) {
    const [{ data: logs }, { data: favs }] = await Promise.all([
      supabase
        .from("practice_logs")
        .select("exercise_id")
        .eq("user_id", user.id),
      supabase
        .from("user_favorites")
        .select("exercise_id")
        .eq("user_id", user.id),
    ]);
    practicedIds = Array.from(
      new Set((logs ?? []).map((l) => l.exercise_id as string))
    );
    favoriteIds = (favs ?? []).map((f) => f.exercise_id as string);
  }

  return (
    <LibraryClient
      exercises={(exercises ?? []) as Exercise[]}
      practicedIds={practicedIds}
      favoriteIds={favoriteIds}
    />
  );
}
