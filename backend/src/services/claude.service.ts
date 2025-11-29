import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Initialize Anthropic client
const anthropic = env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  : null;

// System prompt for the chatbot - base template
const SYSTEM_PROMPT_BASE = `Ti si Botislav, sales konsultant za NKNet-Consulting.com (platforma Tražim-Radnike.online).

🎯 TVOJ GLAVNI CILJ:
Prikupiš podatke o potrebama za radnicima i ODMAH ponudiš rešenje - radnike iz inostranstva! Budi human, direktan, kao da pričaš sa kolegom.

KAKO PRIČAŠ (VEOMA VAŽNO):
- Pričaj opušteno, kao čovek čoveku
- Koristi "e pa", "ma da", "super", "odlično"
- Budi direktan i konkretan
- NE koristi previše emoji-ja (max 1-2 po poruci)
- NE budi robotski ili previše formalan
- Koristi srpski sa latiničnim pismom

PRIMER RAZGOVORA:
Klijent: "Trebaju mi 2 pekara i 2 prodavačice"
Ti: "E super, baš ti trebaju pekari! Znaš šta, ja imam odlične pekare iz Indije i Nepala - ljudi su vredni, dolaze spremni za posao. Da bi došli, treba im smeštaj i plata oko 600-800€. Gde vam je pekara, u kom gradu?"

O NAMA:
- NKNet-Consulting.com pomaže firmama da nađu radnike iz INDIJE, NEPALA, BANGLADEŠA i EGIPTA
- Mi sredimo SVE papire i dozvole
- Radnici dolaze spremni za rad, znaju osnove srpskog
- Proces traje 2-4 nedelje

KAKO DA PRODAJEŠ:
1. Čim klijent kaže šta traži → ODMAH ponudi strane radnike kao rešenje
2. Objasni šta im treba: smeštaj + hrana + plata 600-800€
3. Naglasi da je oglas BESPLATAN i da dobijaju FREE biznis profil na Tražim-Radnike.online
4. Prikupi sve podatke kroz normalan razgovor

ŠTA TREBAŠ DA SAZNAŠ (kroz razgovor, ne kao anketu):
- positions: Koje pozicije i koliko ljudi (npr. "2 pekara, 2 prodavačice")
- salary: Kolika plata (EUR mesečno) - ako ne znaju, predloži 600-800€
- location: Gde je posao (grad)
- workHours: Kakve smene (dnevna/noćna/smenski)
- housing: DA LI MOGU DA OBEZBEDE SMEŠTAJ? (ovo je KLJUČNO za strane radnike!)
- experience: Treba li iskustvo ili mogu početnici
- languages: Jezici - napomeni da naši radnici uče srpski pre dolaska
- foreignWorkers: Jesu li OK sa radnicima iz inostranstva
- contactEmail: Email za ponudu

PRODAJNE FORE:
- "E pa baš si dobro došao kod mene! Imam odlične radnike iz Indije/Nepala..."
- "Znaš kako je teško naći radnike ovde, a ja imam ljude koji jedva čekaju da dođu i rade"
- "Smeštaj im treba, ali računaj da su to vredni ljudi, neće ti praviti probleme"
- "Oglas ti je besplatan, plus dobijaš biznis profil na platformi - win-win"
- "Daj mi email pa ti pošaljem detaljnu ponudu, vidiš sve crno na belo"

BONUS - BESPLATAN OGLAS:
- Uvek naglasi: "Oglas je BESPLATAN!"
- "Kad postaviš oglas, dobijaš i FREE biznis profil na Tražim-Radnike.online - to ti je oglasna tabla gde te firme mogu naći"
- "Registracija traje 2 minuta, a profil ti ostaje zauvek"

PRAVILA:
1. Pitaj JEDNO pitanje, ne bombarduj
2. Ako klijent da više info odjednom - pohvali i potvrdi šta si razumeo
3. NIKAD ne traži lične podatke (pasoš, kartica)
4. Ako klijent oklijeva - budi strpljiv, objasni prednosti

TON: Prijateljski, direktan, kao iskusan kolega koji zna posao i hoće da pomogne.`;

// Build dynamic system prompt with collected data context
function buildSystemPrompt(collectedData: Record<string, any> = {}): string {
  const fields = [
    { key: 'positions', label: 'Pozicije/broj radnika' },
    { key: 'salary', label: 'Plata' },
    { key: 'location', label: 'Lokacija' },
    { key: 'workHours', label: 'Radno vreme' },
    { key: 'housing', label: 'Smeštaj' },
    { key: 'experience', label: 'Iskustvo' },
    { key: 'languages', label: 'Jezici' },
    { key: 'foreignWorkers', label: 'Zainteresovani za strane radnike' },
    { key: 'contactEmail', label: 'Email za ponudu' },
  ];

  const collected: string[] = [];
  const missing: string[] = [];

  fields.forEach(({ key, label }) => {
    if (collectedData[key]) {
      collected.push(`✅ ${label}: ${collectedData[key]}`);
    } else {
      missing.push(`❌ ${label}`);
    }
  });

  let contextInfo = '';
  if (collected.length > 0 || missing.length > 0) {
    contextInfo = `

TRENUTNI STATUS PRIKUPLJANJA:
${collected.length > 0 ? 'PRIKUPLJENO:\n' + collected.join('\n') : ''}
${missing.length > 0 ? '\nNEDOSTAJE:\n' + missing.join('\n') : ''}

${missing.length === 0 ? 'SVI PODACI SU PRIKUPLJENI! Prikaži pregled i pitaj korisnika da potvrdi.' : 'Nastavi sa prikupljanjem nedostajućih podataka.'}`;
  }

  return SYSTEM_PROMPT_BASE + contextInfo;
}

// Legacy static prompt for general conversation
const SYSTEM_PROMPT = SYSTEM_PROMPT_BASE;

// Types
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  stopReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

class ClaudeService {
  private readonly model = 'claude-haiku-4-5-20251001';
  private readonly maxTokens = 800;
  private readonly temperature = 0;

  /**
   * Check if Claude API is available
   */
  isAvailable(): boolean {
    return anthropic !== null;
  }

  /**
   * Send a message to Claude and get a response
   */
  async chat(
    userMessage: string,
    conversationHistory: ClaudeMessage[] = []
  ): Promise<ClaudeResponse | null> {
    if (!anthropic) {
      logger.warn('Anthropic API key not configured, using fallback responses');
      return null;
    }

    try {
      // Build messages array with history
      const messages: Anthropic.MessageParam[] = conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage,
      });

      // Call Claude API
      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        system: SYSTEM_PROMPT,
        messages,
      });

      // Extract text content
      const textContent = response.content.find((block) => block.type === 'text');
      const content = textContent && 'text' in textContent ? textContent.text : '';

      logger.info(
        {
          model: this.model,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
        'Claude API call successful'
      );

      return {
        content,
        stopReason: response.stop_reason || 'end_turn',
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      logger.error({ error }, 'Claude API error');
      return null;
    }
  }

  /**
   * Intelligent chat for job creation flow
   * Uses dynamic system prompt and extracts data from conversation
   */
  async chatWithDataExtraction(
    userMessage: string,
    conversationHistory: ClaudeMessage[] = [],
    currentCollectedData: Record<string, any> = {}
  ): Promise<{ response: ClaudeResponse; extractedData: Record<string, any> } | null> {
    if (!anthropic) {
      logger.warn('Anthropic API key not configured');
      return null;
    }

    try {
      // Build messages array with history
      const messages: Anthropic.MessageParam[] = conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add current user message
      messages.push({
        role: 'user',
        content: userMessage,
      });

      // Build dynamic system prompt with context about collected data
      const systemPrompt = buildSystemPrompt(currentCollectedData);

      // First call: Get conversational response
      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        temperature: 0.2, // Slightly higher for more natural conversation
        system: systemPrompt,
        messages,
      });

      const textContent = response.content.find((block) => block.type === 'text');
      const conversationResponse = textContent && 'text' in textContent ? textContent.text : '';

      // Second call: Extract structured data from the conversation
      const extractionPrompt = `Analiziraj sledeću poruku korisnika i izvuci sve relevantne podatke za zahtev za radnike.

PORUKA KORISNIKA: "${userMessage}"

POSTOJEĆI PODACI: ${JSON.stringify(currentCollectedData)}

Izvuci SAMO nove podatke koje je korisnik naveo. Vrati JSON objekat sa sledećim poljima (samo ona koja su navedena u poruci):
- positions: string (npr. "2 pekara, 2 prodavačice" ili "5 vozača")
- salary: string (npr. "800-1000 EUR" ili "po dogovoru")
- location: string (npr. "Beograd, Srbija")
- workHours: string (npr. "noćna smena" ili "puno radno vreme")
- housing: string (npr. "da, besplatan smeštaj" ili "ne")
- experience: string (npr. "2 godine" ili "bez iskustva")
- languages: string (npr. "srpski, engleski")
- foreignWorkers: string (npr. "da, zainteresovan", "ne", "možda", "razmisliću")
- contactEmail: string (npr. "petar@firma.rs")
- contactPhone: string (npr. "+381 64 123 4567") - opciono
- companyName: string (npr. "Pekara Miloš") - opciono

VAŽNO:
- Vrati SAMO JSON objekat, bez dodatnog teksta
- Ako podatak NIJE naveden u poruci, NE uključuj to polje
- Ako poruka ne sadrži nijedan relevantan podatak, vrati prazan objekat {}
- Za foreignWorkers: izvuci DA ako korisnik kaže da je zainteresovan za strane radnike, NE ako odbije, ili MOŽDA ako nije siguran
- Za email: pažljivo izvuci email adresu ako je navedena

JSON:`;

      const extractionResponse = await anthropic.messages.create({
        model: this.model,
        max_tokens: 500,
        temperature: 0,
        messages: [{ role: 'user', content: extractionPrompt }],
      });

      const extractionText = extractionResponse.content.find((block) => block.type === 'text');
      const extractionContent = extractionText && 'text' in extractionText ? extractionText.text : '{}';

      // Parse extracted data
      let extractedData: Record<string, any> = {};
      try {
        // Try to find JSON in the response
        const jsonMatch = extractionContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        logger.warn({ extractionContent }, 'Failed to parse extracted data');
      }

      logger.info(
        {
          model: this.model,
          inputTokens: response.usage.input_tokens + extractionResponse.usage.input_tokens,
          outputTokens: response.usage.output_tokens + extractionResponse.usage.output_tokens,
          extractedFields: Object.keys(extractedData),
        },
        'Claude API call with data extraction successful'
      );

      return {
        response: {
          content: conversationResponse,
          stopReason: response.stop_reason || 'end_turn',
          usage: {
            inputTokens: response.usage.input_tokens + extractionResponse.usage.input_tokens,
            outputTokens: response.usage.output_tokens + extractionResponse.usage.output_tokens,
          },
        },
        extractedData,
      };
    } catch (error) {
      logger.error({ error }, 'Claude API error in chatWithDataExtraction');
      return null;
    }
  }

  /**
   * Generate a job posting summary based on collected data
   */
  async generateJobSummary(data: {
    title: string;
    numWorkers: number;
    salary: string;
    location: string;
    workHours?: string;
    housing?: string;
    experience?: string;
    languages?: string[];
  }): Promise<{ fullDescription: string; publicDescription: string } | null> {
    if (!anthropic) {
      return null;
    }

    const prompt = `Na osnovu sledećih podataka, napravi dva opisa oglasa za posao:

PODACI:
- Pozicija: ${data.title}
- Broj radnika: ${data.numWorkers}
- Plata: ${data.salary}
- Lokacija: ${data.location}
- Radno vreme: ${data.workHours || 'Nije navedeno'}
- Smeštaj: ${data.housing || 'Nije navedeno'}
- Iskustvo: ${data.experience || 'Nije navedeno'}
- Jezici: ${data.languages?.join(', ') || 'Nije navedeno'}

ZADATAK:
1. PUNI OPIS (FULL): Detaljan opis sa svim informacijama za privatni prikaz
2. JAVNI OPIS (PUBLIC): Kratak opis bez osetljivih detalja (bez tačne plate, lokacije)

FORMAT ODGOVORA (STROGO):
---FULL---
[puni opis ovde]
---PUBLIC---
[javni opis ovde]`;

    try {
      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: 1000,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      });

      const textContent = response.content.find((block) => block.type === 'text');
      const content = textContent && 'text' in textContent ? textContent.text : '';

      // Parse the response
      const fullMatch = content.match(/---FULL---\s*([\s\S]*?)---PUBLIC---/);
      const publicMatch = content.match(/---PUBLIC---\s*([\s\S]*?)$/);

      return {
        fullDescription: fullMatch?.[1]?.trim() || content,
        publicDescription: publicMatch?.[1]?.trim() || '',
      };
    } catch (error) {
      logger.error({ error }, 'Claude API error generating job summary');
      return null;
    }
  }

  /**
   * Get initial greeting for the chatbot
   */
  getInitialGreeting(): string {
    return `Zdravo! Ja sam Botislav 👋

Radim u NKNet-Consulting i pomaćem firmama da nađu radnike. Specijalizovani smo za radnike iz Indije, Nepala i Egipta - vredne ljude koji dolaze spremni za posao.

Oglas je BESPLATAN, a dobijaš i biznis profil na platformi.

Reci mi, koji radnici ti trebaju?`;
  }

  /**
   * Get fallback response when API is not available
   */
  getFallbackResponse(intent: string): string {
    const responses: Record<string, string> = {
      greeting: `Zdravo! Ja sam Botislav 👋

Radim u NKNet-Consulting - pomaćemo firmama da nađu radnike iz Indije, Nepala i Egipta.

Trenutno imam tehničkih problema, ali možeš da se registruješ i ostaviš oglas - javiću ti se čim budem dostupan!`,

      help: `E pa mogu da ti pomognem sa:

- Pronalaženjem radnika iz inostranstva (Indija, Nepal, Egipat)
- Postavljanjem besplatnog oglasa
- Objašnjenjem procedure i dokumentacije

Šta te zanima?`,

      default: `Hvala na poruci!

Registruj se na platformi i postavi besplatan oglas - dobijaš i biznis profil gde te firme mogu naći.

Naš tim će ti se javiti sa konkretnom ponudom!`,
    };

    return responses[intent] || responses.default;
  }
}

export const claudeService = new ClaudeService();
