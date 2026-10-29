// Gemini Nano (Prompt API di Chrome): gira sul computer, gratis, niente dati inviati a server.
const SYSTEM = `You are a spoiler detector for the video game Grand Theft Auto VI (GTA 6).
You receive a short text from a web page (any language: Italian, English, Spanish...).
Answer spoiler=true ONLY if the text reveals or strongly hints at story content: plot events,
character deaths or fates, betrayals, twists, mission outcomes, the ending, or post-credits events.
Answer spoiler=false for news, release dates, prices, trailers, performance, reviews without plot
details, memes about hype, gameplay mechanics, map size, or anything that does not reveal the story.`;

const SCHEMA = {
  type: 'object',
  properties: { spoiler: { type: 'boolean' } },
  required: ['spoiler'],
};

const OPTIONS = {
  expectedInputs: [{ type: 'text', languages: ['en', 'es'] }],
  expectedOutputs: [{ type: 'text', languages: ['en'] }],
};

let base = null;
let queue = Promise.resolve();

async function getSession() {
  if (!('LanguageModel' in self)) return null;
  if (base) return base;
  // Il download del modello lo avvia il popup (serve un click dell'utente)
  if ((await LanguageModel.availability(OPTIONS)) !== 'available') return null;
  base = await LanguageModel.create({
    ...OPTIONS,
    initialPrompts: [{ role: 'system', content: SYSTEM }],
  });
  return base;
}

async function classify(text) {
  const session = await getSession();
  if (!session) return { available: false };
  const s = await session.clone();
  try {
    const out = await s.prompt(`Text:\n"""${text}"""`, { responseConstraint: SCHEMA });
    return { available: true, spoiler: !!JSON.parse(out).spoiler };
  } finally {
    s.destroy();
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === 'nms-off-status') {
    getSession()
      .then((s) => sendResponse({ available: !!s }))
      .catch(() => sendResponse({ available: false }));
    return true;
  }
  if (msg?.type === 'nms-off-classify') {
    // Una richiesta alla volta: il modello locale non ama la folla
    queue = queue
      .then(() => classify(msg.text))
      .then(sendResponse, () => sendResponse({ available: false }));
    return true;
  }
  return false;
});
