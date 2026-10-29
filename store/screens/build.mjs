// Genera le immagini per gli store: 4 screenshot 1280x800, promo 440x280, banner 1400x560, in IT e EN.
// Prima: node store/screens/popup-shot.mjs · Poi: node store/screens/build.mjs
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url).pathname;
const OUT = `${ROOT}store/out`;
mkdirSync(OUT, { recursive: true });

function icon(name, size = 24, sw = 1.5) {
  return readFileSync(`${ROOT}node_modules/lucide-static/icons/${name}.svg`, 'utf8')
    .replace(/<!--.*?-->/gs, '')
    .replace(/\s*class="[^"]*"/, '')
    .replace('width="24"', `width="${size}"`)
    .replace('height="24"', `height="${size}"`)
    .replace('stroke-width="2"', `stroke-width="${sw}"`);
}

const T = {
  it: {
    heroTitle: 'Arriva a Leonida<br>senza spoiler',
    heroSub: 'Sfoca gli spoiler di GTA VI su YouTube, Reddit, X, Google e su qualsiasi sito.',
    chips: [['mouse-pointer-click', 'Un click per vedere'], ['brain', 'AI sul tuo computer'], ['shield-check', 'Gratis, nessun dato']],
    feedTitle: 'Titoli e miniature<br>sfocati',
    feedSub: 'Gli spoiler spariscono dal feed. Le notizie innocue restano visibili.',
    label: 'Possibile spoiler GTA VI · clicca per vedere',
    levelsTitle: 'Tre livelli<br>di protezione',
    levelsSub: 'Scegli quanto vuoi sapere. Cambi livello quando vuoi, anche dopo aver finito la storia.',
    levels: [
      ['eye', 'Leggero', 'Solo spoiler evidenti: finale, morti, colpi di scena, leak.'],
      ['brain', 'Medio', 'Più i casi dubbi, controllati dall’AI integrata in Chrome.'],
      ['lock', 'Paranoico', 'Tutto ciò che parla di GTA VI. Anche le notizie.'],
    ],
    updTitle: 'Si aggiorna<br>da solo',
    updSub: 'Dopo l’uscita i nuovi personaggi e le missioni vengono riconosciuti automaticamente.',
    upd: [
      ['refresh-cw', 'Ogni 6 ore', 'Nomi nuovi dalla wiki, senza aggiornare l’estensione'],
      ['cpu', 'AI locale', 'Gemini Nano gira sul tuo computer'],
      ['eye-off', 'Lista cifrata', 'I nomi viaggiano come impronte: niente spoiler nei file'],
      ['shield-check', 'Zero dati', 'Niente account, tracciamento o pubblicità'],
    ],
    promo: 'Sfoca gli spoiler di GTA VI',
  },
  en: {
    heroTitle: 'Reach Leonida<br>spoiler-free',
    heroSub: 'Blurs GTA VI spoilers on YouTube, Reddit, X, Google and any other site.',
    chips: [['mouse-pointer-click', 'Click to reveal'], ['brain', 'On-device AI'], ['shield-check', 'Free, no data']],
    feedTitle: 'Titles and thumbnails<br>blurred',
    feedSub: 'Spoilers vanish from your feed. Harmless news stays visible.',
    label: 'Possible GTA VI spoiler · click to show',
    levelsTitle: 'Three levels<br>of protection',
    levelsSub: 'Choose how much you want to know. Switch any time, even after you finish the story.',
    levels: [
      ['eye', 'Light', 'Only obvious spoilers: endings, deaths, twists, leaks.'],
      ['brain', 'Smart', 'Plus doubtful cases, checked by Chrome’s built-in AI.'],
      ['lock', 'Paranoid', 'Everything about GTA VI. News included.'],
    ],
    updTitle: 'Updates<br>itself',
    updSub: 'After launch, new characters and missions are recognised automatically.',
    upd: [
      ['refresh-cw', 'Every 6 hours', 'New names from the wiki, no extension update needed'],
      ['cpu', 'Local AI', 'Gemini Nano runs on your computer'],
      ['eye-off', 'Encrypted list', 'Names travel as fingerprints: no spoilers in the files'],
      ['shield-check', 'Zero data', 'No accounts, tracking or ads'],
    ],
    promo: 'Blur GTA VI spoilers',
  },
};

// Video finti: miniature disegnate da noi, nessuna immagine del gioco
const FEED = [
  ['GTA 6 ending explained: what really happens to Jason', 'Leonida Insider · 412K views', true, '#f6b7c9,#6a9fb8'],
  ['GTA 6 review (no spoilers): the best open world ever', 'Pixel Weekly · 1.2M views', false, '#ffd4a8,#a17998'],
  ['Il finale di GTA VI mi ha distrutto', 'Gamer Napoletano · 88K views', true, '#a17998,#252640'],
  ['GTA 6 runs at 30 fps on PS5: full performance test', 'Frame Lab · 640K views', false, '#6a9fb8,#3e2f45'],
  ['Lucia Caminos and the Port Gellhorn job, explained', 'Vice Talk · 205K views', true, '#ffc2d0,#5a3f3c'],
];

const BASE = `
<style>
@font-face { font-family: 'NMS Condensed'; src: url('file://${ROOT}extension/fonts/BarlowCondensed-700.woff2'); font-weight: 700; }
@font-face { font-family: 'NMS Condensed'; src: url('file://${ROOT}extension/fonts/BarlowCondensed-600.woff2'); font-weight: 600; }
@font-face { font-family: 'NMS Text'; src: url('file://${ROOT}extension/fonts/Barlow-400.woff2'); font-weight: 400; }
@font-face { font-family: 'NMS Text'; src: url('file://${ROOT}extension/fonts/Barlow-500.woff2'); font-weight: 500; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body {
  position: relative; overflow: hidden; color: #fff;
  font: 400 20px/1.45 'NMS Text', sans-serif;
  background:
    repeating-linear-gradient(0deg, rgba(255,255,255,.025) 0 1px, transparent 1px 3px),
    radial-gradient(70% 45% at 85% 100%, rgba(214,120,90,.4), transparent 70%),
    radial-gradient(60% 50% at 10% 0%, rgba(161,121,152,.35), transparent 70%),
    linear-gradient(180deg, #121a30 0%, #252640 30%, #3e2f45 62%, #5a3f3c 100%);
}
.hud { position: absolute; top: 28px; left: 0; display: grid; gap: 5px; }
.hud i { display: block; height: 8px; }
.hud i:first-child { width: 120px; background: #ffc2d0; }
.hud i:last-child { width: 8px; background: #4fd6c4; }
h1 { margin: 0; font: 700 76px/.95 'NMS Condensed', sans-serif; text-transform: uppercase; letter-spacing: .005em; }
.sub { margin: 20px 0 0; color: rgba(255,255,255,.72); font-size: 22px; max-width: 470px; }
.brand { display: flex; align-items: center; gap: 12px; margin-bottom: 28px;
  font: 700 22px/1 'NMS Condensed', sans-serif; letter-spacing: .06em; text-transform: uppercase; color: rgba(255,255,255,.8); }
.brand img { width: 40px; height: 40px; outline: 2px solid #fff; outline-offset: -2px; }
.chips { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 34px; }
.chip { display: flex; align-items: center; gap: 8px; padding: 10px 16px 9px; background: rgba(16,16,24,.72);
  font: 700 19px/1 'NMS Condensed', sans-serif; text-transform: uppercase; letter-spacing: .02em; }
.chip svg { color: #ffc2d0; }
.tile { border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.08); backdrop-filter: blur(8px); }
.tile.on { border: 0; outline: 4px solid #fff; outline-offset: -4px; color: #141414;
  background: radial-gradient(90% 38% at 50% 0%, rgba(255,140,185,.85), transparent 100%), linear-gradient(180deg, #f3eef1, #d9d4d8); }
.cond { font-family: 'NMS Condensed', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; }
</style>
<link rel="stylesheet" href="file://${ROOT}extension/src/content.css">
<div class="hud"><i></i><i></i></div>`;

const brand = `<div class="brand"><img src="file://${ROOT}extension/icons/icon-128.png">No Miami Spoiler</div>`;

function hero(t, lang, w = 1280, h = 800) {
  return `${BASE}<style>
    body { width: ${w}px; height: ${h}px; }
    .wrap { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 40px; height: 100%; padding: 0 90px 0 96px; }
    .shot { width: 400px; box-shadow: 0 30px 80px rgba(0,0,0,.5); outline: 1px solid rgba(255,255,255,.2); }
  </style>
  <div class="wrap"><div>${brand}<h1>${t.heroTitle}</h1><p class="sub">${t.heroSub}</p>
    <div class="chips">${t.chips.map(([i, s]) => `<span class="chip">${icon(i, 20, 2)}${s}</span>`).join('')}</div></div>
    <img class="shot" src="file://${ROOT}store/screens/popup-${lang}.png"></div>`;
}

function feed(t) {
  const cards = FEED.map(([title, meta, blocked, g]) => {
    const thumb = `<div class="thumb" style="background: linear-gradient(135deg, ${g})">${icon('play', 34, 1.5)}</div>`;
    const body = `<div class="meta"><b>${title}</b><span>${meta}</span></div>`;
    return blocked
      ? `<div class="card nms-blocked nms-rel" data-nms-label="${t.label}">${thumb}${body}</div>`
      : `<div class="card">${thumb}${body}</div>`;
  }).join('');
  return `${BASE}<style>
    body { width: 1280px; height: 800px; }
    .wrap { display: grid; grid-template-columns: 420px 1fr; gap: 56px; align-items: center; height: 100%; padding: 0 70px 0 96px; }
    .browser { background: #fafafa; color: #111; box-shadow: 0 30px 80px rgba(0,0,0,.5); }
    .bar { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: #e8e6ea; }
    .bar i { width: 12px; height: 12px; border-radius: 50%; background: #c9c5cc; }
    .bar span { flex: 1; margin-left: 12px; padding: 6px 14px; border-radius: 99px; background: #fff; color: #666; font-size: 14px; }
    .list { display: grid; gap: 14px; padding: 18px; }
    .card { display: flex; gap: 16px; align-items: center; min-height: 0; }
    .thumb { flex: none; display: grid; place-items: center; width: 184px; height: 103px; color: rgba(255,255,255,.9); }
    .meta b { display: block; font: 500 19px/1.25 'NMS Text', sans-serif; }
    .meta span { color: #666; font-size: 15px; }
    .card.nms-blocked::after { font-size: 16px !important; padding: 9px 18px 8px 38px !important; background-position: 14px center, 0 0, 0 0 !important; background-size: 16px 16px, auto, auto !important; }
  </style>
  <div class="wrap"><div>${brand}<h1>${t.feedTitle}</h1><p class="sub">${t.feedSub}</p></div>
    <div class="browser"><div class="bar"><i></i><i></i><i></i><span>videotube.example/results?q=gta+6</span></div>
    <div class="list">${cards}</div></div></div>`;
}

function levels(t) {
  const tiles = t.levels.map(([i, name, desc], n) => `
    <div class="tile lv ${n === 1 ? 'on' : ''}">${icon(i, 46, 1.5)}<b class="cond">${name}</b><span>${desc}</span></div>`).join('');
  return `${BASE}<style>
    body { width: 1280px; height: 800px; }
    .wrap { padding: 110px 96px 0; }
    .row { display: flex; align-items: flex-end; justify-content: space-between; gap: 40px; }
    .sub { max-width: 520px; margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 60px; }
    .lv { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; height: 330px; padding: 30px; text-align: center; }
    .lv b { font-size: 44px; line-height: 1; margin-top: 8px; }
    .lv span { color: rgba(255,255,255,.72); font-size: 20px; }
    .lv.on span { color: rgba(20,20,20,.7); }
  </style>
  <div class="wrap"><div class="row"><div>${brand}<h1>${t.levelsTitle}</h1></div><p class="sub">${t.levelsSub}</p></div>
    <div class="grid">${tiles}</div></div>`;
}

function updates(t) {
  const tiles = t.upd.map(([i, name, desc], n) => `
    <div class="tile up ${n === 0 ? 'on' : ''}">${icon(i, 40, 1.5)}<b class="cond">${name}</b><span>${desc}</span></div>`).join('');
  return `${BASE}<style>
    body { width: 1280px; height: 800px; }
    .wrap { display: grid; grid-template-columns: 430px 1fr; gap: 60px; align-items: center; height: 100%; padding: 0 96px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .up { display: flex; flex-direction: column; justify-content: center; gap: 8px; height: 250px; padding: 28px; }
    .up b { font-size: 36px; line-height: 1; margin-top: 6px; }
    .up span { color: rgba(255,255,255,.72); font-size: 18px; }
    .up.on span { color: rgba(20,20,20,.7); }
    .up:not(.on) svg { color: #4fd6c4; }
  </style>
  <div class="wrap"><div>${brand}<h1>${t.updTitle}</h1><p class="sub">${t.updSub}</p></div><div class="grid">${tiles}</div></div>`;
}

function promo(t, w, h) {
  const big = w > 1000;
  return `${BASE}<style>
    body { width: ${w}px; height: ${h}px; }
    .hud { top: ${big ? 28 : 14}px; }
    .wrap { display: flex; align-items: center; gap: ${big ? 48 : 22}px; height: 100%; padding: 0 ${big ? 110 : 34}px; }
    .wrap img { width: ${big ? 220 : 120}px; height: ${big ? 220 : 120}px; outline: ${big ? 5 : 3}px solid #fff; outline-offset: -${big ? 5 : 3}px; }
    h1 { font-size: ${big ? 96 : 46}px; }
    .sub { margin-top: ${big ? 14 : 8}px; font: 700 ${big ? 34 : 20}px/1.1 'NMS Condensed', sans-serif; letter-spacing: .03em; text-transform: uppercase; color: #ffc2d0; }
  </style>
  <div class="wrap"><img src="file://${ROOT}store/icon-512.png"><div><h1>No Miami<br>Spoiler</h1><p class="sub">${t.promo}</p></div></div>`;
}

const browser = await chromium.launch();
const page = await browser.newPage();
async function shot(html, file, w, h) {
  writeFileSync(`${OUT}/_tmp.html`, `<!doctype html><meta charset="utf-8">${html}`);
  await page.setViewportSize({ width: w, height: h });
  await page.goto(`file://${OUT}/_tmp.html`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/${file}`, type: 'png' });
}
for (const lang of ['it', 'en']) {
  const t = T[lang];
  await shot(hero(t, lang), `${lang}-1-hero.png`, 1280, 800);
  await shot(feed(t), `${lang}-2-feed.png`, 1280, 800);
  await shot(levels(t), `${lang}-3-levels.png`, 1280, 800);
  await shot(updates(t), `${lang}-4-updates.png`, 1280, 800);
  await shot(promo(t, 440, 280), `${lang}-promo-440x280.png`, 440, 280);
  await shot(promo(t, 1400, 560), `${lang}-marquee-1400x560.png`, 1400, 560);
}
await browser.close();
console.log(`Immagini in ${OUT}`);
