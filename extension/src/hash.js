// Impronte delle parole: la lista studiata dalla wiki viaggia solo così, mai leggibile.
// Stessa funzione nell'estensione e in scripts/wiki-sync.mjs.
(function (root) {
  // cyrb53: hash a 53 bit, veloce e senza collisioni pratiche per qualche migliaio di nomi
  function cyrb53(str, seed = 19) {
    let h1 = 0xdeadbeef ^ seed;
    let h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  // "Dre’Quan Priest" e "dre'quan  priest" diventano la stessa cosa
  function tokens(text) {
    const words = (text || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .replace(/[’‘`´]/g, "'")
      .match(/[\p{L}\p{N}']+/gu);
    return (words || []).map((w) => w.replace(/^'+|'+$/g, '')).filter(Boolean);
  }

  const termHash = (term) => cyrb53(tokens(term).join(' '));

  root.NMS_hash = { cyrb53, tokens, termHash };
})(globalThis);
