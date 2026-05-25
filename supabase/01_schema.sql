-- ============================================================
-- Picaflor · Esquema de base de datos
-- Plataforma de ejercicios diarios de técnica para guitarristas
-- ============================================================

-- ---------- Tabla: exercises ----------
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  technique text not null,
  difficulty text not null,
  bpm_start int not null default 60,
  bpm_target int not null default 120,
  description text not null,
  focus text not null,
  tab text not null,
  created_at timestamptz not null default now()
);

-- ---------- Tabla: practice_logs ----------
create table if not exists public.practice_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  practiced_on date not null default current_date,
  bpm_reached int,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, exercise_id, practiced_on)
);

create index if not exists idx_practice_logs_user on public.practice_logs(user_id);
create index if not exists idx_practice_logs_date on public.practice_logs(user_id, practiced_on);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.exercises enable row level security;
alter table public.practice_logs enable row level security;

-- Ejercicios: lectura pública para usuarios autenticados
drop policy if exists "exercises_select_all" on public.exercises;
create policy "exercises_select_all"
  on public.exercises for select
  to authenticated
  using (true);

-- Logs de práctica: cada usuario solo ve y gestiona los suyos
drop policy if exists "logs_select_own" on public.practice_logs;
create policy "logs_select_own"
  on public.practice_logs for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "logs_insert_own" on public.practice_logs;
create policy "logs_insert_own"
  on public.practice_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "logs_update_own" on public.practice_logs;
create policy "logs_update_own"
  on public.practice_logs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "logs_delete_own" on public.practice_logs;
create policy "logs_delete_own"
  on public.practice_logs for delete
  to authenticated
  using (auth.uid() = user_id);
