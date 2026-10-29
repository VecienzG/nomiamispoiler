# No Miami Spoiler

Estensione browser che sfoca gli spoiler di GTA VI (uscita **19/11/2026**). Progetto Beautiful Dev.

## Regole
- La wiki si usa per **studio non commerciale**: solo titoli delle pagine (nomi), mai testi. Credito "Nomi studiati da GTA Wiki" nel popup e nello store.
- Mai "GTA" o loghi Rockstar nel **nome** o nell'icona. Nella descrizione sì, sempre con "Non affiliato a Rockstar Games".
- Le liste in `extension/src/keywords.js` contengono solo nomi pubblici (trailer/sito ufficiale), mai trama.
- Interfaccia in IT + EN (`extension/_locales`). Ogni testo nuovo va in entrambe.
- Palette ispirata allo store GTA VI (solo colori, mai logo/font/immagini): sfondo `#1e1728`, pannelli `#2a2036`/`#342442`, rosa `#ffc2d0`, pesca `#ffd4a8`, ambra `#ffad36`, lilla `#a17998`, cielo `#6a9fb8`. Pulsanti a pillola, selezione = pillola bianca con testo scuro.
- Stile "menu di gioco GTA VI" (dallo screenshot della ruota armi): tessere **quadrate** senza arrotondamenti, vetro smerigliato `rgba(255,255,255,.08)` con bordo `rgba(255,255,255,.14)`; elemento attivo = chiaro con **bordo bianco 3px** e bagliore rosa in alto; scheda attiva = bianca con taglio obliquo a destra (`clip-path`); bagliore acqua `#4fd6c4` sui numeri; barrette HUD rosa/acqua in alto a sinistra; sfondo = tramonto sfocato con righe di scansione.
- Font: **Barlow Condensed** 500/600/700 maiuscolo per titoli, schede ed etichette; **Barlow** 400/500 per i testi lunghi. Incorporati in `extension/fonts/` (OFL), mai caricati da Google. Il font vero di GTA VI è proprietario: non usarlo.
- Icone: solo Lucide (`node_modules/lucide-static/icons`, SVG inline o data-URI nel CSS). Mai emoji, né nell'interfaccia né nei testi `_locales`.
- Nessun server e nessun dato raccolto: è un argomento di vendita, non va rotto.

## Come è fatta
- `src/detector.js`: il cervello a parole chiave (puro, testato in `test/detector.test.mjs`)
- `src/content.js` + `content.css`: trova i blocchi nella pagina, li sfoca e li scopre al click
- `src/background.js`: contatore sull'icona, statistiche, ponte verso l'AI
- `src/offscreen.js`: AI di Chrome (Gemini Nano, Prompt API) per i casi dubbi del livello Medio. Solo Chrome desktop.
- `src/hash.js` + `src/wiki-data.js`: nomi studiati dalla GTA Wiki, salvati **solo come impronte** (hash cyrb53), così l'estensione non spoilera chi apre i suoi file. Livelli: `w` nome specifico (vale 2) · `k` nome singolo inventato (vale 1) · `p` trama (missioni, trofei, personaggi comparsi dopo il 19/11 → è già spoiler)
- `scripts/wiki-sync.mjs`: legge le categorie di `Category:GTA VI` dall'API Fandom (con calma, 350 ms tra le richieste), scarta luoghi reali, "Unnamed…", sigle corte e nomi singoli che esistono nel dizionario. Versione leggibile per controllo in `data/wiki-terms.local.json` (fuori da git). `scripts/baseline-people.json` = personaggi noti prima dell'uscita.
- `popup/`: impostazioni (livello, AI, pausa per sito, parole extra, countdown)
- Livelli: leggero = solo parole da spoiler · medio = + AI sui casi dubbi · paranoico = tutto ciò che parla di GTA VI

## Comandi
- `npm test`: test del rilevatore
- `npm run e2e`: Chromium vero con l'estensione sulla pagina `test/demo.html` + foto in `test/*.png`
- `npm run pack`: zip per Chrome e Firefox in `dist/`
- `npm run wiki`: ristudia la wiki e rigenera `src/wiki-data.js` (poi `npm test`)
- `npm run icons`: rigenera le icone

## Roadmap
1. **Estensione Chrome + Firefox**: invio agli store entro il 10/11 ← ADESSO
2. Bot Telegram + Discord per i gruppi di amici (ripubblica il messaggio come spoiler nascosto): entro il 17/11
3. Lista wiki aggiornata da remoto ogni 6 ore (GitHub Action + Pages) dopo il 19/11 + "sono arrivato al capitolo X"
4. App Android che filtra le notifiche di WhatsApp & co. (iPhone non lo permette). Play Store: un account nuovo richiede 14 giorni di test con 12 tester.

## Da verificare
- L'AI (Gemini Nano) non è ancora stata provata su un PC compatibile: nei test automatici risulta "non supportata".
- Il bollino non si vede sugli Shorts di YouTube (la card è sfocata ma il bollino no).
