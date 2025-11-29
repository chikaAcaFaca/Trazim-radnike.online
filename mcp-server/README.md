# Trazim-Radnike MCP Server

MCP (Model Context Protocol) server za integraciju sa Claude MAX planom. Omogućava korišćenje Claude AI za generisanje chatbot odgovora bez plaćanja API poziva.

## Arhitektura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend API    │────▶│  MCP API Server │
│   (Chatbot)     │     │   (Port 3001)    │     │   (Port 3002)   │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          │ Messages Queue
                                                          ▼
                                                 ┌─────────────────┐
                                                 │ Claude Desktop  │
                                                 │ (MAX Plan)      │
                                                 │ + MCP Server    │
                                                 └─────────────────┘
```

## Komponente

### 1. MCP Server (`src/index.ts`)
Stdio-based MCP server koji se povezuje sa Claude Desktop.

Alati:
- `get_pending_messages` - Lista neobrađenih poruka
- `send_response` - Slanje odgovora korisniku
- `get_knowledge_base` - Pristup bazi znanja
- `add_test_message` - Dodavanje test poruke (dev)

Prompts:
- `sales_agent` - Prompt za prodajnog agenta
- `process_messages` - Obrada svih poruka u redu čekanja

### 2. API Server (`src/api-server.ts`)
HTTP API za komunikaciju sa backendom.

Endpointi:
- `POST /messages` - Dodaj poruku u red čekanja
- `GET /messages/pending` - Lista poruka za obradu
- `POST /messages/:id/respond` - Pošalji odgovor
- `GET /responses/:id` - Preuzmi odgovor
- `GET /stats` - Statistika reda

## Instalacija

```bash
cd mcp-server
npm install
```

## Pokretanje

### 1. API Server (uvek potreban)
```bash
npm run api
```

### 2. MCP Server (za Claude Desktop)
```bash
npm run dev
```

## Konfiguracija Claude Desktop

1. Otvorite Claude Desktop Settings
2. Idite na "MCP Servers"
3. Dodajte novi server:

```json
{
  "mcpServers": {
    "trazim-radnike": {
      "command": "npx",
      "args": ["tsx", "E:/preuzimanje/ClaudeCode/trazim-radnike.online/mcp-server/src/index.ts"]
    }
  }
}
```

Ili kopirajte sadržaj `claude_desktop_config.json` u vašu Claude Desktop konfiguraciju.

## Korišćenje sa Claude Desktop (MAX Plan)

1. Pokrenite API server (`npm run api`)
2. Otvorite Claude Desktop
3. MCP server će se automatski učitati
4. Koristite prompt `process_messages` za obradu poruka

### Primer sesije u Claude Desktop:

```
Korisnik: Obradi sve čekajuće poruke korisnika

Claude: [koristi get_pending_messages tool]
        [koristi get_knowledge_base tool]
        [koristi send_response tool za svaku poruku]
```

## Backend Integracija

Dodajte u `.env` fajl:

```env
# MCP Configuration
MCP_API_URL=http://localhost:3002
USE_MCP_AI=true
MCP_POLLING_TIMEOUT=30000
MCP_POLLING_INTERVAL=1000
```

Kada je `USE_MCP_AI=true`:
1. Korisnik šalje poruku
2. Backend dodaje poruku u MCP API red
3. Backend čeka odgovor (poll)
4. Ako Claude Desktop obradi poruku, vraća AI odgovor
5. Ako timeout, koristi pattern matching fallback

## Produkcija

### Opcija A: Manualna obrada
- Koristite API server samo za queuing
- Operater koristi Claude Desktop za obradu
- Skalabilno za manje količine poruka

### Opcija B: Automatska obrada
- Postavite cron job koji periodično pokreće obradu
- Koristite Claude Desktop CLI ili API wrapper

### Opcija C: Hybrid
- Pattern matching za jednostavna pitanja
- MCP/MAX plan za kompleksna pitanja

## Environment Variables

| Variable | Default | Opis |
|----------|---------|------|
| MCP_API_PORT | 3002 | Port za API server |
| MCP_API_URL | http://localhost:3002 | URL za backend |
| USE_MCP_AI | false | Koristi MCP za AI odgovore |
| MCP_POLLING_TIMEOUT | 30000 | Timeout za čekanje odgovora (ms) |
| MCP_POLLING_INTERVAL | 1000 | Interval pollinga (ms) |

## Razvoj

```bash
# Build TypeScript
npm run build

# Run MCP server
npm run dev

# Run API server
npm run api
```

## Troubleshooting

### MCP server se ne povezuje
1. Proverite da li je Claude Desktop ažuriran
2. Proverite putanju u konfiguraciji
3. Restartujte Claude Desktop

### Poruke se ne obrađuju
1. Proverite da li API server radi (`GET /stats`)
2. Proverite da li MCP server ima pristup alatima
3. Koristite `get_pending_messages` za proveru reda

### Timeout grešaka
1. Povećajte `MCP_POLLING_TIMEOUT`
2. Proverite da li Claude Desktop obrađuje poruke
