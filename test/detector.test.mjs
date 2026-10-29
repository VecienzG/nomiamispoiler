// node test/detector.test.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

for (const f of ['keywords.js', 'hash.js', 'wiki-data.js', 'detector.js']) {
  vm.runInThisContext(readFileSync(new URL(`../extension/src/${f}`, import.meta.url), 'utf8'));
}
const d = globalThis.NMS_createDetector(globalThis.NMS_KEYWORDS, ['brucia tutto'], globalThis.NMS_WIKI);

const cases = [
  // [testo, livello, ai, blocca?, motivo]
  ['GTA 6 ending explained: what happens to Lucia', 'leggero', false, true, 'spoiler'],
  ['Il finale di GTA VI mi ha distrutto', 'leggero', false, true, 'spoiler'],
  ['GTA 6 review (no spoilers)', 'leggero', false, false],
  ['Recensione GTA 6 senza spoiler', 'medio', false, false],
  ['GTA 6 final trailer is out', 'leggero', false, false],
  ['GTA 6 release date revealed', 'leggero', false, false],
  ['Jason Duval in the Leonida Keys mission', 'medio', false, true, 'story'],
  ['non ci credo che il fratello di Lucia in GTA 6...', 'medio', true, true, 'ai'],
  ['GTA 6 runs at 30 fps on PS5', 'medio', false, false],
  ['GTA 6 runs at 30 fps on PS5', 'paranoico', false, true, 'gta'],
  ['Jason e Lucia, che coppia', 'medio', false, true, 'story'],
  ['Jason Momoa ha detto che', 'paranoico', false, false],
  ['Lucia ha comprato il pane', 'paranoico', false, false],
  ['Vice City Rockstar classic', 'medio', false, false],
  ['gta6 leak finale', 'leggero', false, true, 'spoiler'],
  ['oggi brucia tutto', 'leggero', false, true, 'custom'],
  ['El final de GTA VI es increíble', 'leggero', false, true, 'spoiler'],

  // nomi che arrivano solo dalla wiki (non sono in keywords.js)
  ['Petra Navarro ed Erin Henshaw insieme', 'medio', false, true, 'story'],
  ['Tisha-Wocka visto ai Vice City Mambas', 'medio', false, true, 'story'],
  ['Il manuale di Ekanfinaka', 'paranoico', false, false],
  ['Florida Keys travel guide with Raymond', 'paranoico', false, false],
];

// trama: una missione finta nel livello "p"
const H = globalThis.NMS_hash;
const plot = globalThis.NMS_createDetector(globalThis.NMS_KEYWORDS, [], { maxWords: 3, w: [], k: [], p: [H.termHash('Sweet Revenge')] });
cases.push(['GTA 6 sweet revenge was crazy', 'leggero', false, true, 'spoiler', plot]);
cases.push(['Sweet revenge is a dish best served cold', 'leggero', false, false, null, plot]);

let ok = 0;
for (const [text, level, ai, block, reason, det = d] of cases) {
  const r = det.analyze(text, level, ai);
  try {
    assert.equal(r.block, block, 'block');
    if (reason) assert.equal(r.reason, reason, 'reason');
    ok++;
  } catch (e) {
    console.log(`✗ [${level}${ai ? '+ai' : ''}] "${text}" →`, r);
  }
}
assert.equal(d.hint('Ciao mondo'), false);
assert.equal(d.hint('nuovo video su GTA'), true);
console.log(`${ok}/${cases.length} casi ok`);
process.exit(ok === cases.length ? 0 : 1);
