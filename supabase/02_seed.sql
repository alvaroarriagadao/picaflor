-- Picaflor · Datos semilla de ejercicios (contenido original)
-- Generado automáticamente. Idempotente vía ON CONFLICT (slug).

insert into public.exercises (slug, title, technique, difficulty, bpm_start, bpm_target, description, focus, tab) values
  ('cromatico-1234-ascenso', 'Cromático 1-2-3-4 ascendente', 'alternate_picking', 'principiante', 60, 140, 'El calentamiento fundamental. Recorre las cuatro cuerdas más graves con un dedo por traste, manteniendo púa alterna estricta (abajo-arriba) en cada nota.', 'Sincronización mano derecha/izquierda y púa alterna estricta.', 'e|------------------------------------------|
B|------------------------------------------|
G|------------------------------------------|
D|------------------------------------------|
A|----------------------1--2--3--4----------|
E|--1--2--3--4------------------------------|
   ↓  ↑  ↓  ↑      ↓  ↑  ↓  ↑'),
  ('cromatico-1234-descenso', 'Cromático 1-2-3-4 descendente', 'alternate_picking', 'principiante', 60, 140, 'La versión inversa del calentamiento cromático. Baja desde la primera cuerda hacia las graves manteniendo la alternancia de púa sin interrupción al cambiar de cuerda.', 'Control del cambio de cuerda descendente con púa alterna.', 'e|--4--3--2--1------------------------------|
B|----------------4--3--2--1----------------|
G|------------------------------------------|
D|------------------------------------------|
A|------------------------------------------|
E|------------------------------------------|
   ↓  ↑  ↓  ↑      ↓  ↑  ↓  ↑'),
  ('spider-walk-permutacion', 'Spider walk — permutación 1-3-2-4', 'finger_independence', 'intermedio', 50, 120, 'Patrón de araña que rompe el orden secuencial de los dedos para forzar independencia real. El salto del dedo 3 al 2 es donde se gana el control.', 'Independencia y economía de movimiento de los dedos 2 y 3.', 'e|------------------------------------------|
B|------------------------------------------|
G|------------------------------------------|
D|--1--3--2--4------------------------------|
A|----------------1--3--2--4----------------|
E|------------------------------------------|'),
  ('legato-tresillos-mayor', 'Legato en tresillos — escala mayor', 'legato', 'intermedio', 70, 150, 'Tresillos ligados usando hammer-on y pull-off sobre tres notas por cuerda. La púa solo ataca la primera nota de cada cuerda; el resto suena por presión.', 'Uniformidad de volumen entre nota atacada y notas ligadas.', 'e|--------------------------------|
B|--------------------------------|
G|--------------------------------|
D|--------------------------------|
A|--5h7h8----7h8h10---------------|
E|--------5h7-------5h7h8----------|
   p   h  h'),
  ('string-skipping-arpegio', 'String skipping — arpegio abierto', 'string_skipping', 'avanzado', 60, 130, 'Salta una cuerda intermedia en cada movimiento para entrenar la precisión de la púa y silenciar la cuerda no tocada con la palma.', 'Precisión de ataque saltando cuerdas y muting de la cuerda media.', 'e|--7----------7--------------------|
B|----------------------------------|
G|------7----------7----------------|
D|----------------------------------|
A|--------7----------7--------------|
E|----------------------------------|'),
  ('sweep-triada-menor-3c', 'Sweep — tríada menor 3 cuerdas', 'sweep_picking', 'avanzado', 50, 120, 'Barrido de tres cuerdas sobre una tríada menor. La púa hace un solo movimiento continuo descendente y ascendente; los dedos sueltan cada nota para evitar que suenen juntas.', 'Sincronía del barrido con el rolling de los dedos izquierdos.', 'e|--------8--------8----------------|
B|------8----8---8----8-------------|
G|----9--------9--------9-----------|
D|----------------------------------|
A|----------------------------------|
E|----------------------------------|
   ↓  ↓  ↑  ↑'),
  ('tapping-arpegio-am', 'Tapping — arpegio de Am', 'tapping', 'avanzado', 60, 140, 'Tapping a dos manos sobre el arpegio de La menor. El dedo de la mano derecha (T) golpea el traste alto, seguido de pull-off a las notas de la mano izquierda.', 'Claridad del tap y control del pull-off de salida.', 'e|--12t-5-8--12t-5-8----------------|
B|----------------------------------|
G|----------------------------------|
D|----------------------------------|
A|----------------------------------|
E|----------------------------------|
   T   p p'),
  ('bending-afinacion-tono', 'Bending de afinación — tono completo', 'bending_vibrato', 'intermedio', 50, 90, 'Toca la nota destino primero como referencia, luego bendea desde dos trastes abajo hasta igualar esa altura exacta. El oído es el juez.', 'Precisión de afinación del bend y estabilidad al sostenerlo.', 'e|----------------------------------|
B|--10----8b(10)--8b(10)------------|
G|----------------------------------|
D|----------------------------------|
A|----------------------------------|
E|----------------------------------|
   ref  bend     bend'),
  ('vibrato-control-lento', 'Vibrato controlado — pulsos lentos', 'bending_vibrato', 'intermedio', 50, 80, 'Vibrato medido al metrónomo: cada oscilación cae exactamente en el pulso. Empieza con vibrato ancho y lento para ganar control antes que velocidad.', 'Regularidad y amplitud constante del vibrato desde la muñeca.', 'e|----------------------------------|
B|--8~~~~~~~~--10~~~~~~~~------------|
G|----------------------------------|
D|----------------------------------|
A|----------------------------------|
E|----------------------------------|
   vib        vib'),
  ('economy-picking-3nps', 'Economy picking — 3 notas por cuerda', 'economy_picking', 'avanzado', 70, 160, 'En el cambio de cuerda, la púa sigue en la misma dirección (barrido económico) en lugar de alternar. Reduce el movimiento y aumenta la velocidad sostenible.', 'Identificar el punto de economía en el cruce de cuerda.', 'e|----------------------------------|
B|----------------------------------|
G|--5--7--9-------------------------|
D|----------7--9--10----------------|
A|----------------------------------|
E|----------------------------------|
   ↓  ↑  ↓  ↓  ↑  ↓'),
  ('pentatonica-am-posicion1', 'Pentatónica Am — posición 1', 'scales_modes', 'principiante', 60, 130, 'La caja madre del blues y el rock. Recórrela ascendente y descendente con púa alterna, memorizando el patrón de dos notas por cuerda.', 'Memoria del patrón y limpieza en el cambio de cuerda.', 'e|--------------------5--8----------|
B|----------------5--8--------------|
G|------------5--7------------------|
D|--------5--7----------------------|
A|----5--7--------------------------|
E|--5--8----------------------------|'),
  ('modo-dorico-2octavas', 'Modo dórico — dos octavas', 'scales_modes', 'intermedio', 60, 120, 'El dórico aporta ese color menor con sexta mayor, ideal para el blues-rock. Practícalo en dos octavas conectando posiciones a lo largo del mástil.', 'Conexión fluida de posiciones a lo largo del diapasón.', 'e|------------------------5--7--8---|
B|------------------5--6--8----------|
G|------------5--7------------------|
D|------5--7--9---------------------|
A|--5--7----------------------------|
E|----------------------------------|'),
  ('groove-corcheas-muting', 'Groove — corcheas con palm muting', 'rhythm_groove', 'principiante', 80, 160, 'Corcheas constantes en la cuerda grave con palm muting apoyando el canto de la mano sobre el puente. La base de todo riff de rock con pegada.', 'Constancia rítmica y presión uniforme del palm muting.', 'e|----------------------------------|
B|----------------------------------|
G|----------------------------------|
D|----------------------------------|
A|----------------------------------|
E|--0-0-0-0-0-0-0-0------------------|
   PM--------------|'),
  ('galope-tresillo-rock', 'Galope — patrón de tresillo', 'rhythm_groove', 'intermedio', 90, 180, 'El clásico galope (negra + dos corcheas comprimidas) que impulsa el rock y el metal. La muñeca derecha debe mantener el péndulo aunque no toque todas las notas.', 'Mantener el movimiento de péndulo constante en la mano derecha.', 'e|----------------------------------|
B|----------------------------------|
G|----------------------------------|
D|----------------------------------|
A|----------------------------------|
E|--0--0-0--0--0-0--0--0-0----------|
   ↓  ↓ ↑  ↓  ↓ ↑'),
  ('alternate-picking-cruce-doble', 'Alternate picking — cruce de dos cuerdas', 'alternate_picking', 'intermedio', 70, 150, 'Patrón de cuatro notas que cruza entre dos cuerdas adyacentes obligando a un inside picking en el cambio. El cuello de botella técnico que separa velocidades.', 'Inside picking limpio en el cruce de cuerdas adyacentes.', 'e|----------------------------------|
B|----------------------------------|
G|--7--5----7--5----7--5------------|
D|------7--5----7--5----7--5--------|
E|----------------------------------|
   ↓  ↑ ↓  ↑'),
  ('legato-pulloff-descendente', 'Legato — cascada de pull-offs', 'legato', 'avanzado', 80, 170, 'Cascada descendente de pull-offs de tres notas por cuerda. El reto es mantener el volumen parejo en las notas más graves, donde el pull-off tiende a debilitarse.', 'Fuerza y volumen constante en los pull-offs descendentes.', 'e|--10p8p5--------------------------|
B|--------10p8p5--------------------|
G|--------------9p7p5---------------|
D|----------------------------------|
A|----------------------------------|
E|----------------------------------|
   p  p')
on conflict (slug) do update set
  title = excluded.title,
  technique = excluded.technique,
  difficulty = excluded.difficulty,
  bpm_start = excluded.bpm_start,
  bpm_target = excluded.bpm_target,
  description = excluded.description,
  focus = excluded.focus,
  tab = excluded.tab;
