# Picaflor 🎸

Plataforma de ejercicios diarios de técnica para guitarristas. Un lick o ejercicio al azar cada día, metrónomo de precisión integrado, biblioteca filtrable y seguimiento de tu racha de práctica.

## Stack

- **Next.js 14** (App Router, Server Components)
- **Supabase** (Auth + Postgres + Row Level Security)
- **Tailwind CSS**
- **Web Audio API** para el metrónomo (timing de precisión, sin drift)

## Funcionalidades

- **Ejercicio del día** determinístico: el mismo ejercicio para todos durante el día, cambia cada jornada.
- **Lick al azar**: botón para sacar otro ejercicio aleatorio cuando quieras.
- **Metrónomo integrado** con BPM de inicio y meta por ejercicio, ajuste fino, compás configurable y acento en el tiempo fuerte.
- **Biblioteca** filtrable por técnica (alternate picking, legato, sweep, tapping, etc.) y dificultad.
- **Tablatura ASCII** con notación de digitación y dirección de púa.
- **Racha diaria** y estadísticas de progreso por usuario.

## Configuración local

1. Instala dependencias:
   ```bash
   npm install
   ```

2. Copia las variables de entorno:
   ```bash
   cp .env.example .env.local
   ```
   Rellena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

3. Ejecuta las migraciones en tu proyecto Supabase (SQL Editor):
   - `supabase/01_schema.sql` — tablas, índices y políticas RLS.
   - `supabase/02_seed.sql` — ejercicios iniciales.

4. Arranca el servidor:
   ```bash
   npm run dev
   ```

## Contenido

Todos los ejercicios son originales, escritos para esta plataforma. Cubren las técnicas fundamentales de la guitarra moderna con tablatura propia y progresiones de BPM.

## Arquitectura de datos

- `exercises` — biblioteca de ejercicios (lectura pública para autenticados).
- `practice_logs` — registro de práctica por usuario (RLS: cada quien ve solo lo suyo), con unicidad por `(user_id, exercise_id, practiced_on)`.
