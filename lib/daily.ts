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

/** Devuelve "YYYY-MM-DD" en la zona horaria de Santiago de Chile.
 *  Funciona tanto en servidor (UTC) como en cliente. */
export function todayStr(): string {
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    year:     "numeric",
    month:    "2-digit",
    day:      "2-digit",
  })
    .format(new Date())          // → "02-06-2026" (dd-mm-yyyy en es-CL)
    .split("-")
    .reverse()
    .join("-");                  // → "2026-06-02"
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
