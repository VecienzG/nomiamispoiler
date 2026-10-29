# Scheda store: da copiare e incollare

Pacchetto: `dist/no-miami-spoiler-chrome-0.1.0.zip` (Chrome) · `dist/no-miami-spoiler-firefox-0.1.0.zip` (Firefox)
Immagini: `store/out/`

---

## 1. Pacchetto → "Store listing" (Scheda dello store)

**Lingua predefinita:** English. Poi aggiungi **Italiano** dal menu lingua e incolla la versione IT.

**Categoria:** Tools (Strumenti)

**Icona dello store (128×128):** `extension/icons/icon-128.png`

**Screenshot (1280×800):** nell'ordine `1-hero`, `2-feed`, `3-levels`, `4-updates`. File `en-*` per l'inglese, `it-*` per l'italiano.

**Riquadro promozionale piccolo (440×280):** `en-promo-440x280.png` / `it-promo-440x280.png`
**Riquadro marquee (1400×560):** `en-marquee-1400x560.png` / `it-marquee-1400x560.png`

**Sito web ufficiale:** https://vecienzg.github.io/nomiamispoiler/
**URL di assistenza:** https://github.com/VecienzG/nomiamispoiler/issues

### Descrizione EN

```
Reach Leonida spoiler-free.

No Miami Spoiler blurs GTA VI spoilers on YouTube, Reddit, X, Google and any other website, before you read them. Titles, thumbnails, comments and posts get covered; one click reveals them when you want.

THREE LEVELS
• Light: only obvious spoilers (endings, deaths, twists, leaks)
• Smart: plus doubtful cases, checked by Chrome's built-in AI running on your computer
• Paranoid: everything about GTA VI, news included

UPDATES ITSELF
After launch, new characters and missions show up on fan wikis within hours. No Miami Spoiler studies the public names every 6 hours and updates its list automatically, no extension update needed. The list ships as fingerprints only, so opening the extension's files will never spoil you.

PRIVATE BY DESIGN
• Page text is analysed only on your device
• The optional AI (Gemini Nano) runs locally: nothing is sent to any server
• No accounts, no tracking, no ads, no data collected

ALSO
• Pause on a single site
• Add your own words to block (a streamer's name, a friend who always spoils)
• On YouTube watch pages, the player is paused and covered if the title is a spoiler
• English and Italian

Free and non-commercial. Not affiliated with, endorsed by or connected to Rockstar Games or Take-Two Interactive. Grand Theft Auto and GTA are trademarks of their respective owners. Names studied from GTA Wiki (CC BY-SA).
```

### Descrizione IT

```
Arriva a Leonida senza spoiler.

No Miami Spoiler sfoca gli spoiler di GTA VI su YouTube, Reddit, X, Google e su qualsiasi sito, prima che tu li legga. Titoli, miniature, commenti e post vengono coperti: un click e li vedi quando vuoi tu.

TRE LIVELLI
• Leggero: solo spoiler evidenti (finale, morti, colpi di scena, leak)
• Medio: più i casi dubbi, controllati dall'AI integrata in Chrome che gira sul tuo computer
• Paranoico: tutto ciò che parla di GTA VI, anche le notizie

SI AGGIORNA DA SOLO
Dopo l'uscita, personaggi e missioni nuove compaiono sulle wiki dei fan in poche ore. No Miami Spoiler studia i nomi pubblici ogni 6 ore e aggiorna la sua lista da solo, senza bisogno di aggiornare l'estensione. La lista viaggia solo come impronte: aprire i file dell'estensione non ti spoilera mai.

PRIVATO PER DAVVERO
• Il testo delle pagine viene analizzato solo sul tuo dispositivo
• L'AI opzionale (Gemini Nano) gira in locale: nessun testo inviato a server
• Niente account, tracciamento, pubblicità o raccolta di dati

E IN PIÙ
• Pausa su un singolo sito
• Parole tue da bloccare (il nome di uno streamer, l'amico che spoilera sempre)
• Sulle pagine video di YouTube, se il titolo è uno spoiler il player viene messo in pausa e coperto
• Italiano e inglese

Gratis e non commerciale. Non affiliato, approvato o collegato a Rockstar Games o Take-Two Interactive. Grand Theft Auto e GTA sono marchi dei rispettivi proprietari. Nomi studiati da GTA Wiki (CC BY-SA).
```

---

## 2. "Privacy practices" (Pratiche relative alla privacy)

**Scopo unico (Single purpose):**
```
Hide GTA VI spoilers on web pages: it detects text about the game's story and blurs it until the user clicks to reveal it.
```

**Giustificazione dei permessi:**

| Permesso | Testo da incollare |
|---|---|
| `storage` | `Saves the user's settings (protection level, extra blocked words, paused sites) and the updated list of name fingerprints.` |
| `activeTab` | `Reads the hostname of the current tab when the user opens the popup, so they can pause protection on that site.` |
| `alarms` | `Checks every 6 hours for an updated list of name fingerprints (a static JSON file on GitHub Pages).` |
| `offscreen` | `Runs Chrome's built-in on-device AI (Prompt API / Gemini Nano) in an offscreen document to tell real spoilers apart from harmless news. Nothing leaves the device.` |
| Host permission (content script su tutti i siti) | `Spoilers can appear on any website (video sites, social networks, search results, news, forums). The content script must read visible text to decide what to blur. Text is processed locally and never transmitted.` |

**Codice remoto (Remote code):** `No, I am not using remote code.`
(La lista scaricata è un file JSON di dati, non codice: viene accettato solo se contiene esattamente impronte.)

**Uso dei dati:** non spuntare nessuna categoria (nessun dato raccolto). Spunta le tre dichiarazioni:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**URL della privacy policy:** https://vecienzg.github.io/nomiamispoiler/privacy.html

---

## 3. "Distribution" (Distribuzione)

- Visibilità: **Public**
- Paesi: **tutti**
- Prezzo: gratis

---

## Note
- Il content script su tutti i siti fa scattare la **revisione approfondita**: può richiedere più giorni del solito. Per questo conviene inviare il prima possibile.
- **Firefox (addons.mozilla.org):** account gratis su https://addons.mozilla.org/developers/ → "Submit a New Add-on" → "On this site" → carica lo zip Firefox. Stessa descrizione; il codice non è minificato, quindi non serve allegare i sorgenti.
