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
  tab_file_url: string | null;
  image_url: string | null;
  submitted_by_email: string | null;
  created_at: string;
}

export type TaskCategory = "tecnica" | "improvisacion" | "cancion" | "teoria" | "general";
export type SubmissionStatus = "pending" | "approved" | "rejected";

export const TASK_CATEGORY_META: Record<TaskCategory, { label: string; icon: string; tw: string }> = {
  tecnica:       { label: "Técnica",        icon: "⚡", tw: "ember"  },
  improvisacion: { label: "Improvisación",  icon: "♫", tw: "amber"  },
  cancion:       { label: "Canción",        icon: "♩", tw: "sage"   },
  teoria:        { label: "Teoría",         icon: "◎", tw: "blue"   },
  general:       { label: "General",        icon: "◆", tw: "stone"  },
};

export const TASK_CATEGORIES = Object.keys(TASK_CATEGORY_META) as TaskCategory[];

export interface PracticeTask {
  id: string;
  user_id: string;
  title: string;
  category: TaskCategory;
  duration_minutes: number;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface DailyTaskCompletion {
  id: string;
  user_id: string;
  task_id: string;
  completed_on: string;
  notes: string | null;
  created_at: string;
}

export interface ExerciseSubmission {
  id: string;
  user_id: string;
  title: string;
  technique: Technique | null;
  difficulty: Difficulty | null;
  bpm_start: number | null;
  bpm_target: number | null;
  description: string | null;
  focus: string | null;
  tab: string | null;
  tab_file_url: string | null;
  image_url: string | null;
  submitter_email: string | null;
  status: SubmissionStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  submitter_notes: string | null;
  created_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  exercise_id: string;
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
