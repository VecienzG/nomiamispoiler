// Il "cervello" a parole chiave. Puro: nessun DOM, testabile con node.
(function (root) {
  // "no spoiler", "senza spoiler", "spoiler-free"... non sono spoiler
  const NEGATIONS =
    /(?<![\p{L}\p{N}])(?:no|senza|zero|niente|sin|without|non)[\s\-]+spoilers?(?![\p{L}\p{N}])|(?<![\p{L}\p{N}])spoilers?[\s\-]*free(?![\p{L}\p{N}])/giu;

  const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function termRegex(terms) {
    const clean = [...new Set(terms.map((t) => t.trim().toLowerCase()).filter(Boolean))];
    if (!clean.length) return null;
    // I più lunghi prima: "rockstar games" vince su "rockstar"
    clean.sort((a, b) => b.length - a.length);
    const alt = clean.map((t) => escape(t).replace(/\s+/g, '[\\s\\-_]*')).join('|');
    return new RegExp(`(?<![\\p{L}\\p{N}])(?:${alt})(?![\\p{L}\\p{N}])`, 'giu');
  }

  function hits(re, text) {
    const found = new Set();
    if (!re) return found;
    for (const m of text.matchAll(re)) found.add(m[0].replace(/[\s\-_]+/g, ' '));
    return found;
  }

  // wiki: impronte studiate dalla GTA Wiki ({ maxWords, w: [...], k: [...], p: [...] })
  //   w = nome specifico (vale 2) · k = nome singolo (vale 1) · p = trama (è già uno spoiler)
  function createDetector(lists, customWords = [], wiki = null) {
    const H = root.NMS_hash;
    const wikiMap = new Map();
    for (const tier of ['k', 'w', 'p']) for (const h of wiki?.[tier] ?? []) wikiMap.set(h, tier);
    const maxWords = wiki?.maxWords ?? 0;

    // Scorre il testo a finestre di 1..maxWords parole e cerca le impronte
    function wikiHits(text) {
      const out = { w: new Set(), k: new Set(), p: new Set() };
      if (!wikiMap.size || !H) return out;
      const t = H.tokens(text);
      for (let i = 0; i < t.length; i++) {
        let key = '';
        for (let n = 0; n < maxWords && i + n < t.length; n++) {
          key = n ? `${key} ${t[i + n]}` : t[i];
          const h = H.cyrb53(key);
          const tier = wikiMap.get(h);
          if (tier) out[tier].add(h);
        }
      }
      return out;
    }

    const strongRe = termRegex(lists.strong);
    const worldRe = termRegex(lists.world);
    const weakRe = termRegex(Object.keys(lists.weak));
    const spoilerRe = termRegex(lists.spoiler);
    const customRe = termRegex(customWords);
    const hintRe = termRegex([
      ...lists.strong, ...lists.world, ...Object.keys(lists.weak), ...customWords,
    ]);

    // Filtro velocissimo: c'è almeno un indizio?
    function hint(text) {
      if (!text) return false;
      if (hintRe) {
        hintRe.lastIndex = 0;
        if (hintRe.test(text)) return true;
      }
      const w = wikiHits(text);
      return w.w.size + w.k.size + w.p.size > 0;
    }

    // level: leggero | medio | paranoico. aiAvailable: c'è l'AI per i casi dubbi?
    function analyze(rawText, level, aiAvailable) {
      const text = (rawText || '').toLowerCase().normalize('NFC');
      if (hits(customRe, text).size) return { block: true, reason: 'custom' };

      const strong = hits(strongRe, text);
      const world = hits(worldRe, text);
      const wiki = wikiHits(text);
      let score = strong.size * 3 + (world.size + wiki.w.size + wiki.p.size) * 2 + wiki.k.size;
      for (const w of hits(weakRe, text)) score += lists.weak[w] || 1;
      if (score < 3) return { block: false };

      if (level === 'paranoico') return { block: true, reason: 'gta' };

      const spoiler = hits(spoilerRe, text.replace(NEGATIONS, ' '));
      if (spoiler.size || wiki.p.size) return { block: true, reason: 'spoiler' };
      if (level === 'leggero') return { block: false };

      // medio: si parla di GTA VI ma senza parole "da spoiler" → decide l'AI
      if (aiAvailable) return { block: true, reason: 'ai', needsAI: true };
      if (world.size || wiki.w.size || wiki.k.size) return { block: true, reason: 'story' };
      return { block: false };
    }

    return { hint, analyze };
  }

  root.NMS_createDetector = createDetector;
})(globalThis);
