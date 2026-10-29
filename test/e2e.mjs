// Prova reale: Chromium con l'estensione caricata sulla pagina demo. node test/e2e.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';

for (const f of ['hash.js', 'wiki-data.js']) {
  vm.runInThisContext(readFileSync(new URL(`../extension/src/${f}`, import.meta.url), 'utf8'));
}

const ext = new URL('../extension', import.meta.url).pathname;
const demo = readFileSync(new URL('./demo.html', import.meta.url));
const server = createServer((_, res) => res.end(demo)).listen(0);
const url = `http://localhost:${server.address().port}/`;

const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'nms-')), {
  channel: 'chromium',
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});

try {
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForTimeout(1800);

  const blocked = async () =>
    page.$$eval('.nms-blocked', (els) => els.map((e) => e.id || e.tagName.toLowerCase()).sort());

  const before = await blocked();
  console.log('Livello medio, coperti:', before);
  for (const id of ['n1', 'n3', 'n6', 'n7', 'n9']) assert.ok(before.includes(id), `${id} doveva essere coperto`);
  for (const id of ['n2', 'n4', 'n5', 'n8']) assert.ok(!before.includes(id), `${id} non doveva essere coperto`);

  await page.screenshot({ path: new URL('./e2e.png', import.meta.url).pathname, fullPage: true });

  // Il click scopre e NON apre il link
  await page.click('#n7');
  await page.waitForTimeout(200);
  assert.equal(page.url(), url, 'il click non deve navigare');
  assert.ok(!(await blocked()).includes('n7'), 'n7 dopo il click deve essere visibile');

  const [sw] = ctx.serviceWorkers().length ? ctx.serviceWorkers() : [await ctx.waitForEvent('serviceworker')];
  // Lista wiki aggiornata "da internet": un personaggio nuovo fa coprire un testo prima innocuo
  await page.evaluate(() => {
    const p = document.createElement('p');
    p.id = 'n10';
    p.textContent = 'Zorblax Quintana saluta Ekanfinaka';
    document.body.append(p);
  });
  await page.waitForTimeout(500);
  assert.ok(!(await blocked()).includes('n10'), 'n10 senza lista nuova resta visibile');
  const base = globalThis.NMS_WIKI;
  const fresh = { ...base, generated: '2099-01-01T00:00:00Z', w: [...base.w, globalThis.NMS_hash.termHash('Zorblax Quintana')] };
  await sw.evaluate((wiki) => chrome.storage.local.set({ wiki }), fresh);
  await page.waitForTimeout(800);
  assert.ok((await blocked()).includes('n10'), 'n10 con la lista nuova va coperto');
  console.log('Aggiornamento lista: ok');

  // Paranoico: si copre anche la notizia innocua su GTA 6
  await sw.evaluate(() => chrome.storage.sync.set({ level: 'paranoico' }));
  await page.waitForTimeout(800);
  const paranoid = await blocked();
  console.log('Livello paranoico, coperti:', paranoid);
  for (const id of ['n2', 'n4']) assert.ok(paranoid.includes(id), `${id} in paranoico`);
  assert.ok(!paranoid.includes('n5'), 'la pasta e patate resta visibile');

  // Spenta: niente coperto
  await sw.evaluate(() => chrome.storage.sync.set({ enabled: false }));
  await page.waitForTimeout(500);
  assert.equal((await blocked()).length, 0, 'spenta = niente coperto');

  // Foto del popup (protezione accesa)
  await sw.evaluate(() => chrome.storage.sync.set({ enabled: true, level: 'medio' }));
  const id = new URL(sw.url()).host;
  const popup = await ctx.newPage();
  await popup.setViewportSize({ width: 340, height: 600 });
  await popup.goto(`chrome-extension://${id}/popup/popup.html`);
  await popup.waitForTimeout(500);
  await popup.screenshot({ path: new URL('./popup.png', import.meta.url).pathname, fullPage: true });

  console.log('✅ e2e ok');
} finally {
  await ctx.close();
  server.close();
}
