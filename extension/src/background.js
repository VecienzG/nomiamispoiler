// Centralino: contatore sull'icona, statistiche e ponte verso l'AI (pagina offscreen).
// Chrome lo carica come service worker; Firefox come script insieme a shared.js.
if (typeof importScripts === 'function' && typeof NMS_DEFAULTS === 'undefined') {
  importScripts('/src/shared.js');
}

chrome.runtime.onInstalled.addListener(async () => {
  const current = await chrome.storage.sync.get(NMS_DEFAULTS);
  await chrome.storage.sync.set(current);
  setupWikiUpdates();
});

chrome.runtime.onStartup.addListener(setupWikiUpdates);

// ---- Lista wiki online ----

const WIKI_ALARM = 'nms-wiki';

function setupWikiUpdates() {
  chrome.alarms.create(WIKI_ALARM, { delayInMinutes: 1, periodInMinutes: 360 });
  refreshWiki();
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === WIKI_ALARM) refreshWiki();
});

// Solo impronte: si accetta il file solo se ha esattamente la forma attesa
function validWiki(d) {
  return (
    d?.v === 1 &&
    typeof d.generated === 'string' &&
    Number.isInteger(d.maxWords) &&
    d.maxWords >= 1 &&
    d.maxWords <= 8 &&
    ['w', 'k', 'p'].every(
      (t) => Array.isArray(d[t]) && d[t].length < 50000 && d[t].every((h) => /^[0-9a-z]{1,12}$/.test(h)),
    )
  );
}

async function refreshWiki() {
  try {
    const res = await fetch(NMS_WIKI_URL, { cache: 'no-cache' });
    if (!res.ok) return;
    const d = await res.json();
    if (!validWiki(d)) return;
    const { wiki } = await chrome.storage.local.get('wiki');
    if (wiki && wiki.generated >= d.generated) return;
    const { v, generated, maxWords, w, k, p } = d;
    await chrome.storage.local.set({ wiki: { v, generated, maxWords, w, k, p } });
  } catch {}
}

// ---- AI (solo Chrome desktop: Gemini Nano integrato) ----

let creating = null;

async function ensureOffscreen() {
  if (!chrome.offscreen) return false;
  if (await chrome.offscreen.hasDocument()) return true;
  creating ??= chrome.offscreen
    .createDocument({
      url: 'src/offscreen.html',
      reasons: ['DOM_PARSER'],
      justification: 'Runs the on-device Chrome AI model to tell spoilers apart from normal text.',
    })
    .catch(() => {})
    .finally(() => {
      creating = null;
    });
  await creating;
  return chrome.offscreen.hasDocument();
}

async function toOffscreen(message) {
  try {
    if (!(await ensureOffscreen())) return { available: false };
    return (await chrome.runtime.sendMessage(message)) ?? { available: false };
  } catch {
    return { available: false };
  }
}

// ---- Statistiche ----

let pendingAdded = 0;
let statsTimer = null;

function addToStats(n) {
  pendingAdded += n;
  clearTimeout(statsTimer);
  statsTimer = setTimeout(async () => {
    const { total = 0 } = await chrome.storage.local.get('total');
    await chrome.storage.local.set({ total: total + pendingAdded });
    pendingAdded = 0;
  }, 2000);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg?.type) {
    case 'nms-count': {
      const tabId = sender.tab?.id;
      if (tabId != null) {
        chrome.action.setBadgeBackgroundColor({ tabId, color: '#ffc2d0' });
        chrome.action.setBadgeText({ tabId, text: msg.count ? String(msg.count) : '' });
      }
      if (msg.added) addToStats(msg.added);
      return false;
    }
    case 'nms-ai-status':
      toOffscreen({ type: 'nms-off-status' }).then(sendResponse);
      return true;
    case 'nms-classify':
      toOffscreen({ type: 'nms-off-classify', text: msg.text }).then(sendResponse);
      return true;
    default:
      return false;
  }
});
