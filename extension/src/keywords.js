// Liste di parole. Solo nomi già pubblici (trailer/sito ufficiale): niente trama vera qui dentro.
// Dopo il 19/11 queste liste verranno aggiornate da remoto (fase 2).
globalThis.NMS_KEYWORDS = {
  // Un solo match basta per dire "si parla di GTA VI"
  strong: [
    'gta 6', 'gta vi', 'gtavi', 'gta6', '#gta6', '#gtavi',
    'grand theft auto 6', 'grand theft auto vi',
  ],
  // Nomi del mondo di gioco: specifici, valgono doppio
  world: [
    'lucia caminos', 'jason duval', 'leonida', 'port gellhorn', 'ambrosia',
    'grassrivers', 'mount kalaga', 'leonida keys', 'cal hampton', 'boobie ike',
    "dre'quan priest", 'real dimez', 'raul bautista', 'brian heder',
    'jason e lucia', 'lucia e jason', 'jason and lucia', 'lucia and jason',
    'jason y lucia', 'lucia y jason',
  ],
  // Parole generiche: contano solo se ci sono altri indizi. Il numero è il peso.
  weak: {
    gta: 2,
    'grand theft auto': 2,
    'vice city': 1,
    rockstar: 1,
    'rockstar games': 1,
    lucia: 1,
    jason: 1,
  },
  // Parole che suonano come "sto per raccontarti la storia"
  spoiler: [
    // it
    'il finale', 'la fine', 'muore', 'morto', 'morta', 'morte di', 'uccide', 'ucciso', 'uccisa',
    'tradisce', 'tradimento', 'traditore', 'colpo di scena', 'spoiler', 'spoilerato', 'leak',
    'trapelato', 'epilogo', 'ultima missione', 'missione finale', 'rivelazione', 'si scopre',
    'scopre che', 'fine della storia', 'boss finale', 'sopravvive', 'titoli di coda',
    // en
    'ending', 'endings', 'final mission', 'last mission', 'dies', 'died', 'death of', 'killed',
    'kills', 'betray', 'betrays', 'betrayal', 'betrayed', 'twist', 'plot twist', 'spoilers',
    'leaked', 'epilogue', 'storyline', 'true ending', 'secret ending', 'final boss',
    'survives', 'traitor', 'credits scene', 'ending explained',
    // es
    'el final', 'muere', 'muerte de', 'mata', 'traiciona', 'traición', 'giro argumental',
    'filtración', 'epílogo', 'última misión', 'misión final', 'sobrevive',
  ],
};
