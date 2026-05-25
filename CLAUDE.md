# CLAUDE.md — Picaflor

Plataforma de ejercicios diarios de técnica para guitarristas.
Un lick o ejercicio al azar cada día, metrónomo de precisión Web Audio, biblioteca filtrable y racha diaria de práctica.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router, Server Components) |
| Auth + DB | Supabase (PostgreSQL + RLS + Supabase Auth) |
| Estilos | Tailwind CSS v3 con paleta personalizada |
| Lenguaje | TypeScript estricto |
| Deploy | Vercel (región `gru1` — São Paulo) |
| Audio | Web Audio API nativa (metrónomo sin drift) |

---

## Infraestructura de producción

### Supabase
- **Proyecto:** `picaflor`
- **Project ID:** `gxllxhkxjpdqcldwissc`
- **Región:** `sa-east-1` (São Paulo)
- **URL:** `https://gxllxhkxjpdqcldwissc.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/gxllxhkxjpdqcldwissc

### GitHub
- **Repo:** `alvaroarriagadao/picaflor`
- **URL:** https://github.com/alvaroarriagadao/picaflor
- **Rama principal:** `main`

### Vercel
- **Proyecto:** `picaflor`
- **Team ID:** `team_mA66BzPs6VnNqCUJmfptRYe8`
- **URL esperada:** https://picaflor.vercel.app
- **Dashboard:** https://vercel.com/alvaroarriagadao/picaflor

---

## Variables de entorno

```bash
# .env.local (local) y env vars en Vercel dashboard (producción)
NEXT_PUBLIC_SUPABASE_URL=https://gxllxhkxjpdqcldwissc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Para agregar en Vercel si aún no están:
→ https://vercel.com/alvaroarriagadao/picaflor/settings/environment-variables

---

## Estructura del proyecto

```
picaflor/
├── app/
│   ├── layout.tsx              # Root layout — fuentes Bricolage+Outfit+JetBrains
│   ├── globals.css             # Tailwind base + textura de grano + scrollbar
│   ├── page.tsx                # Redirect a /practica o /login según sesión
│   ├── login/
│   │   └── page.tsx            # Login/signup client component (email+password)
│   ├── auth/
│   │   └── callback/route.ts   # OAuth callback handler de Supabase
│   ├── practica/
│   │   ├── layout.tsx          # Layout con Nav
│   │   └── page.tsx            # Server: fetcha ejercicios, calcula racha → PracticeClient
│   ├── biblioteca/
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Server: fetcha ejercicios + practicados → LibraryClient
│   │   └── [slug]/
│   │       └── page.tsx        # Detalle de ejercicio por slug
│   └── perfil/
│       ├── layout.tsx
│       └── page.tsx            # Stats + historial de práctica
│
├── components/
│   ├── Nav.tsx                 # Navbar sticky con sign-out
│   ├── Metronome.tsx           # Web Audio API — timing de precisión sin setInterval
│   ├── TabDisplay.tsx          # Bloque monoespaciado para tablatura ASCII
│   ├── Badges.tsx              # TechniqueBadge + DifficultyBadge con colores
│   ├── PracticeClient.tsx      # Vista principal de práctica (diaria + random)
│   ├── LibraryClient.tsx       # Grid filtrable de ejercicios
│   └── ExerciseLogButton.tsx   # Botón "Marcar practicado" (client)
│
├── lib/
│   ├── types.ts                # Tipos: Exercise, PracticeLog, Technique, Difficulty
│   ├── daily.ts                # dailyIndex, todayStr, pickDailyExercise, pickRandomExercise
│   ├── supabase-client.ts      # createBrowserClient (uso en Client Components)
│   └── supabase-server.ts      # createServerClient con cookies (Server Components)
│
├── supabase/
│   ├── 01_schema.sql           # Tablas exercises + practice_logs + RLS
│   ├── 02_seed.sql             # 16 ejercicios originales (idempotente via ON CONFLICT)
│   └── exercises-data.ts       # Fuente de datos TypeScript de los ejercicios
│
├── middleware.ts               # Protege /practica /biblioteca /perfil, refresca sesión
├── tailwind.config.ts          # Paleta + fuentes + animaciones
├── vercel.json                 # framework: nextjs, región: gru1
└── CLAUDE.md                   # Este archivo
```

---

## Base de datos

### Tabla `exercises`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | Generado automáticamente |
| `slug` | text UNIQUE | Identificador URL-friendly |
| `title` | text | Nombre del ejercicio |
| `technique` | text | Ver enum `Technique` en lib/types.ts |
| `difficulty` | text | `principiante` / `intermedio` / `avanzado` / `experto` |
| `bpm_start` | int | BPM de arranque recomendado |
| `bpm_target` | int | BPM objetivo a conseguir |
| `description` | text | Descripción pedagógica del ejercicio |
| `focus` | text | En qué fijarse (1 línea) |
| `tab` | text | Tablatura ASCII con saltos de línea reales |

**RLS:** lectura para todos los usuarios autenticados (`authenticated`). Sin escritura pública.

### Tabla `practice_logs`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → auth.users | |
| `exercise_id` | uuid FK → exercises | |
| `practiced_on` | date | Fecha de práctica (default: hoy) |
| `bpm_reached` | int nullable | BPM que alcanzó el usuario |
| `notes` | text nullable | Notas libres del usuario |
| `created_at` | timestamptz | |

**Constraint:** `UNIQUE (user_id, exercise_id, practiced_on)` — un log por ejercicio por día.
**RLS:** cada usuario solo lee/escribe/borra sus propios logs.

---

## Lógica clave

### Ejercicio del día (`lib/daily.ts`)

```typescript
// Hash determinístico de la fecha → mismo ejercicio todo el día para todos
dailyIndex(dateStr: string, length: number): number
// Devuelve "YYYY-MM-DD" en hora local
todayStr(): string
// Selecciona el ejercicio del día del array completo
pickDailyExercise(exercises: Exercise[]): Exercise | null
// Selecciona un ejercicio al azar, opcionalmente excluyendo uno
pickRandomExercise(exercises: Exercise[], excludeId?: string): Exercise | null
```

### Metrónomo (`components/Metronome.tsx`)

Usa **Web Audio API** con un scheduler de lookahead (100ms) que corre cada 25ms. Evita el drift de `setInterval`. El oscilador genera clicks a 1500Hz (downbeat) / 900Hz (beats). Acepta `initialBpm`, `bpmStart` y `bpmTarget` para mostrar los presets del ejercicio activo.

### Autenticación

- `middleware.ts` protege `/practica`, `/biblioteca`, `/perfil` — redirige a `/login` si no hay sesión
- `lib/supabase-server.ts` → Server Components / Route Handlers
- `lib/supabase-client.ts` → Client Components
- Callback OAuth en `app/auth/callback/route.ts`

---

## Paleta de colores (Tailwind custom)

```
ink    #0c0a09  — fondo principal (casi negro)
ash    #1c1917  — fondo de cards
smoke  #292524  — bordes, elementos secundarios
ember  #e8632c  — acento primario (naranja brasa) — CTAs, activos
amber  #f0a500  — acento secundario (dorado) — metas BPM, highlights
bone   #f5f1e8  — texto principal (blanco cálido)
rust   #a83232  — acciones destructivas / stop
sage   #7c8b6f  — completado / confirmación
```

---

## Fuentes

```
Bricolage Grotesque → --font-display  (títulos, labels, botones)
Outfit              → --font-body     (cuerpo de texto)
JetBrains Mono      → --font-mono     (tablaturas ASCII)
```

---

## Técnicas en la biblioteca

| Valor en DB | Label visible |
|---|---|
| `alternate_picking` | Alternate Picking |
| `legato` | Legato |
| `string_skipping` | String Skipping |
| `sweep_picking` | Sweep Picking |
| `tapping` | Tapping |
| `bending_vibrato` | Bending & Vibrato |
| `finger_independence` | Independencia de dedos |
| `rhythm_groove` | Ritmo & Groove |
| `scales_modes` | Escalas & Modos |
| `economy_picking` | Economy Picking |

---

## Comandos de desarrollo

```bash
npm run dev       # Servidor local en localhost:3000
npm run build     # Build de producción (valida TypeScript)
npm run lint      # ESLint
```

---

## Convenciones de código

- **Server Components por defecto.** Solo añadir `"use client"` cuando se necesite estado, eventos del browser o Web APIs (metrónomo, etc.).
- **Datos en el servidor.** Fetches a Supabase siempre en Server Components (`lib/supabase-server.ts`). Los Client Components reciben datos como props.
- **RLS es la única capa de autorización.** No hay lógica de permisos en el código de aplicación.
- **`export const dynamic = "force-dynamic"`** en todas las páginas con datos de usuario (práctica, biblioteca, perfil) para evitar caché de respuestas personalizadas.
- Las tablaturas usan `E'...'` (escape string de PostgreSQL) con `\n` para los saltos de línea reales al insertar.
- Los slugs son `kebab-case` únicos, usados como URL de detalle en `/biblioteca/[slug]`.

---

## Agregar nuevos ejercicios

1. Editar `supabase/exercises-data.ts` — agregar un objeto al array `SEED_EXERCISES`
2. Ejecutar el SQL de `supabase/02_seed.sql` en el SQL Editor de Supabase (es idempotente)
3. O directamente insertar en el SQL Editor:

```sql
insert into public.exercises (slug, title, technique, difficulty, bpm_start, bpm_target, description, focus, tab)
values ('mi-ejercicio', 'Mi Ejercicio', 'alternate_picking', 'intermedio', 80, 160, 'Descripción...', 'En qué fijarse.', E'e|--1--2--3--|\nB|-----------|')
on conflict (slug) do nothing;
```

---

## Deploy

El flujo de deploy es automático via Vercel + GitHub:

```
git push origin main → Vercel detecta el push → build → deploy production
```

Si el build falla, revisar:
1. Env vars `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` configuradas en Vercel
2. `npm run build` pasa localmente sin errores TypeScript

---

## Contexto del dueño

- **Usuario:** Álvaro Arriagada — guitarrista profesional, miembro de **Los Killtros Blues** (Blues Rock, Los Lagos, Chile)
- **GitHub:** `alvaroarriagadao`
- **Email personal:** `alvaroarriagada101@gmail.com`
- **Proyecto hermano activo:** KarinPulse (Expo + Supabase) — app de bienestar laboral para Ley Karin
- **Stack familiar:** Next.js, Supabase, Expo/React Native, Tailwind, Node.js/Moleculer

---

## Estado al inicio de esta sesión de Claude Code

- [x] Schema SQL aplicado en producción (Supabase)
- [x] 16 ejercicios originales cargados en producción
- [x] Código completo en GitHub (`main`)
- [x] Proyecto Vercel conectado al repo
- [ ] **PENDIENTE:** agregar env vars en Vercel dashboard y verificar deploy live
