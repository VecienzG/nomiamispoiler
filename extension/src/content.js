// Gira in ogni pagina: trova i blocchi che parlano di GTA VI e li sfoca.
(() => {
  // Contenitori "naturali" dei siti peggiori: si sfoca la card intera, miniatura compresa
  const SITE_SELECTOR = [
    // YouTube
    'ytd-rich-item-renderer', 'ytd-video-renderer', 'ytd-compact-video-renderer',
    'ytd-grid-video-renderer', 'ytd-reel-item-renderer', 'yt-lockup-view-model',
    'ytm-shorts-lockup-view-model', 'ytd-comment-view-model', 'ytd-comment-thread-renderer',
    'ytd-playlist-panel-video-renderer', 'ytd-notification-renderer', 'ytd-watch-metadata',
    // Reddit
    'shreddit-post', 'shreddit-comment',
    // X
    'article[data-testid="tweet"]',
    // Google
    'div.MjjYud', 'div.g', 'div.related-question-pair',
  ].join(',');
  const GENERIC_SELECTOR =
    'article,li,p,h1,h2,h3,h4,h5,h6,blockquote,figcaption,td,dd,dt,summary,a';
  const SKIP_SELECTOR =
    'script,style,noscript,textarea,input,select,head,[contenteditable=""],[contenteditable="true"]';

  const msg = (key) => chrome.i18n.getMessage(key) || key;
  const LABELS = {
    ai: msg('labelChecking'),
    spoiler: msg('labelSpoiler'),
    story: msg('labelSpoiler'),
    'spoiler-ai': msg('labelSpoiler'),
    gta: msg('labelGta'),
    custom: msg('labelCustom'),
  };

  let settings = null;
  let wiki = globalThis.NMS_WIKI ?? null;
  let detector = null;
  let active = false;
  let aiAvailable = false;
  let observer = null;
  const pending = new Set();
  let flushTimer = null;
  let countTimer = null;
  let newBlocks = 0;
  const aiCache = new Map();

  const hash = (s) => {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return `${s.length}:${h >>> 0}`;
  };

  function textOf(el) {
    let t = el.textContent || '';
    for (const a of ['aria-label', 'title', 'post-title']) {
      const v = el.getAttribute?.(a);
      if (v) t += ` ${v}`;
    }
    const labelled = el.querySelectorAll?.('[aria-label],[title],img[alt]') || [];
    for (let i = 0; i < labelled.length && i < 30; i++) {
      const n = labelled[i];
      t += ` ${n.getAttribute('aria-label') || ''} ${n.getAttribute('title') || ''} ${n.getAttribute('alt') || ''}`;
    }
    return t.replace(/\s+/g, ' ').slice(0, 4000);
  }

  function containerFor(node) {
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    if (!el || el.closest(SKIP_SELECTOR)) return null;
    let c = el.closest(SITE_SELECTOR) || el.closest(GENERIC_SELECTOR) || el;
    if (c === document.body || c === document.documentElement) c = el;
    if (c === document.body || c === document.documentElement) return null;
    return c;
  }

  // ---- Raccolta e valutazione ----

  function collect(node, out) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (detector.hint(node.data)) {
        const c = containerFor(node);
        if (c) out.add(c);
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.closest?.(SKIP_SELECTOR)) return;
    if (node.matches(SITE_SELECTOR)) out.add(node);
    for (const c of node.querySelectorAll(SITE_SELECTOR)) out.add(c);
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    for (let t = walker.nextNode(); t; t = walker.nextNode()) {
      if (detector.hint(t.data)) {
        const c = containerFor(t);
        if (c) out.add(c);
      }
    }
  }

  function evaluate(c) {
    if (!c.isConnected) return;
    const text = textOf(c);
    if (!detector.hint(text)) {
      if (c.classList.contains('nms-blocked')) unblock(c);
      return;
    }
    const sig = hash(text);
    if (c.dataset.nmsSig === sig) return;
    c.dataset.nmsSig = sig;
    if (c.dataset.nmsRevealed === sig) return;
    // Se un antenato è già coperto, inutile coprire due volte
    if (c.parentElement?.closest('.nms-blocked')) return;

    const r = detector.analyze(text, settings.level, aiAvailable && settings.ai);
    if (!r.block) return unblock(c);
    if (!r.needsAI) return block(c, r.reason);

    // Caso dubbio: coperto subito, poi decide l'AI
    block(c, 'ai');
    askAI(text, sig).then((isSpoiler) => {
      if (c.dataset.nmsSig !== sig || c.dataset.nmsRevealed === sig) return;
      if (isSpoiler === null) {
        const f = detector.analyze(text, settings.level, false);
        return f.block ? block(c, f.reason) : unblock(c);
      }
      return isSpoiler ? block(c, 'spoiler-ai') : unblock(c);
    });
  }

  function askAI(text, sig) {
    if (!aiCache.has(sig)) {
      if (aiCache.size > 500) aiCache.delete(aiCache.keys().next().value);
      aiCache.set(
        sig,
        chrome.runtime
          .sendMessage({ type: 'nms-classify', text: text.slice(0, 1500) })
          .then((r) => (r && r.available ? !!r.spoiler : null))
          .catch(() => null),
      );
    }
    return aiCache.get(sig);
  }

  // ---- Copri / scopri ----

  function block(c, reason) {
    const wasBlocked = c.classList.contains('nms-blocked');
    c.classList.add('nms-blocked');
    c.dataset.nmsReason = reason;
    c.dataset.nmsLabel = LABELS[reason] || LABELS.spoiler;
    // Gli elementi con shadow DOM (Reddit) si sfocano interi
    if (c.shadowRoot) c.classList.add('nms-whole');
    if (getComputedStyle(c).position === 'static') c.classList.add('nms-rel');
    if (c.matches('ytd-watch-metadata')) blockPlayer(true);
    if (!wasBlocked && reason !== 'ai') newBlocks++;
    scheduleCount();
  }

  function unblock(c) {
    if (!c.classList.contains('nms-blocked')) return;
    c.classList.remove('nms-blocked', 'nms-whole', 'nms-rel');
    delete c.dataset.nmsReason;
    delete c.dataset.nmsLabel;
    if (c.matches('ytd-watch-metadata')) blockPlayer(false);
    scheduleCount();
  }

  // Pagina video YouTube: se il titolo è uno spoiler, copri e metti in pausa anche il player
  function blockPlayer(on) {
    const player = document.querySelector('#movie_player');
    if (!player) return;
    if (on) {
      player.classList.add('nms-blocked', 'nms-whole', 'nms-player');
      player.dataset.nmsLabel = LABELS.spoiler;
      player.querySelector('video')?.pause();
    } else {
      player.classList.remove('nms-blocked', 'nms-whole', 'nms-player');
      delete player.dataset.nmsLabel;
    }
  }

  function reveal(c) {
    c.dataset.nmsRevealed = c.dataset.nmsSig || '';
    unblock(c);
    if (c.classList.contains('nms-player') || c.id === 'movie_player') {
      const meta = document.querySelector('ytd-watch-metadata.nms-blocked');
      if (meta) reveal(meta);
    }
  }

  function onClick(e) {
    if (!active) return;
    const c = e.composedPath().find((n) => n.classList?.contains('nms-blocked'));
    if (!c) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.type === 'click') reveal(c);
  }

  function onPlay(e) {
    if (active && e.target.closest?.('.nms-player')) e.target.pause();
  }

  // ---- Contatore sull'icona ----

  function scheduleCount() {
    clearTimeout(countTimer);
    countTimer = setTimeout(() => {
      const count = document.querySelectorAll('.nms-blocked:not([data-nms-reason="ai"])').length;
      chrome.runtime.sendMessage({ type: 'nms-count', count, added: newBlocks }).catch(() => {});
      newBlocks = 0;
    }, 600);
  }

  // ---- Ciclo di vita ----

  function queue(node) {
    pending.add(node);
    if (!flushTimer) flushTimer = setTimeout(flush, 120);
  }

  function flush() {
    flushTimer = null;
    if (!active) return pending.clear();
    const containers = new Set();
    for (const n of pending) collect(n, containers);
    pending.clear();
    for (const c of containers) evaluate(c);
  }

  function start() {
    active = true;
    detector = globalThis.NMS_createDetector(
      globalThis.NMS_KEYWORDS,
      settings.customWords,
      wiki,
    );
    observer = new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === 'characterData') queue(r.target);
        else if (r.type === 'attributes') queue(r.target);
        else for (const n of r.addedNodes) queue(n);
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['title', 'aria-label', 'post-title'],
    });
    if (document.body) queue(document.body);
    else document.addEventListener('DOMContentLoaded', () => queue(document.body), { once: true });
  }

  function stop() {
    active = false;
    observer?.disconnect();
    observer = null;
    for (const c of document.querySelectorAll('.nms-blocked')) unblock(c);
    for (const c of document.querySelectorAll('[data-nms-sig]')) delete c.dataset.nmsSig;
  }

  function shouldRun() {
    return settings.enabled && !settings.pausedSites.includes(location.hostname);
  }

  async function refreshAI() {
    aiAvailable = false;
    if (!settings.ai || settings.level !== 'medio') return;
    try {
      const r = await chrome.runtime.sendMessage({ type: 'nms-ai-status' });
      aiAvailable = !!r?.available;
    } catch {
      aiAvailable = false;
    }
  }

  async function boot() {
    settings = await chrome.storage.sync.get(globalThis.NMS_DEFAULTS);
    wiki = globalThis.NMS_pickWiki((await chrome.storage.local.get('wiki')).wiki);
    // Si parte subito con le parole chiave; l'AI si aggiunge appena risponde
    if (shouldRun()) start();
    await refreshAI();
    if (aiAvailable && active) {
      stop();
      start();
    }
  }

  // Font del bollino (lo stesso del popup). Se il sito lo blocca, resta il condensato di sistema.
  function loadFont() {
    try {
      const face = new FontFace(
        'NMS Condensed',
        `url(${chrome.runtime.getURL('fonts/BarlowCondensed-700.woff2')}) format('woff2')`,
        { weight: '700' },
      );
      face.load().then((f) => document.fonts.add(f), () => {});
    } catch {}
  }

  loadFont();
  window.addEventListener('click', onClick, true);
  window.addEventListener('auxclick', onClick, true);
  document.addEventListener('play', onPlay, true);

  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area === 'local' && changes.wiki) {
      wiki = globalThis.NMS_pickWiki(changes.wiki.newValue);
      if (active) {
        stop();
        start();
      }
      return;
    }
    if (area !== 'sync') return;
    for (const [k, v] of Object.entries(changes)) settings[k] = v.newValue;
    await refreshAI();
    stop();
    for (const c of document.querySelectorAll('[data-nms-revealed]')) delete c.dataset.nmsRevealed;
    if (shouldRun()) start();
    else scheduleCount();
  });

  boot();
})();
