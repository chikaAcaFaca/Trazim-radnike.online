#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Sales knowledge base for Trazim-Radnike.online
const SALES_KNOWLEDGE = {
  value_proposition: `
Tražim-Radnike.online je premium konsultantska agencija za regrutaciju radnika.

NAŠE PREDNOSTI:
✅ Diskrecija - vaši podaci su zaštićeni
✅ Efikasnost - brzo pronalazimo prave kandidate
✅ Regionalna pokrivenost - ceo Balkan
✅ Stručna podrška - tim eksperata za regrutaciju
✅ Fleksibilnost - prilagođavamo se vašim potrebama
`,

  job_posting_guide: `
KAKO POSTAVITI OGLAS - KORAK PO KORAK:

1. REGISTRACIJA (30 sekundi)
   - Unesite email i lozinku
   - Potvrdite email adresu

2. KREIRANJE KOMPANIJE
   - Naziv firme
   - Kontakt podaci
   - Logo (opciono ali preporučeno)

3. POSTAVLJANJE OGLASA
   - Naslov pozicije (jasan i konkretan)
   - Opis posla (detaljno)
   - Uslovi i beneficije
   - Lokacija rada
   - Tip zaposlenja

4. VIDLJIVOST OGLASA
   - PRIVATNI: Samo vi vidite
   - TAJNI LINK: Delite samo odabranim kandidatima
   - JAVNI: Vidljiv svima

5. UPRAVLJANJE PRIJAVAMA
   - Pratite kandidate
   - Komunicirajte direktno
   - Donosite odluke
`,

  why_post_job: `
ZAŠTO POSTAVITI OGLAS KOD NAS?

1. DISKRECIJA JE PRIORITET
   - Konkurencija ne mora znati da tražite radnike
   - Kontrolišete ko vidi vaš oglas
   - Zaštićeni podaci

2. KVALITETNI KANDIDATI
   - Verifikovani profili
   - Iskusni radnici iz regiona
   - Motivisan kadar

3. UŠTEDA VREMENA
   - Automatska selekcija
   - Brza komunikacija
   - Efikasan proces

4. PODRŠKA 24/7
   - AI asistent uvek dostupan
   - Tim eksperata za pomoć
   - Personalizovane konsultacije
`,

  required_materials: `
ŠTA VAM JE POTREBNO ZA OGLAS:

OBAVEZNO:
📝 Jasan naslov pozicije
📋 Detaljan opis posla
💰 Uslovi (plata, beneficije)
📍 Lokacija rada
⏰ Tip zaposlenja (puno/part-time)

PREPORUČENO:
🖼️ Logo kompanije (PNG/JPG, min 200x200px)
📄 Dodatni dokumenti (PDF)
🎯 Specifični zahtevi

SAVETI ZA BOLJI OGLAS:
• Budite konkretni u opisu
• Navedite beneficije
• Opišite radnu atmosferu
• Budite realni sa zahtevima
`,

  next_steps: `
SLEDEĆI KORACI:

1. ➡️ Registrujte se (besplatno)
2. ➡️ Kreirajte profil kompanije
3. ➡️ Postavite prvi oglas
4. ➡️ Pratite prijave
5. ➡️ Odaberite kandidate

TREBATE POMOĆ?
• Koristite ovaj chat za pitanja
• Zatražite poziv od našeg tima
• Pogledajte video uputstva

SPREMNI STE?
Kliknite "Registruj se" i počnite za 30 sekundi!
`,

  pricing: `
CENOVNIK:

OSNOVNI PAKET - BESPLATNO
• 1 aktivan oglas
• Osnovne funkcije
• Email podrška

PROFESIONALNI PAKET
• Do 10 oglasa
• Prioritetna vidljivost
• Chat podrška
• Analitika

ENTERPRISE PAKET
• Neograničen broj oglasa
• Dedicirani menadžer
• API pristup
• Prilagođene funkcije

Kontaktirajte nas za detalje o cenama.
`,

  foreign_workers: `
STRANI RADNICI - INFORMACIJE:

LEGALNI PROCES:
1. Verifikacija dokumenata
2. Provera radnih dozvola
3. Usklađenost sa zakonima

MI VAM POMAŽEMO:
• Savetovanje o procesu
• Verifikacija kandidata
• Pravna podrška (partneri)

VAŽNO:
• Svi radnici moraju imati validne dozvole
• Odgovornost je na poslodavcu
• Nudimo konsultacije za kompleksne slučajeve
`,
};

// Pending messages queue (simulates database)
interface PendingMessage {
  id: string;
  userId: string;
  userEmail: string;
  message: string;
  timestamp: Date;
  conversationHistory: string[];
}

let pendingMessages: PendingMessage[] = [];
let processedResponses: Map<string, string> = new Map();

// Initialize MCP Server
const server = new Server(
  {
    name: 'trazim-radnike-chatbot',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      prompts: {},
    },
  }
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_pending_messages',
        description: 'Dobijte listu neobrađenih poruka od korisnika koje čekaju odgovor. Koristite ovo da vidite šta korisnici pitaju.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maksimalan broj poruka za preuzimanje (default: 10)',
            },
          },
        },
      },
      {
        name: 'send_response',
        description: 'Pošaljite odgovor korisniku na njegovo pitanje. Odgovor treba da bude prijateljski, profesionalan i informativan.',
        inputSchema: {
          type: 'object',
          properties: {
            messageId: {
              type: 'string',
              description: 'ID poruke na koju odgovarate',
            },
            response: {
              type: 'string',
              description: 'Vaš odgovor korisniku',
            },
            suggestedActions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Predložene akcije za korisnika (opciono)',
            },
          },
          required: ['messageId', 'response'],
        },
      },
      {
        name: 'get_knowledge_base',
        description: 'Pristupite bazi znanja o Trazim-Radnike.online platformi. Koristite ovo za tačne informacije.',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              enum: [
                'value_proposition',
                'job_posting_guide',
                'why_post_job',
                'required_materials',
                'next_steps',
                'pricing',
                'foreign_workers',
                'all',
              ],
              description: 'Tema za koju tražite informacije',
            },
          },
          required: ['topic'],
        },
      },
      {
        name: 'add_test_message',
        description: 'Dodajte test poruku za simulaciju (samo za development)',
        inputSchema: {
          type: 'object',
          properties: {
            userEmail: {
              type: 'string',
              description: 'Email korisnika',
            },
            message: {
              type: 'string',
              description: 'Poruka korisnika',
            },
          },
          required: ['userEmail', 'message'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'get_pending_messages': {
      const limit = (args?.limit as number) || 10;
      const messages = pendingMessages.slice(0, limit);

      return {
        content: [
          {
            type: 'text',
            text: messages.length === 0
              ? 'Nema neobrađenih poruka.'
              : `Neobrađene poruke (${messages.length}):\n\n${messages
                  .map(
                    (m, i) =>
                      `${i + 1}. [ID: ${m.id}]\n   Od: ${m.userEmail}\n   Poruka: "${m.message}"\n   Vreme: ${m.timestamp.toISOString()}\n   Istorija: ${m.conversationHistory.length} prethodnih poruka`
                  )
                  .join('\n\n')}`,
          },
        ],
      };
    }

    case 'send_response': {
      const messageId = args?.messageId as string;
      const response = args?.response as string;
      const suggestedActions = (args?.suggestedActions as string[]) || [];

      if (!messageId || !response) {
        return {
          content: [
            {
              type: 'text',
              text: 'Greška: messageId i response su obavezni.',
            },
          ],
          isError: true,
        };
      }

      // Find and remove message from pending
      const messageIndex = pendingMessages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) {
        return {
          content: [
            {
              type: 'text',
              text: `Poruka sa ID ${messageId} nije pronađena.`,
            },
          ],
          isError: true,
        };
      }

      const message = pendingMessages[messageIndex];
      pendingMessages.splice(messageIndex, 1);

      // Store response
      processedResponses.set(messageId, JSON.stringify({
        response,
        suggestedActions,
        processedAt: new Date().toISOString(),
      }));

      return {
        content: [
          {
            type: 'text',
            text: `✅ Odgovor poslat korisniku ${message.userEmail}.\n\nOdgovor: "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}"\n\nPredložene akcije: ${suggestedActions.length > 0 ? suggestedActions.join(', ') : 'Nema'}`,
          },
        ],
      };
    }

    case 'get_knowledge_base': {
      const topic = args?.topic as string;

      if (topic === 'all') {
        return {
          content: [
            {
              type: 'text',
              text: Object.entries(SALES_KNOWLEDGE)
                .map(([key, value]) => `## ${key.toUpperCase()}\n${value}`)
                .join('\n\n---\n\n'),
            },
          ],
        };
      }

      const knowledge = SALES_KNOWLEDGE[topic as keyof typeof SALES_KNOWLEDGE];
      if (!knowledge) {
        return {
          content: [
            {
              type: 'text',
              text: `Tema "${topic}" nije pronađena. Dostupne teme: ${Object.keys(SALES_KNOWLEDGE).join(', ')}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: knowledge,
          },
        ],
      };
    }

    case 'add_test_message': {
      const userEmail = args?.userEmail as string;
      const message = args?.message as string;

      if (!userEmail || !message) {
        return {
          content: [
            {
              type: 'text',
              text: 'Greška: userEmail i message su obavezni.',
            },
          ],
          isError: true,
        };
      }

      const newMessage: PendingMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        userId: `user_${Math.random().toString(36).substring(7)}`,
        userEmail,
        message,
        timestamp: new Date(),
        conversationHistory: [],
      };

      pendingMessages.push(newMessage);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Test poruka dodana sa ID: ${newMessage.id}`,
          },
        ],
      };
    }

    default:
      return {
        content: [
          {
            type: 'text',
            text: `Nepoznat alat: ${name}`,
          },
        ],
        isError: true,
      };
  }
});

// Define prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'sales_agent',
        description: 'Prompt za prodajnog agenta - odgovaranje na pitanja korisnika o platformi',
        arguments: [
          {
            name: 'language',
            description: 'Jezik za odgovore (sr-latin, sr-cyrillic, en)',
            required: false,
          },
        ],
      },
      {
        name: 'process_messages',
        description: 'Obradi sve neobrađene poruke korisnika',
        arguments: [],
      },
    ],
  };
});

// Handle prompt requests
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'sales_agent':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Ti si AI prodajni agent za Tražim-Radnike.online - premium konsultantsku agenciju za regrutaciju radnika na Balkanu.

TVOJA ULOGA:
- Odgovaraš na pitanja korisnika prijateljski i profesionalno
- Vodiš korisnike kroz proces postavljanja oglasa
- Objašnjavaš prednosti platforme
- Pomažeš sa tehničkim pitanjima
- Preporučuješ sledeće korake

STIL KOMUNIKACIJE:
- Koristi srpski jezik (latinica)
- Budi topao ali profesionalan
- Odgovaraj koncizno (2-4 rečenice po temi)
- Uvek ponudi sledeći korak ili akciju
- Koristi emoji umjereno za prijateljski ton

VAŽNA PRAVILA:
1. NIKADA ne deli lične podatke korisnika
2. NIKADA ne obećavaj nešto što ne možeš ispuniti
3. UVEK naglasi diskreciju platforme
4. Za kompleksna pitanja, preporuči kontakt sa podrškom

KORISTI ALATE:
- get_knowledge_base za tačne informacije
- send_response za slanje odgovora
- get_pending_messages za listu poruka

Jezik: ${args?.language || 'sr-latin'}`,
            },
          },
        ],
      };

    case 'process_messages':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Obradi sve neobrađene poruke korisnika.

KORACI:
1. Koristi get_pending_messages da vidiš neobrađene poruke
2. Za svaku poruku:
   a. Analiziraj šta korisnik pita
   b. Koristi get_knowledge_base za relevantne informacije
   c. Napiši prijateljski i informativan odgovor
   d. Koristi send_response da pošalješ odgovor
3. Nastavi dok ne obradis sve poruke

PRAVILA:
- Odgovori trebaju biti na srpskom (latinica)
- Budi koncizan ali informativan
- Uvek ponudi sledeći korak
- Dodaj suggested_actions gde je relevantno`,
            },
          },
        ],
      };

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
});

// HTTP API for backend integration
// This allows the Node.js backend to add messages and retrieve responses

export function addMessage(userId: string, userEmail: string, message: string, history: string[] = []): string {
  const id = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  pendingMessages.push({
    id,
    userId,
    userEmail,
    message,
    timestamp: new Date(),
    conversationHistory: history,
  });
  return id;
}

export function getResponse(messageId: string): { response: string; suggestedActions: string[] } | null {
  const data = processedResponses.get(messageId);
  if (!data) return null;

  const parsed = JSON.parse(data);
  processedResponses.delete(messageId);
  return {
    response: parsed.response,
    suggestedActions: parsed.suggestedActions,
  };
}

export function getPendingCount(): number {
  return pendingMessages.length;
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Trazim-Radnike MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
