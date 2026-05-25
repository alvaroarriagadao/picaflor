-- ============================================================
-- Picaflor · Favoritos + política admin para exercises
-- ============================================================

-- ---------- Tabla: user_favorites ----------
create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

create index if not exists idx_user_favorites_user on public.user_favorites(user_id);

alter table public.user_favorites enable row level security;

drop policy if exists "favorites_select_own" on public.user_favorites;
create policy "favorites_select_own"
  on public.user_favorites for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.user_favorites;
create policy "favorites_insert_own"
  on public.user_favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.user_favorites;
create policy "favorites_delete_own"
  on public.user_favorites for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---------- Política admin: insert de ejercicios ----------
drop policy if exists "exercises_insert_admin" on public.exercises;
create policy "exercises_insert_admin"
  on public.exercises for insert
  to authenticated
  with check (
    (auth.jwt() ->> 'email') = 'alvaroarriagada101@gmail.com'
  );

drop policy if exists "exercises_update_admin" on public.exercises;
create policy "exercises_update_admin"
  on public.exercises for update
  to authenticated
  using (
    (auth.jwt() ->> 'email') = 'alvaroarriagada101@gmail.com'
  );

drop policy if exists "exercises_delete_admin" on public.exercises;
create policy "exercises_delete_admin"
  on public.exercises for delete
  to authenticated
  using (
    (auth.jwt() ->> 'email') = 'alvaroarriagada101@gmail.com'
  );
