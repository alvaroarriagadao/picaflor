import type { Exercise } from "./types";

/**
 * Devuelve un índice determinístico basado en la fecha (YYYY-MM-DD).
 * El mismo día siempre devuelve el mismo ejercicio; cambia cada día.
 */
export function dailyIndex(dateStr: string, length: number): number {
  if (length === 0) return 0;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0; // 32-bit
  }
  return Math.abs(hash) % length;
}

export function todayStr(): string {
  // Fecha local en formato YYYY-MM-DD
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function pickDailyExercise(exercises: Exercise[]): Exercise | null {
  if (exercises.length === 0) return null;
  const idx = dailyIndex(todayStr(), exercises.length);
  return exercises[idx];
}

export function pickRandomExercise(
  exercises: Exercise[],
  excludeId?: string
): Exercise | null {
  if (exercises.length === 0) return null;
  const pool = excludeId
    ? exercises.filter((e) => e.id !== excludeId)
    : exercises;
  if (pool.length === 0) return exercises[0];
  return pool[Math.floor(Math.random() * pool.length)];
}
