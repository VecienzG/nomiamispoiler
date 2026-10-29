const $ = (id) => document.getElementById(id);
const msg = (key, subs) => chrome.i18n.getMessage(key, subs) || key;

const AI_OPTIONS = {
  expectedInputs: [{ type: 'text', languages: ['en', 'es'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};
const LEVEL_HINTS = { leggero: 'levelLightHint', medio: 'levelMediumHint', paranoico: 'levelParanoidHint' };

let settings;
let host = null;
let aiState = 'unsupported';

function translate() {
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = msg(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-placeholder]')) {
    el.placeholder = msg(el.dataset.i18nPlaceholder);
  }
  for (const el of document.querySelectorAll('[data-i18n-label]')) {
    el.setAttribute('aria-label', msg(el.dataset.i18nLabel));
  }
}

function renderCountdown() {
  const days = Math.ceil((new Date(NMS_RELEASE) - Date.now()) / 86400000);
  $('countdown').textContent =
    days > 1 ? msg('countdownDays', [String(days)]) : days === 1 ? msg('countdownTomorrow') : msg('countdownOut');
}

const aiUsable = () => aiState !== 'unsupported' && aiState !== 'unavailable';

function render() {
  $('tileEnabled').setAttribute('aria-pressed', String(settings.enabled));
  $('enabledState').textContent = msg(settings.enabled ? 'stateOn' : 'stateOff');

  for (const b of document.querySelectorAll('[data-level]')) {
    b.setAttribute('aria-checked', String(b.dataset.level === settings.level));
  }
  $('levelHint').textContent = msg(LEVEL_HINTS[settings.level]);

  $('tileAi').disabled = !aiUsable();
  $('tileAi').setAttribute('aria-pressed', String(aiUsable() && settings.ai));
  $('aiState').textContent = msg(`aiState_${aiState}`);
  $('aiHint').textContent = msg(`aiHint_${aiState}`);
  $('aiDownload').hidden = !(aiState === 'downloadable' || aiState === 'downloading');

  $('tilePause').disabled = !host;
  $('tilePause').setAttribute('aria-pressed', String(!!host && settings.pausedSites.includes(host)));
  $('host').textContent = host || msg('stateNoSite');

  $('custom').value = settings.customWords.join(', ');
}

function save(patch) {
  Object.assign(settings, patch);
  render();
  return chrome.storage.sync.set(patch);
}

// ---- AI ----

async function checkAI() {
  if (!('LanguageModel' in self)) aiState = 'unsupported';
  else {
    try {
      aiState = await LanguageModel.availability(AI_OPTIONS);
    } catch {
      aiState = 'unavailable';
    }
  }
  render();
}

async function downloadAI() {
  const btn = $('aiDownload');
  btn.disabled = true;
  aiState = 'downloading';
  render();
  try {
    const s = await LanguageModel.create({
      ...AI_OPTIONS,
      monitor(m) {
        m.addEventListener('downloadprogress', (e) => {
          btn.textContent = `${msg('aiDownloading')} ${Math.round(e.loaded * 100)}%`;
        });
      },
    });
    s.destroy();
    aiState = 'available';
    // Le pagine aperte ricevono il cambio e attivano l'AI
    await save({ ai: true, _aiReady: Date.now() });
  } catch {
    aiState = 'unavailable';
    render();
  } finally {
    btn.disabled = false;
    btn.textContent = msg('aiDownload');
  }
}

// ---- Avvio ----

async function init() {
  translate();
  renderCountdown();
  settings = await chrome.storage.sync.get(NMS_DEFAULTS);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    const url = new URL(tab?.url || '');
    if (url.protocol.startsWith('http')) host = url.hostname;
  } catch {}

  const { total = 0 } = await chrome.storage.local.get('total');
  $('total').textContent = total.toLocaleString();

  render();
  checkAI();

  $('tileEnabled').addEventListener('click', () => save({ enabled: !settings.enabled }));
  $('tileAi').addEventListener('click', () => save({ ai: !settings.ai }));
  $('tilePause').addEventListener('click', () => {
    const sites = settings.pausedSites.filter((s) => s !== host);
    if (!settings.pausedSites.includes(host)) sites.push(host);
    save({ pausedSites: sites });
  });
  for (const b of document.querySelectorAll('[data-level]')) {
    b.addEventListener('click', () => save({ level: b.dataset.level }));
  }
  $('custom').addEventListener('change', (e) => {
    const words = e.target.value.split(/[,\n]/).map((w) => w.trim()).filter(Boolean);
    save({ customWords: [...new Set(words)] });
  });
  $('aiDownload').addEventListener('click', downloadAI);
}

init();
