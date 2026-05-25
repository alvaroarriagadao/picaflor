/**
 * Tab generator — builds perfectly aligned ASCII tabs from structured beat data.
 *
 * Usage:
 *   node scripts/generate-tabs.mjs
 *
 * Each exercise is defined as an array of beats.
 * A beat: { e, B, G, D, A, E, pick }
 *   - string values: fret number (string) or '' for empty
 *   - pick: '↓' | '↑' | 'T' | 'h' | 'p' | 'b' | '~' | '' for none
 */

const STRINGS = ['e', 'B', 'G', 'D', 'A', 'E'];

/**
 * Build an ASCII tab from beats array.
 * @param {Array<{e,B,G,D,A,E,pick}>} beats
 * @param {{ repeatMeasures?: number }} opts
 */
function buildTab(beats, opts = {}) {
  const { repeatMeasures = 1 } = opts;
  const repeated = [];
  for (let i = 0; i < repeatMeasures; i++) repeated.push(...beats);

  // Compute column width per beat (max note length across all strings)
  const colWidths = repeated.map(beat => {
    let max = 1;
    for (const s of STRINGS) {
      const v = String(beat[s] ?? '');
      if (v.length > max) max = v.length;
    }
    return max;
  });

  // Build string lines
  const stringLines = {};
  for (const s of STRINGS) {
    let line = `${s}|`;
    for (let b = 0; b < repeated.length; b++) {
      const val = String(repeated[b][s] ?? '');
      const w = colWidths[b];
      // right-pad with dashes
      line += '--' + val.padEnd(w, '-');
    }
    line += '--|';
    stringLines[s] = line;
  }

  // Compute note column positions (1-based)
  // Prefix "e|" = 2 chars, then each beat: "--" (2) + w chars
  const notePositions = []; // col of first char in each beat
  let pos = 2; // after "e|"
  for (let b = 0; b < repeated.length; b++) {
    pos += 2; // "--" prefix
    notePositions.push(pos + 1); // 1-based col
    pos += colWidths[b];
  }

  // Build picking / annotation row
  const hasPick = repeated.some(b => b.pick && b.pick !== '');
  let pickLine = '';
  if (hasPick) {
    // Build char array, fill with spaces
    const maxLen = Math.max(...Object.values(stringLines).map(l => l.length));
    const chars = Array(maxLen + 2).fill(' ');
    for (let b = 0; b < repeated.length; b++) {
      const sym = repeated[b].pick ?? '';
      if (sym) {
        const col = notePositions[b] - 1; // 0-based
        for (let i = 0; i < sym.length; i++) {
          chars[col + i] = sym[i];
        }
      }
    }
    pickLine = chars.join('').trimEnd();
  }

  const lines = STRINGS.map(s => stringLines[s]);
  if (pickLine) lines.push(pickLine);
  return lines.join('\n');
}

// ─── Exercise definitions ────────────────────────────────────────────────────

function beat(e='', B='', G='', D='', A='', E='', pick='') {
  return { e, B, G, D, A, E, pick };
}

const exercises = {

  // 1. Cromático 1-2-3-4 ascendente
  'cromatico-1234-ascenso': buildTab([
    beat('','','','','','1','↓'), beat('','','','','','2','↑'),
    beat('','','','','','3','↓'), beat('','','','','','4','↑'),
    beat('','','','','1','','↓'), beat('','','','','2','','↑'),
    beat('','','','','3','','↓'), beat('','','','','4','','↑'),
    beat('','','','1','','','↓'), beat('','','','2','','','↑'),
    beat('','','','3','','','↓'), beat('','','','4','','','↑'),
    beat('','','1','','','','↓'), beat('','','2','','','','↑'),
    beat('','','3','','','','↓'), beat('','','4','','','','↑'),
  ]),

  // 2. Cromático 1-2-3-4 descendente
  'cromatico-1234-descenso': buildTab([
    beat('4','','','','','','↓'), beat('3','','','','','','↑'),
    beat('2','','','','','','↓'), beat('1','','','','','','↑'),
    beat('','4','','','','','↓'), beat('','3','','','','','↑'),
    beat('','2','','','','','↓'), beat('','1','','','','','↑'),
    beat('','','4','','','','↓'), beat('','','3','','','','↑'),
    beat('','','2','','','','↓'), beat('','','1','','','','↑'),
    beat('','','','4','','','↓'), beat('','','','3','','','↑'),
    beat('','','','2','','','↓'), beat('','','','1','','','↑'),
  ]),

  // 3. Spider walk 1-3-2-4
  'spider-walk-permutacion': buildTab([
    beat('','','','1','','',''), beat('','','','3','','',''),
    beat('','','','2','','',''), beat('','','','4','','',''),
    beat('','','','','1','',''), beat('','','','','3','',''),
    beat('','','','','2','',''), beat('','','','','4','',''),
    beat('','','','','','1',''), beat('','','','','','3',''),
    beat('','','','','','2',''), beat('','','','','','4',''),
  ]),

  // 4. Legato tresillos mayor
  'legato-tresillos-mayor': buildTab([
    beat('','','','','5h7','','p'), beat('','','','','','',''),
    beat('','','','','','',''), beat('','','5h7','','','','p'),
    beat('','','','','','',''), beat('','','','','','5h7','p'),
    beat('','','','','','',''), beat('','5h7','','','','','p'),
    beat('','','','','','',''), beat('5h7','','','','','','p'),
  ]),

  // 5. String skipping — arpegio abierto
  'string-skipping-arpegio': buildTab([
    beat('7','','','','','','↓'), beat('','','7','','','','↑'),
    beat('','','','','7','','↓'), beat('','','7','','','','↑'),
    beat('7','','','','','','↓'), beat('','','7','','','','↑'),
    beat('','','','','7','','↓'), beat('','','7','','','','↑'),
  ]),

  // 6. Sweep tríada menor 3 cuerdas
  'sweep-triada-menor-3c': buildTab([
    beat('','','9','','','','↓'), beat('','8','','','','','↓'),
    beat('8','','','','','','↓'), beat('','8','','','','','↑'),
    beat('','','9','','','','↑'), beat('','8','','','','','↑'),
    beat('8','','','','','','↓'), beat('','8','','','','','↓'),
  ]),

  // 7. Tapping arpegio Am (using single-position: T=tap, p=pull-off, h=hammer-on)
  'tapping-arpegio-am': buildTab([
    beat('T','','','','','','T'), beat('','','','','','','p'),
    beat('h','','','','','','h'), beat('T','','','','','','T'),
    beat('','','','','','','p'), beat('h','','','','','','h'),
    beat('T','','','','','','T'), beat('','','','','','','p'),
    beat('h','','','','','','h'),
  ]),

  // 8. Bending — tono completo
  'bending-afinacion-tono': buildTab([
    beat('','8','','','','','ref'), beat('','','','','','',''),
    beat('','8b','','','','','b'), beat('','','','','','',''),
    beat('','8b','','','','','b'), beat('','','','','','',''),
  ]),

  // 9. Vibrato controlado
  'vibrato-control-lento': buildTab([
    beat('','8~','','','','','vib'), beat('','','','','','',''),
    beat('','','','','','',''), beat('','8~','','','','','vib'),
    beat('','','','','','',''), beat('','','','','','',''),
  ]),

  // 10. Economy picking 3 NPS
  'economy-picking-3nps': buildTab([
    beat('','','5','','','','↓'), beat('','','7','','','','↑'),
    beat('','','9','','','','↓'), beat('','','','7','','','↓'),
    beat('','','','9','','','↑'), beat('','','','','7','','↓'),
  ]),

  // 11. Pentatónica Am pos 1
  'pentatonica-am-posicion1': buildTab([
    beat('','','','','','5','↓'), beat('','','','','','8','↑'),
    beat('','','','','5','','↓'), beat('','','','','7','','↑'),
    beat('','','','5','','','↓'), beat('','','','7','','','↑'),
    beat('','','5','','','','↓'), beat('','','7','','','','↑'),
    beat('','5','','','','','↓'), beat('','8','','','','','↑'),
    beat('5','','','','','','↓'), beat('8','','','','','','↑'),
  ]),

  // 12. Modo dórico
  'modo-dorico-2octavas': buildTab([
    beat('','','','','','5','↓'), beat('','','','','','7','↑'),
    beat('','','','','5','','↓'), beat('','','','','7','','↑'),
    beat('','','','5','','','↓'), beat('','','','7','','','↑'),
    beat('','','','9','','','↓'), beat('','','5','','','','↑'),
    beat('','','7','','','','↓'), beat('','5','','','','','↑'),
    beat('','6','','','','','↓'), beat('','8','','','','','↑'),
    beat('5','','','','','','↓'), beat('7','','','','','','↑'),
    beat('8','','','','','','↓'),
  ]),

  // 13. Groove palm muting
  'groove-corcheas-muting': buildTab([
    beat('','','','','','0','↓'), beat('','','','','','0','↑'),
    beat('','','','','','0','↓'), beat('','','','','','0','↑'),
    beat('','','','','','0','↓'), beat('','','','','','0','↑'),
    beat('','','','','','0','↓'), beat('','','','','','0','↑'),
  ]),

  // 14. Galope tresillo
  'galope-tresillo-rock': buildTab([
    beat('','','','','','0','↓'), beat('','','','','','0','↓'),
    beat('','','','','','0','↑'), beat('','','','','','0','↓'),
    beat('','','','','','0','↓'), beat('','','','','','0','↑'),
    beat('','','','','','0','↓'), beat('','','','','','0','↓'),
    beat('','','','','','0','↑'),
  ]),

  // 15. Alternate picking cruce 2 cuerdas
  'alternate-picking-cruce-doble': buildTab([
    beat('','','7','','','','↓'), beat('','','5','','','','↑'),
    beat('','','','7','','','↓'), beat('','','','5','','','↑'),
    beat('','','7','','','','↓'), beat('','','5','','','','↑'),
    beat('','','','7','','','↓'), beat('','','','5','','','↑'),
  ]),

  // 16. Legato pull-off cascada
  'legato-pulloff-descendente': buildTab([
    beat('9p7','','','','','','p'), beat('','9p7','','','','','p'),
    beat('','','9p7','','','','p'), beat('','','','','','',''),
    beat('9p7','','','','','','p'), beat('','9p7','','','','','p'),
    beat('','','9p7','','','','p'),
  ]),

  // 17. Calentamiento cuerdas abiertas
  'calentamiento-cuerdas-abiertas': buildTab([
    beat('0','0','0','0','0','0','↓'), beat('0','0','0','0','0','0','↑'),
    beat('0','0','0','0','0','0','↓'), beat('0','0','0','0','0','0','↑'),
    beat('0','0','0','0','0','0','↓'), beat('0','0','0','0','0','0','↑'),
    beat('0','0','0','0','0','0','↓'), beat('0','0','0','0','0','0','↑'),
  ]),

  // 18. Cross picking descendente 3 cuerdas
  'cruce-3-cuerdas-descendente': buildTab([
    beat('','','0','','','','↓'), beat('','','','0','','','↓'),
    beat('','','','','0','','↑'), beat('','','0','','','','↓'),
    beat('','','','0','','','↓'), beat('','','','','0','','↑'),
    beat('','','0','','','','↓'), beat('','','','0','','','↓'),
    beat('','','','','0','','↑'), beat('','','0','','','','↓'),
    beat('','','','0','','','↓'), beat('','','','','0','','↑'),
  ]),

  // 19. Cross picking ascendente 3 cuerdas
  'cruce-3-cuerdas-ascendente': buildTab([
    beat('','','','','0','','↓'), beat('','','','0','','','↓'),
    beat('','','0','','','','↑'), beat('','','','','0','','↓'),
    beat('','','','0','','','↓'), beat('','','0','','','','↑'),
    beat('','','','','0','','↓'), beat('','','','0','','','↓'),
    beat('','','0','','','','↑'), beat('','','','','0','','↓'),
    beat('','','','0','','','↓'), beat('','','0','','','','↑'),
  ]),

  // 20. Hammer-on básico 1-2-3-4
  'hammer-on-basico-1234': buildTab([
    beat('1h2','','','','','','p'), beat('','','','','','',''),
    beat('1h3','','','','','','p'), beat('','','','','','',''),
    beat('1h4','','','','','','p'), beat('','','','','','',''),
    beat('','1h2','','','','','p'), beat('','','','','','',''),
    beat('','1h3','','','','','p'), beat('','','','','','',''),
    beat('','1h4','','','','','p'), beat('','','','','','',''),
  ]),

  // 21. Pull-off básico 4-3-2-1
  'pull-off-basico-4321': buildTab([
    beat('4p1','','','','','','p'), beat('','','','','','',''),
    beat('4p2','','','','','','p'), beat('','','','','','',''),
    beat('4p3','','','','','','p'), beat('','','','','','',''),
    beat('','4p1','','','','','p'), beat('','','','','','',''),
    beat('','4p2','','','','','p'), beat('','','','','','',''),
    beat('','4p3','','','','','p'), beat('','','','','','',''),
  ]),

  // 22. Trill 1-3
  'trill-1-3-seis-cuerdas': buildTab([
    beat('','','','','','5h7','h'), beat('','','','','','p5','p'),
    beat('','','','','','5h7','h'), beat('','','','','','p5','p'),
    beat('','','','','5h7','','h'), beat('','','','','p5','','p'),
    beat('','','','','5h7','','h'), beat('','','','','p5','','p'),
    beat('','','','5h7','','','h'), beat('','','','p5','','','p'),
    beat('','','5h7','','','','h'), beat('','','p5','','','','p'),
  ]),

  // 23. Legato HHPP
  'legato-hhpp-123': buildTab([
    beat('','','','','','1h2','h'), beat('','','','','','h3','h'),
    beat('','','','','','p2','p'), beat('','','','','','p1','p'),
    beat('','','','','1h2','','h'), beat('','','','','h3','','h'),
    beat('','','','','p2','','p'), beat('','','','','p1','','p'),
    beat('','','','1h2','','','h'), beat('','','','h3','','','h'),
    beat('','','','p2','','','p'), beat('','','','p1','','','p'),
  ]),

  // 24. Independencia 1-3-4
  'independencia-patron-134': buildTab([
    beat('','','','','','1','↓'), beat('','','','','','3','↑'),
    beat('','','','','','4','↓'), beat('','','','','','3','↑'),
    beat('','','','','1','','↓'), beat('','','','','3','','↑'),
    beat('','','','','4','','↓'), beat('','','','','3','','↑'),
    beat('','','','1','','','↓'), beat('','','','3','','','↑'),
    beat('','','','4','','','↓'), beat('','','','3','','','↑'),
    beat('','','1','','','','↓'), beat('','','3','','','','↑'),
    beat('','','4','','','','↓'), beat('','','3','','','','↑'),
  ]),

  // 25. Arpeggio Em abierto
  'arpegio-picking-em-abierto': buildTab([
    beat('','','','','','0','↓'), beat('','','','','2','','↑'),
    beat('','','','2','','','↓'), beat('','','0','','','','↑'),
    beat('','0','','','','','↓'), beat('0','','','','','','↑'),
    beat('','0','','','','','↓'), beat('','','0','','','','↑'),
    beat('','','','2','','','↓'), beat('','','','','2','','↑'),
    beat('','','','','','0','↓'),
  ]),

  // 26. Sweep Am 5 cuerdas
  'sweep-5c-am-completo': buildTab([
    beat('','','','','7','','↑'), beat('','','','5','','','↑'),
    beat('','','5','','','','↑'), beat('','5','','','','','↑'),
    beat('5','','','','','','↑'), beat('','5','','','','','↓'),
    beat('','','5','','','','↓'), beat('','','','5','','','↓'),
    beat('','','','','7','','↓'),
  ]),
};

// ─── Output SQL ──────────────────────────────────────────────────────────────

function escapeSql(str) {
  return str.replace(/'/g, "''");
}

const slugs = Object.keys(exercises);
const updates = slugs.map(slug => {
  const tab = exercises[slug];
  return `UPDATE public.exercises SET tab = '${escapeSql(tab)}' WHERE slug = '${slug}';`;
}).join('\n');

console.log('-- Auto-generated tab alignment SQL');
console.log('-- Generated:', new Date().toISOString());
console.log();
console.log(updates);

// Also print each tab for visual inspection
console.log('\n\n-- Visual inspection:');
slugs.forEach(slug => {
  console.log(`\n-- ${slug}:`);
  console.log(exercises[slug]);
  console.log('---');
});
