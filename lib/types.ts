export type Technique =
  | "alternate_picking"
  | "legato"
  | "string_skipping"
  | "sweep_picking"
  | "tapping"
  | "bending_vibrato"
  | "finger_independence"
  | "rhythm_groove"
  | "scales_modes"
  | "economy_picking";

export type Difficulty = "principiante" | "intermedio" | "avanzado" | "experto";

export interface Exercise {
  id: string;
  slug: string;
  title: string;
  technique: Technique;
  difficulty: Difficulty;
  bpm_start: number;
  bpm_target: number;
  description: string;
  focus: string;
  tab: string;
  created_at: string;
}

export interface PracticeLog {
  id: string;
  user_id: string;
  exercise_id: string;
  practiced_on: string; // date
  bpm_reached: number | null;
  notes: string | null;
  created_at: string;
}

export const TECHNIQUE_LABELS: Record<Technique, string> = {
  alternate_picking: "Alternate Picking",
  legato: "Legato",
  string_skipping: "String Skipping",
  sweep_picking: "Sweep Picking",
  tapping: "Tapping",
  bending_vibrato: "Bending & Vibrato",
  finger_independence: "Independencia de dedos",
  rhythm_groove: "Ritmo & Groove",
  scales_modes: "Escalas & Modos",
  economy_picking: "Economy Picking",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  experto: "Experto",
};

export const DIFFICULTY_ORDER: Difficulty[] = [
  "principiante",
  "intermedio",
  "avanzado",
  "experto",
];
