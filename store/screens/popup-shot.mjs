// Foto del popup vero (estensione caricata) a doppia risoluzione, in IT e EN
import { chromium } from 'playwright';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ROOT = new URL('../../', import.meta.url).pathname;
const ext = `${ROOT}extension`;
for (const lang of ['it', 'en']) {
  const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'nmsp-')), {
    channel: 'chromium',
    deviceScaleFactor: 2,
    args: [`--lang=${lang}`, `--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  const [sw] = ctx.serviceWorkers().length ? ctx.serviceWorkers() : [await ctx.waitForEvent('serviceworker')];
  await sw.evaluate(async () => {
    await chrome.storage.sync.set({ enabled: true, level: 'medio', ai: true });
    await chrome.storage.local.set({ total: 37 });
  });
  // Solo per le foto: testi nella lingua giusta e AI disponibile come su un PC compatibile
  const messages = JSON.parse(readFileSync(`${ext}/_locales/${lang}/messages.json`, 'utf8'));
  await ctx.addInitScript((m) => {
    self.LanguageModel = { availability: async () => 'available' };
    const get = (k, subs) => {
      const e = m[k];
      if (!e) return '';
      let out = e.message;
      for (const [name, ph] of Object.entries(e.placeholders || {})) {
        const i = Number(ph.content.slice(1)) - 1;
        out = out.replaceAll(`$${name.toUpperCase()}$`, [].concat(subs ?? [])[i] ?? '');
      }
      return out;
    };
    Object.defineProperty(chrome.i18n, 'getMessage', { value: get });
  }, messages);
  const page = await ctx.newPage();
  await page.setViewportSize({ width: 340, height: 460 });
  await page.goto(`chrome-extension://${new URL(sw.url()).host}/popup/popup.html`);
  await page.waitForTimeout(600);
  const h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: 340, height: h });
  await page.screenshot({ path: `${ROOT}store/screens/popup-${lang}.png` });
  await ctx.close();
}
console.log('popup ok');
