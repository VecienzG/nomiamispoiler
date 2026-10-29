// Impostazioni condivise da popup, background e content script
globalThis.NMS_DEFAULTS = {
  enabled: true,
  level: 'medio', // leggero | medio | paranoico
  ai: true,
  customWords: [],
  pausedSites: [],
};

globalThis.NMS_RELEASE = '2026-11-19T00:00:00';

// Lista wiki aggiornata ogni 6 ore da GitHub Actions (solo impronte, nessun dato inviato)
globalThis.NMS_WIKI_URL = 'https://vecienzg.github.io/nomiamispoiler/wiki.json';

// La lista più recente tra quella inclusa nell'estensione e quella scaricata
globalThis.NMS_pickWiki = (stored) =>
  stored && (!globalThis.NMS_WIKI || stored.generated > globalThis.NMS_WIKI.generated)
    ? stored
    : globalThis.NMS_WIKI ?? null;
