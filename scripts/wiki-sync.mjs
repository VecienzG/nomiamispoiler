// Studia la GTA Wiki (Fandom) e genera la lista cifrata dei nomi di GTA VI.
// Uso: node scripts/wiki-sync.mjs [--baseline]
//   --baseline  salva i personaggi di oggi come "già noti prima dell'uscita"
// Studio non commerciale: si prendono solo i titoli delle pagine (nomi), mai i testi.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import vm from 'node:vm';

const ROOT = new URL('..', import.meta.url).pathname;
vm.runInThisContext(readFileSync(`${ROOT}extension/src/hash.js`, 'utf8'));
const { tokens, termHash } = globalThis.NMS_hash;

const API = 'https://gta.fandom.com/api.php';
const UA = 'NoMiamiSpoiler-wiki-sync/0.1 (non-commercial spoiler filter study)';
const ROOT_CATEGORY = 'Category:GTA VI';
const RELEASE = new Date('2026-11-19T00:00:00Z');
const BASELINE_FILE = `${ROOT}scripts/baseline-people.json`;
const OUT_JS = `${ROOT}extension/src/wiki-data.js`;
const OUT_DEBUG = `${ROOT}data/wiki-terms.local.json`;
const OUT_PUBLIC = `${ROOT}docs/wiki.json`;

// Che tipo di categoria è? (null = la ignoriamo)
function kindOf(category) {
  if (/mission|achievement|troph|ending|story/i.test(category)) return 'plot';
  if (/character|organi[sz]ation|gang|people(?! credited)/i.test(category)) return 'people';
  if (/location|county|vice city|vice beach|leonida|ambrosia/i.test(category)) return 'place';
  return null;
}

// Parole che esistono nella lingua reale (anche nomi propri: Florida, Raymond, Capri…):
// da sole non dicono "GTA VI", quindi un nome singolo conta solo se è inventato
const COMMON = new Set(
  existsSync('/usr/share/dict/words')
    ? readFileSync('/usr/share/dict/words', 'utf8').split('\n').filter(Boolean).map((w) => w.toLowerCase())
    : [],
);
// Luoghi ed enti reali o già visti nei vecchi GTA: darebbero falsi allarmi
const EXCLUDE = [
  /^unnamed\b/i,
  /\b(florida|mexico|america|atlantic ocean|united states|san andreas)\b/i,
  /^vice city( in |$|\s*\(hd\))/i,
  /^(keys|southside|crosstown|yorktown|redhill|rockridge|final chapter|american football federation|dale county)$/i,
  /^(national coast guard|little cuba|ocean beach|north beaches|washington beach|starfish island|downtown vice city)$/i,
];
for (const w of ['the', 'and', 'del', 'della', 'los', 'las', 'mr', 'mrs', 'jr', 'sr', 'aunt', 'uncle']) COMMON.add(w);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(params) {
  const url = `${API}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.ok) {
      await sleep(350); // con calma: niente raffiche sull'API
      return res.json();
    }
    await sleep(2000 * (attempt + 1));
  }
  throw new Error(`API non risponde: ${url}`);
}

async function members(category) {
  const out = [];
  let cont = {};
  do {
    const d = await api({
      action: 'query',
      list: 'categorymembers',
      cmtitle: category,
      cmlimit: '500',
      cmprop: 'title|type|timestamp',
      ...cont,
    });
    out.push(...d.query.categorymembers);
    cont = d.continue ?? null;
  } while (cont);
  return out;
}

// Soprannomi: le pagine di reindirizzamento verso ogni pagina
async function redirects(titles) {
  const alt = new Map();
  for (let i = 0; i < titles.length; i += 50) {
    let cont = {};
    do {
      const d = await api({
        action: 'query',
        prop: 'redirects',
        titles: titles.slice(i, i + 50).join('|'),
        rdlimit: 'max',
        rdnamespace: '0',
        ...cont,
      });
      for (const p of d.query.pages) {
        for (const r of p.redirects ?? []) {
          if (!alt.has(p.title)) alt.set(p.title, []);
          alt.get(p.title).push(r.title);
        }
      }
      cont = d.continue ?? null;
    } while (cont);
  }
  return alt;
}

// Primo inserimento della pagina: serve a capire chi è comparso dopo l'uscita
async function createdAt(titles) {
  const out = new Map();
  for (const t of titles) {
    const d = await api({ action: 'query', prop: 'revisions', titles: t, rvdir: 'newer', rvlimit: '1', rvprop: 'timestamp' });
    const ts = d.query.pages[0]?.revisions?.[0]?.timestamp;
    if (ts) out.set(t, new Date(ts));
  }
  return out;
}

function clean(title) {
  return title
    .replace(/\s*\((HD Universe|GTA VI|Grand Theft Auto VI|character|mission|[^)]*generation)\)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tierFor(term, kind) {
  const words = tokens(term);
  if (!words.length || EXCLUDE.some((re) => re.test(term))) return null;
  // sigle corte (PVC, AFF, PGH) sono parole di tutti i giorni
  if (words.length === 1 && words[0].length <= 3) return null;
  if (kind === 'plot') return words.length >= 2 || !COMMON.has(words[0]) ? 'p' : null;
  if (words.length >= 2) return 'w';
  return COMMON.has(words[0]) ? null : 'k';
}

// ---- Giro sulla wiki ----

console.log(`Studio ${ROOT_CATEGORY}…`);
const seen = new Set();
const pages = new Map(); // titolo → kind
const queue = [[ROOT_CATEGORY, null]];
while (queue.length) {
  const [cat, parentKind] = queue.shift();
  if (seen.has(cat)) continue;
  seen.add(cat);
  const kind = kindOf(cat) ?? parentKind;
  for (const m of await members(cat)) {
    if (m.type === 'subcat') {
      if (kindOf(m.title) || kind) queue.push([m.title, kindOf(m.title) ?? kind]);
    } else if (m.type === 'page' && kind && !m.title.includes('/')) {
      // "plot" vince su tutto: un personaggio che compare in una missione resta personaggio
      if (!pages.has(m.title) || kind === 'plot') pages.set(m.title, kind);
    }
  }
}
const byKind = (k) => [...pages].filter(([, v]) => v === k).map(([t]) => t);
console.log(`Categorie lette: ${seen.size} · pagine utili: ${pages.size}`);
console.log(`  persone ${byKind('people').length} · luoghi ${byKind('place').length} · trama ${byKind('plot').length}`);

const alt = await redirects([...pages.keys()]);

// Chi è nuovo dopo l'uscita è già di per sé uno spoiler
let baseline = existsSync(BASELINE_FILE) ? new Set(JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))) : null;
if (process.argv.includes('--baseline')) {
  baseline = new Set(byKind('people').map(termHash));
  writeFileSync(BASELINE_FILE, JSON.stringify([...baseline].sort(), null, 0));
  console.log(`Baseline salvata: ${baseline.size} personaggi noti prima dell'uscita`);
}
let newPeople = new Set();
if (baseline && Date.now() >= RELEASE) {
  const unknown = byKind('people').filter((t) => !baseline.has(termHash(t)));
  const created = await createdAt(unknown);
  newPeople = new Set(unknown.filter((t) => (created.get(t) ?? new Date()) >= RELEASE));
}

// ---- Classificazione ----

const tiers = { w: new Set(), k: new Set(), p: new Set() };
const debug = [];
let maxWords = 1;
for (const [title, kind] of pages) {
  const effective = newPeople.has(title) ? 'plot' : kind;
  for (const name of [title, ...(alt.get(title) ?? [])]) {
    const term = clean(name);
    const tier = tierFor(term, effective);
    debug.push({ term, from: title, kind: effective, tier });
    if (!tier) continue;
    tiers[tier].add(termHash(term));
    maxWords = Math.max(maxWords, Math.min(tokens(term).length, 6));
  }
}
// Un'impronta sta in un solo livello: vince il più forte
for (const h of tiers.p) tiers.w.delete(h), tiers.k.delete(h);
for (const h of tiers.w) tiers.k.delete(h);

const data = {
  v: 1,
  generated: new Date().toISOString(),
  source: 'gta.fandom.com (CC BY-SA), solo nomi',
  maxWords,
  w: [...tiers.w].sort(),
  k: [...tiers.k].sort(),
  p: [...tiers.p].sort(),
};
// Stessi nomi di prima? Allora non si tocca niente (niente commit inutili ogni 6 ore)
const same = (a, b) => a && ['maxWords', 'w', 'k', 'p'].every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k]));
const previous = existsSync(OUT_PUBLIC) ? JSON.parse(readFileSync(OUT_PUBLIC, 'utf8')) : null;
if (same(previous, data)) {
  console.log(`Nessun cambiamento: ${data.w.length + data.k.length + data.p.length} impronte già pubblicate`);
  process.exit(0);
}

writeFileSync(
  OUT_JS,
  `// Generato da scripts/wiki-sync.mjs: impronte dei nomi, non modificare a mano.\nglobalThis.NMS_WIKI = ${JSON.stringify(data)};\n`,
);
mkdirSync(`${ROOT}docs`, { recursive: true });
writeFileSync(OUT_PUBLIC, JSON.stringify(data));
mkdirSync(`${ROOT}data`, { recursive: true });
writeFileSync(OUT_DEBUG, JSON.stringify(debug, null, 2));
console.log(`Impronte: ${data.w.length} nomi specifici · ${data.k.length} nomi singoli · ${data.p.length} di trama`);
console.log(`Scritto ${OUT_JS.replace(ROOT, '')} (leggibile per debug: ${OUT_DEBUG.replace(ROOT, '')}, escluso da git)`);
