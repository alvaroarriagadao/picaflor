"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

interface Props {
  exerciseId: string;
  initialFavorited: boolean;
  size?: "sm" | "md";
}

export default function FavoriteButton({
  exerciseId,
  initialFavorited,
  size = "md",
}: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    if (favorited) {
      await supabase
        .from("user_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("exercise_id", exerciseId);
    } else {
      await supabase
        .from("user_favorites")
        .insert({ user_id: user.id, exercise_id: exerciseId });
    }
    setFavorited((f) => !f);
    setLoading(false);
  };

  const sizeClass = size === "sm" ? "text-base p-1" : "text-xl p-1.5";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
      className={`${sizeClass} rounded-lg transition-all disabled:opacity-40 ${
        favorited
          ? "text-amber hover:text-stone-400"
          : "text-stone-600 hover:text-amber"
      }`}
    >
      {favorited ? "★" : "☆"}
    </button>
  );
}
