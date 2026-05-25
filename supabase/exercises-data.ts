import type { Exercise } from "../lib/types";

type SeedExercise = Omit<Exercise, "id" | "created_at" | "tab_file_url" | "image_url" | "submitted_by_email"> & {
  tab_file_url?: string | null;
  image_url?: string | null;
  submitted_by_email?: string | null;
};

export const SEED_EXERCISES: SeedExercise[] = [
  {
    slug: "cromatico-1234-ascenso",
    title: "Cromático 1-2-3-4 ascendente",
    technique: "alternate_picking",
    difficulty: "principiante",
    bpm_start: 60,
    bpm_target: 140,
    description:
      "El calentamiento fundamental. Recorre las cuatro cuerdas más graves con un dedo por traste, manteniendo púa alterna estricta (abajo-arriba) en cada nota.",
    focus: "Sincronización mano derecha/izquierda y púa alterna estricta.",
    tab: `e|------------------------------------------|
B|------------------------------------------|
G|------------------------------------------|
D|------------------------------------------|
A|----------------------1--2--3--4----------|
E|--1--2--3--4------------------------------|
   ↓  ↑  ↓  ↑      ↓  ↑  ↓  ↑`,
  },
  {
    slug: "cromatico-1234-descenso",
    title: "Cromático 1-2-3-4 descendente",
    technique: "alternate_picking",
    difficulty: "principiante",
    bpm_start: 60,
    bpm_target: 140,
    description:
      "La versión inversa del calentamiento cromático. Baja desde la primera cuerda hacia las graves manteniendo la alternancia de púa sin interrupción al cambiar de cuerda.",
    focus: "Control del cambio de cuerda descendente con púa alterna.",
    tab: `e|--4--3--2--1------------------------------|
B|----------------4--3--2--1----------------|
G|------------------------------------------|
D|------------------------------------------|
A|------------------------------------------|
E|------------------------------------------|
   ↓  ↑  ↓  ↑      ↓  ↑  ↓  ↑`,
  },
  {
    slug: "spider-walk-permutacion",
    title: "Spider walk — permutación 1-3-2-4",
    technique: "finger_independence",
    difficulty: "intermedio",
    bpm_start: 50,
    bpm_target: 120,
    description:
      "Patrón de araña que rompe el orden secuencial de los dedos para forzar independencia real. El salto del dedo 3 al 2 es donde se gana el control.",
    focus: "Independencia y economía de movimiento de los dedos 2 y 3.",
    tab: `e|------------------------------------------|
B|------------------------------------------|
G|------------------------------------------|
D|--1--3--2--4------------------------------|
A|----------------1--3--2--4----------------|
E|------------------------------------------|`,
  },
  {
    slug: "legato-tresillos-mayor",
    title: "Legato en tresillos — escala mayor",
    technique: "legato",
    difficulty: "intermedio",
    bpm_start: 70,
    bpm_target: 150,
    description:
      "Tresillos ligados usando hammer-on y pull-off sobre tres notas por cuerda. La púa solo ataca la primera nota de cada cuerda; el resto suena por presión.",
    focus: "Uniformidad de volumen entre nota atacada y notas ligadas.",
    tab: `e|--------------------------------|
B|--------------------------------|
G|--------------------------------|
D|--------------------------------|
A|--5h7h8----7h8h10---------------|
E|--------5h7-------5h7h8----------|
   p   h  h`,
  },
  {
    slug: "string-skipping-arpegio",
    title: "String skipping — arpegio abierto",
    technique: "string_skipping",
    difficulty: "avanzado",
    bpm_start: 60,
    bpm_target: 130,
    description:
      "Salta una cuerda intermedia en cada movimiento para entrenar la precisión de la púa y silenciar la cuerda no tocada con la palma.",
    focus: "Precisión de ataque saltando cuerdas y muting de la cuerda media.",
    tab: `e|--7----------7--------------------|
B|----------------------------------|
G|------7----------7----------------|
D|----------------------------------|
A|--------7----------7--------------|
E|----------------------------------|`,
  },
  {
    slug: "sweep-triada-menor-3c",
    title: "Sweep — tríada menor 3 cuerdas",
    technique: "sweep_picking",
    difficulty: "avanzado",
    bpm_start: 50,
    bpm_target: 120,
    description:
      "Barrido de tres cuerdas sobre una tríada menor. La púa hace un solo movimiento continuo descendente y ascendente; los dedos sueltan cada nota para evitar que suenen juntas.",
    focus: "Sincronía del barrido con el rolling de los dedos izquierdos.",
    tab: `e|--------8--------8----------------|
B|------8----8---8----8-------------|
G|----9--------9--------9-----------|
D|----------------------------------|
A|----------------------------------|
E|----------------------------------|
   ↓  ↓  ↑  ↑`,
  },
  {
    slug: "tapping-arpegio-am",
    title: "Tapping — arpegio de Am",
    technique: "tapping",
    difficulty: "avanzado",
    bpm_start: 60,
    bpm_target: 140,
    description:
      "Tapping a dos manos sobre el arpegio de La menor. El dedo de la mano derecha (T) golpea el traste alto, seguido de pull-off a las notas de la mano izquierda.",
    focus: "Claridad del tap y control del pull-off de salida.",
    tab: `e|--12t-5-8--12t-5-8----------------|
B|----------------------------------|
G|----------------------------------|
D|----------------------------------|
A|----------------------------------|
E|----------------------------------|
   T   p p`,
  },
  {
    slug: "bending-afinacion-tono",
    title: "Bending de afinación — tono completo",
    technique: "bending_vibrato",
    difficulty: "intermedio",
    bpm_start: 50,
    bpm_target: 90,
    description:
      "Toca la nota destino primero como referencia, luego bendea desde dos trastes abajo hasta igualar esa altura exacta. El oído es el juez.",
    focus: "Precisión de afinación del bend y estabilidad al sostenerlo.",
    tab: `e|----------------------------------|
B|--10----8b(10)--8b(10)------------|
G|----------------------------------|
D|----------------------------------|
A|----------------------------------|
E|----------------------------------|
   ref  bend     bend`,
  },
  {
    slug: "vibrato-control-lento",
    title: "Vibrato controlado — pulsos lentos",
    technique: "bending_vibrato",
    difficulty: "intermedio",
    bpm_start: 50,
    bpm_target: 80,
    description:
      "Vibrato medido al metrónomo: cada oscilación cae exactamente en el pulso. Empieza con vibrato ancho y lento para ganar control antes que velocidad.",
    focus: "Regularidad y amplitud constante del vibrato desde la muñeca.",
    tab: `e|----------------------------------|
B|--8~~~~~~~~--10~~~~~~~~------------|
G|----------------------------------|
D|----------------------------------|
A|----------------------------------|
E|----------------------------------|
   vib        vib`,
  },
  {
    slug: "economy-picking-3nps",
    title: "Economy picking — 3 notas por cuerda",
    technique: "economy_picking",
    difficulty: "avanzado",
    bpm_start: 70,
    bpm_target: 160,
    description:
      "En el cambio de cuerda, la púa sigue en la misma dirección (barrido económico) en lugar de alternar. Reduce el movimiento y aumenta la velocidad sostenible.",
    focus: "Identificar el punto de economía en el cruce de cuerda.",
    tab: `e|----------------------------------|
B|----------------------------------|
G|--5--7--9-------------------------|
D|----------7--9--10----------------|
A|----------------------------------|
E|----------------------------------|
   ↓  ↑  ↓  ↓  ↑  ↓`,
  },
  {
    slug: "pentatonica-am-posicion1",
    title: "Pentatónica Am — posición 1",
    technique: "scales_modes",
    difficulty: "principiante",
    bpm_start: 60,
    bpm_target: 130,
    description:
      "La caja madre del blues y el rock. Recórrela ascendente y descendente con púa alterna, memorizando el patrón de dos notas por cuerda.",
    focus: "Memoria del patrón y limpieza en el cambio de cuerda.",
    tab: `e|--------------------5--8----------|
B|----------------5--8--------------|
G|------------5--7------------------|
D|--------5--7----------------------|
A|----5--7--------------------------|
E|--5--8----------------------------|`,
  },
  {
    slug: "modo-dorico-2octavas",
    title: "Modo dórico — dos octavas",
    technique: "scales_modes",
    difficulty: "intermedio",
    bpm_start: 60,
    bpm_target: 120,
    description:
      "El dórico aporta ese color menor con sexta mayor, ideal para el blues-rock. Practícalo en dos octavas conectando posiciones a lo largo del mástil.",
    focus: "Conexión fluida de posiciones a lo largo del diapasón.",
    tab: `e|------------------------5--7--8---|
B|------------------5--6--8----------|
G|------------5--7------------------|
D|------5--7--9---------------------|
A|--5--7----------------------------|
E|----------------------------------|`,
  },
  {
    slug: "groove-corcheas-muting",
    title: "Groove — corcheas con palm muting",
    technique: "rhythm_groove",
    difficulty: "principiante",
    bpm_start: 80,
    bpm_target: 160,
    description:
      "Corcheas constantes en la cuerda grave con palm muting apoyando el canto de la mano sobre el puente. La base de todo riff de rock con pegada.",
    focus: "Constancia rítmica y presión uniforme del palm muting.",
    tab: `e|----------------------------------|
B|----------------------------------|
G|----------------------------------|
D|----------------------------------|
A|----------------------------------|
E|--0-0-0-0-0-0-0-0------------------|
   PM--------------|`,
  },
  {
    slug: "galope-tresillo-rock",
    title: "Galope — patrón de tresillo",
    technique: "rhythm_groove",
    difficulty: "intermedio",
    bpm_start: 90,
    bpm_target: 180,
    description:
      "El clásico galope (negra + dos corcheas comprimidas) que impulsa el rock y el metal. La muñeca derecha debe mantener el péndulo aunque no toque todas las notas.",
    focus: "Mantener el movimiento de péndulo constante en la mano derecha.",
    tab: `e|----------------------------------|
B|----------------------------------|
G|----------------------------------|
D|----------------------------------|
A|----------------------------------|
E|--0--0-0--0--0-0--0--0-0----------|
   ↓  ↓ ↑  ↓  ↓ ↑`,
  },
  {
    slug: "alternate-picking-cruce-doble",
    title: "Alternate picking — cruce de dos cuerdas",
    technique: "alternate_picking",
    difficulty: "intermedio",
    bpm_start: 70,
    bpm_target: 150,
    description:
      "Patrón de cuatro notas que cruza entre dos cuerdas adyacentes obligando a un inside picking en el cambio. El cuello de botella técnico que separa velocidades.",
    focus: "Inside picking limpio en el cruce de cuerdas adyacentes.",
    tab: `e|----------------------------------|
B|----------------------------------|
G|--7--5----7--5----7--5------------|
D|------7--5----7--5----7--5--------|
E|----------------------------------|
   ↓  ↑ ↓  ↑`,
  },
  // ── Ejercicios nuevos (inspirados en técnica de guitarra clásica) ──
  {
    slug: "calentamiento-cuerdas-abiertas",
    title: "Calentamiento — 6 cuerdas abiertas",
    technique: "alternate_picking",
    difficulty: "principiante",
    bpm_start: 60,
    bpm_target: 140,
    description:
      "El primer ejercicio antes de cualquier sesión. Cuatro golpes alternos en cada cuerda de aguda a grave. La mano derecha establece el ritmo antes de que la izquierda entre en juego.",
    focus: "Mantener el movimiento de péndulo constante en cada cambio de cuerda.",
    tab: `e|--0--0--0--0-----------------------------|
B|--0--0--0--0-----------------------------|
G|--0--0--0--0-----------------------------|
D|--0--0--0--0-----------------------------|
A|--0--0--0--0-----------------------------|
E|--0--0--0--0-----------------------------|
   ↓  ↑  ↓  ↑`,
  },
  {
    slug: "cruce-3-cuerdas-descendente",
    title: "Cross picking — barrido descendente 3 cuerdas",
    technique: "alternate_picking",
    difficulty: "principiante",
    bpm_start: 60,
    bpm_target: 130,
    description:
      "Patrón de tres cuerdas adyacentes (G-D-A) con cuerdas abiertas en cruce continuo. Cada grupo de tres notas cruza de agudo a grave repitiendo el ciclo. Trabaja el outside picking.",
    focus: "Controlar el outside picking al cruzar de G hacia D.",
    tab: `e|------------------------------------------|
B|------------------------------------------|
G|--0-----------0-----------0---------------|
D|----0-------0---0-------0---0-------------|
A|------0---0-----------0-----------0-------|
E|------------------------------------------|
   ↓  ↓  ↑  ↓  ↓  ↑  ↓  ↓  ↑`,
  },
  {
    slug: "cruce-3-cuerdas-ascendente",
    title: "Cross picking — barrido ascendente 3 cuerdas",
    technique: "alternate_picking",
    difficulty: "principiante",
    bpm_start: 60,
    bpm_target: 130,
    description:
      "Igual que el ejercicio anterior pero desde las cuerdas graves hacia las agudas (A-D-G). Trabaja el inside picking que ocurre al cruzar de A hacia D.",
    focus: "Inside picking limpio en el cruce de A a D.",
    tab: `e|------------------------------------------|
B|------------------------------------------|
G|------0---0-----------0-----------0-------|
D|----0---0---0-------0---0-------0---0-----|
A|--0-----------0---0-----------0-----------|
E|------------------------------------------|
   ↓  ↑  ↓  ↓  ↑  ↓  ↓  ↑  ↓`,
  },
  {
    slug: "hammer-on-basico-1234",
    title: "Hammer-on básico — 1-2-3-4 por cuerda",
    technique: "legato",
    difficulty: "principiante",
    bpm_start: 50,
    bpm_target: 100,
    description:
      "Solo se ataca con púa la primera nota de cada cuerda. Los tres dedos siguientes golpean el traste sin picar. El volumen de cada hammer-on debe igualar el de la nota picada.",
    focus: "Fuerza y volumen uniforme en cada hammer-on, especialmente el dedo 4.",
    tab: `e|--1h2h3h4--------------------------------|
B|--1h2h3h4--------------------------------|
G|--1h2h3h4--------------------------------|
D|--1h2h3h4--------------------------------|
A|--1h2h3h4--------------------------------|
E|--1h2h3h4--------------------------------|
   p  h  h  h`,
  },
  {
    slug: "pull-off-basico-4321",
    title: "Pull-off básico — 4-3-2-1 por cuerda",
    technique: "legato",
    difficulty: "principiante",
    bpm_start: 50,
    bpm_target: 100,
    description:
      "El reverso del ejercicio de hammer-on. Coloca los cuatro dedos en el traste al mismo tiempo y ve soltando de mayor a menor. El pull-off requiere un pequeño tirón lateral de la cuerda.",
    focus: "Tirón lateral controlado para que cada pull-off suene con volumen pleno.",
    tab: `e|--4p3p2p1--------------------------------|
B|--4p3p2p1--------------------------------|
G|--4p3p2p1--------------------------------|
D|--4p3p2p1--------------------------------|
A|--4p3p2p1--------------------------------|
E|--4p3p2p1--------------------------------|
   p  p  p`,
  },
  {
    slug: "trill-1-3-seis-cuerdas",
    title: "Trill dedos 1-3 en las seis cuerdas",
    technique: "legato",
    difficulty: "intermedio",
    bpm_start: 60,
    bpm_target: 160,
    description:
      "Trino sostenido entre los dedos 1 y 3 en cada cuerda durante varios compases. El dedo 1 queda plantado; todo el movimiento viene del dedo 3 desde el nudillo.",
    focus: "Mantener el dedo 1 fijo y mover solo el dedo 3 desde el nudillo, sin tensión.",
    tab: `e|--5h7p5h7p5h7p5--------------------------|
B|--5h7p5h7p5h7p5--------------------------|
G|--5h7p5h7p5h7p5--------------------------|
D|--5h7p5h7p5h7p5--------------------------|
A|--5h7p5h7p5h7p5--------------------------|
E|--5h7p5h7p5h7p5--------------------------|
   h  p  h  p  h  p  h`,
  },
  {
    slug: "legato-hhpp-123",
    title: "Legato HHPP — patrón 1-2-3 por cuerda",
    technique: "legato",
    difficulty: "intermedio",
    bpm_start: 60,
    bpm_target: 140,
    description:
      "Patrón de cuatro notas: dos hammer-ons subiendo y dos pull-offs bajando, recorriendo todas las cuerdas. La cuarta nota (segundo pull-off) tiende a debilitarse — ahí va la atención.",
    focus: "Volumen parejo en las cuatro notas, especialmente el pull-off final.",
    tab: `e|--1h2h3p2p1h2h3p2p1----------------------|
B|--1h2h3p2p1h2h3p2p1----------------------|
G|--1h2h3p2p1h2h3p2p1----------------------|
D|--1h2h3p2p1h2h3p2p1----------------------|
A|--1h2h3p2p1h2h3p2p1----------------------|
E|--1h2h3p2p1h2h3p2p1----------------------|
   h  h  p  p  h  h  p  p`,
  },
  {
    slug: "independencia-patron-134",
    title: "Independencia — patrón 1-3-4",
    technique: "finger_independence",
    difficulty: "intermedio",
    bpm_start: 50,
    bpm_target: 100,
    description:
      "Secuencia que omite el dedo 2 para fortalecer el vínculo entre el anular y el meñique, la combinación más débil para la mayoría de guitarristas. Mantén los dedos inactivos cerca del traste.",
    focus: "Levantar solo el dedo activo; los demás permanecen a ras del traste.",
    tab: `e|--1--3--4--3--1--3--4--3----------------|
B|--1--3--4--3--1--3--4--3----------------|
G|--1--3--4--3--1--3--4--3----------------|
D|--1--3--4--3--1--3--4--3----------------|
A|--1--3--4--3--1--3--4--3----------------|
E|--1--3--4--3--1--3--4--3----------------|
   ↓  ↑  ↓  ↑  ↓  ↑  ↓  ↑`,
  },
  {
    slug: "arpegio-picking-em-abierto",
    title: "Arpeggio picking — Em abierto cuerda a cuerda",
    technique: "alternate_picking",
    difficulty: "principiante",
    bpm_start: 50,
    bpm_target: 120,
    description:
      "Ataca cada cuerda del acorde de Mi menor de manera individual, de grave a agudo y de regreso. Ideal para desarrollar precisión de la púa en un contexto armónico real.",
    focus: "Ataque limpio en cada cuerda sin rozar las adyacentes.",
    tab: `e|-------------------------------0---------|
B|---------------------------0-------------|
G|-----------------------0-----------------|
D|-------------------2---------------------|
A|-------------2---------------------------|
E|--0--------------------------------------|
   ↓  ↑  ↓  ↑  ↓  ↑`,
  },
  {
    slug: "sweep-5c-am-completo",
    title: "Sweep — arpegio Am 5 cuerdas",
    technique: "sweep_picking",
    difficulty: "experto",
    bpm_start: 40,
    bpm_target: 120,
    description:
      "Barrido descendente y ascendente sobre el arpegio de La menor en 5 cuerdas. La mano izquierda ejecuta un rolling preciso para que cada nota suene separada y no ligada.",
    focus: "Rolling de dedos sincronizado con el barrido — una nota a la vez, sin legato involuntario.",
    tab: `e|--5--------------------------------------|
B|----5------------------------------------|
G|------5----------------------------------|
D|--------7--------------------------------|
A|----------7------------------------------|
E|-----------------------------------------|
   ↑   ↑   ↑   ↓   ↓  (de agudo a grave, sweep con ↓)`,
  },

  {
    slug: "legato-pulloff-descendente",
    title: "Legato — cascada de pull-offs",
    technique: "legato",
    difficulty: "avanzado",
    bpm_start: 80,
    bpm_target: 170,
    description:
      "Cascada descendente de pull-offs de tres notas por cuerda. El reto es mantener el volumen parejo en las notas más graves, donde el pull-off tiende a debilitarse.",
    focus: "Fuerza y volumen constante en los pull-offs descendentes.",
    tab: `e|--10p8p5--------------------------|
B|--------10p8p5--------------------|
G|--------------9p7p5---------------|
D|----------------------------------|
A|----------------------------------|
E|----------------------------------|
   p  p`,
  },
];
