# No Miami Spoiler

Estensione per Chrome e Firefox che sfoca gli spoiler di GTA VI su YouTube, Reddit, X, Google e qualsiasi sito.

- Tre livelli: Leggero, Medio (con l'AI integrata in Chrome che gira in locale), Paranoico
- Un click sul bollino mostra il contenuto
- Nomi di personaggi e luoghi studiati dalla GTA Wiki ogni 6 ore e distribuiti **solo come impronte**, così la lista non spoilera nessuno
- Nessun dato raccolto: [privacy policy](https://vecienzg.github.io/nomiamispoiler/privacy.html)

## Sviluppo

```bash
npm install
npm test        # rilevatore
npm run e2e     # Chromium vero con l'estensione caricata
npm run wiki    # ristudia la wiki
npm run pack    # zip per Chrome e Firefox in dist/
```

Per provarla: `chrome://extensions` → Modalità sviluppatore → Carica estensione non pacchettizzata → cartella `extension/`.

Progetto non commerciale. Non affiliato a Rockstar Games o Take-Two Interactive. Nomi studiati da [GTA Wiki](https://gta.fandom.com) (CC BY-SA). Font Barlow (SIL OFL), icone [Lucide](https://lucide.dev) (ISC).
