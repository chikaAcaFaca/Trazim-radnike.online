# PRD — **Tražim-Radnike.online**

*Diskretna platforma za poslodavce (B2B) — oglasi & chatbot regrutacija*
Datum: 2025-11-25

---

## 1) Cilj

Napraviti web platformu koja omogućava firmama iz regiona (Srbija, CG, HR, BiH, MK, BG, RO) da diskretno postavljaju oglase za radnike, koju upravlja AI/chatbot koji vodi poslodavca kroz unos i prikupljanje potrebnih podataka. Platforma je besplatna za poslodavce, zahteva registraciju, a potpuni detalji oglasa su dostupni samo poslodavcu, timu i korisnicima koji dobiju **tajni link**. Primarni fokus: brzina regrutacije, privatnost oglasa i jednostavna admin/agent radnja.

Referentni vizuel: `/mnt/data/A_digital_screenshot_of_the_homepage_of_"Tražim_Ra.png`

---

## 2) Ključne funkcionalnosti (high-level)

### Korisničke uloge

* **Guest (nenalogovan posetilac)** — vidi samo ograničene javne profile (osnovni podaci firmi).
* **Poslodavac (registrovan)** — može kreirati/urediti oglase, vidi pune detalje, prima komunikaciju od agencije, deli tajne linkove.
* **Agencija / Admin (vi)** — vidi sve zahteve, upravlja bazom radnika, predlaže kandidate kroz chat, može deliti linkove.
* **Radnik (opciono kasnije)** — može biti prijavljen u bazi (u početku: baza podataka i CV-ovi pod upravljanjem agencije).

### Osnovne funkcije

1. **Registracija / prijava**

   * Google & Facebook OAuth + email + telefon (obavezna verifikacija telefona i emaila).
2. **Kreiranje oglasa (poslodavac)**

   * Form fields: naziv pozicije, broj radnika, plata, mesto rada, smeštaj (da/ne + opisi), opis posla, iskustvo, dokumenta, slike (radno okruženje, smeštaj), hitnost, jezik komunikacije.
   * Chatbot vodi kroz unos — validira i traži slike/detalje.
3. **Vidljivost oglasa**

   * **Privatno (samo firma + admin)** — dashboard URL.
   * **Tajni link (full view)** — `trazim-radnike.online/:company/:slug?rf=<secret>` (neindeksiran, ne prikazuje se u pretrazi sajta).
   * **Javni (ograničen)** — `trazim-radnike.online/:company/:slug` — samo osnovni podatci; klik: “Za detalje potrebna je registracija”.
4. **Chatbot (AI)**

   * Vođen flow za kreiranje oglasa s jasno definiranim poljima.
   * Prikuplja slike i dokumente (upload), traži pojašnjenja, potvrdu privatnosti.
   * Generiše opis oglasa i sažetak za internu upotrebu.
   * Preporučuje tagove i tražene profile.
5. **Admin panel**

   * Pregled svih oglasa, filteri (hitnost, država, pozicija), prioritetne notifikacije za nove oglase.
   * Slanje profila kandidata u 1 klik (PDF/CSV).
   * Statistika, audit log, upravljanje korisnicima.
6. **Deljenje i pristup**

   * Generisanje tajnih linkova s eksiprirajućim tokenom (opciono).
   * Moć da se link resetuje (novi secret).
7. **Sigurnost & privatnost**

   * Svi uploadi i linkovi neindeksirani (robots.txt, meta noindex).
   * Šifrovanje podataka u mirovanju i prenosu (TLS, AES at rest).
   * GDPR kompatibilnost + jasno potpisane saglasnosti pri registraciji.
8. **Notifikacije**

   * Email + SMS obaveštenja za nove poruke i odgovore.
9. **Audit & logs**

   * Ko je video/izmenio oglas — za povjerenje i sigurnost.

---

## 3) Detaljan korisnički flow (poslodavac)

1. Poslodavac dolazi na početnu stranicu → Klik: **Postavi oglas**.
2. Ako nije ulogovan → modal za registraciju (OAuth ili email+phone). Verifikacija telefona obavezna.
3. Nakon prijave, chatbot (u sidebar-u/float modal) počinje:

   * Pozdrav, objašnjenje diskrecije, traži osnovne podatke.
   * Postavlja pitanja (pozicija, broj, plata, smeštaj, iskustvo, obaveze).
   * Traži upload fotografija radnog okruženja i smeštaja.
   * Pruža opciju “Sačuvaj kao skicu” ili “Pošalji nama da regrutujemo”.
4. Poslodavac potvrdi → oglas se pojavljuje u njihovom dashboardu kao **Privatno**.
5. Admin tim dobija notifikaciju → unutar 24h (ili brže) admin šalje prve predloge kroz chat.
6. Poslodavac može generisati **tajni link** koji omogućava eksternim pregledima (samo korisnicima kojima je link poslat).
7. Javna verzija (bez `rf=`) pokazuje samo ograničene podatke.

---

## 4) Tehničke specifikacije (preporučeni stack i API)

### Preporučeni stack

* Frontend: React (Next.js) — SSR/SSG + dobri SEO kontrolni headeri.
* UI: TailwindCSS / komponentna biblioteka.
* Backend: Node.js + Express / NestJS
* DB: PostgreSQL (oglasi, korisnici) + S3 kompatibilan storage (AWS S3 / DigitalOcean Spaces) za fajlove
* Authentication: OAuth + JWT + phone verification (Twilio/MessageBird)
* Chatbot: integracija s LLM (OpenAI / lokalni AI) za flow i copy; konverzacijski interfejs u realnom vremenu (WebSocket).
* Search & Filters: ElasticSearch (ili Postgres full-text) za brzo pretraživanje oglasa.
* Hosting: Vercel / AWS / DigitalOcean
* Monitoring: Sentry + Prometheus + Grafana

### Važni API endpointi (high-level)

* `POST /api/auth/signup` — registracija + phone verification
* `POST /api/auth/oauth` — OAuth callback
* `POST /api/jobs` — kreiraj oglas (privatno)
* `GET /api/jobs/:id` — vraća oglas s kontrolom vidljivosti (secret query param)
* `GET /api/jobs/public/:slug` — javna, ograničena verzija
* `POST /api/jobs/:id/generate-secret` — kreiraj tajni link
* `POST /api/uploads` — upload slika/dokumenata
* `POST /api/chat/:jobId/message` — chat poruke (poslodavac/admin)
* `GET /api/admin/jobs` — admin list

---

## 5) Chatbot PRD (flow + ponašanje)

### Svrha

Vođenje poslodavca kroz kompletan unos oglasa, prikupljanje materijala i osiguravanje privatnosti.

### Svojstva

* Persona: profesionalan, poverljiv, jasan (ton: „diskretan stručnjak za regrutaciju“).
* Obavezna polja: pozicija, broj radnika, plata, lokacija, radno vreme, smeštaj info, slike.
* Optional: video poziv za otkrivanje dodatnih uslova.
* Nakon svakog unosnog koraka chatbot sažima uneseno i traži potvrdu.
* Ako podatak nedostaje (npr. nema slika smeštaja), chatbot predlaže: “Pošaljite 3 slike unutrašnjosti / eksterijera” i objašnjava zašto su važne.
* Pri završetku: chatbot generiše opis oglasa (kratki + dugi) i predlaže tagove.

### Integracije

* LLM API za generisanje opisa i predloga tagova.
* File storage API za slike.
* Notifikacije (email/SMS).

---

## 6) Sigurnost i pravna usklađenost

* Prilikom registracije — checkbox za saglasnost obrade podataka (GDPR + lokalni zakoni).
* Transparentna Politika privatnosti i Uslovi korišćenja (posebno naglasiti privatnost oglasa).
* Svi tajni linkovi su dovoljno dugi i nasumični (minimum 128-bit token), opcionalno sa istekom.
* Robots.txt i meta noindex za privatne/tajne stranice.
* Enkripcija fajlova osjetljivih dokumenata.
* Audit trail (ko je pristupio, IP i timestamp).

---

## 7) UX/UI smernice i ključne ekrane (za dizajnera)

1. **Početna** — Call-to-action: Postavi oglas; clear benefit: “Diskretno. Brzo. Besplatno za poslodavce.”
2. **Registracija** — modal s OAuth + phone verification.
3. **Chatbot modal/float** — always-accessible regrutacijski asistent.
4. **Dashboard poslodavca** — lista oglasa (privatni / published secrets), status regrutacije, poruke.
5. **Detalji oglasa (admin view)** — kompletni podaci + galerija fajlova + generiši secret link.
6. **Public oglas (ograničen)** — sa CTA da se registruju za detalje.

Referentni vizuel: `/mnt/data/A_digital_screenshot_of_the_homepage_of_"Tražim_Ra.png` *(koristiti kao primerni vizuel; slika je u projektu za dizajnera/AI agenta)*

---

## 8) Acceptance criteria (što mora raditi da se PR proglasi gotovim)

* Registracija i verifikacija telefona funkcionišu za 3 test korisnika.
* Chatbot vodi kroz kompletan flow i validira polja.
* Oglas nakon unosa je dostupan samo poslodavcu i adminu.
* Tajni link prikazuje puni oglas; javni link prikazuje samo ograničene podatke.
* Upload slike i dokumenata radi; fajlovi su pohranjeni i dostupni kroz admin panel.
* Generisanje i resetovanje tajnog linka radi i linkovi nisu indeksirani.
* GDPR/Privacy checkbox i politike su prikazane pri registraciji.
* Minimalni sigurnosni testovi (TLS, basic pen-test) su prošli.

---

## 9) Plan rada i deliverables (preporuka za AI agenta)

**Faza 1 (1-2 sedmice)**

* Postaviti repo, infra, DB schema.
* Implementirati auth (email, OAuth, phone verify).
* Napraviti model oglasa i osnovni CRUD.

**Faza 2 (2-3 sedmice)**

* Implementirati chatbot flow + integraciju s LLM za copy.
* Uploadi fajlova + admin panel listanje.
* Tajni link logika + public/limited view.

**Faza 3 (1-2 sedmice)**

* UI polishing (desktop + mobile).
* Notifikacije (email/SMS).
* Testovi, bugfix.

**Deliverables:**

* Source code + deployment scripts
* Dokumentacija API (OpenAPI/Swagger)
* Admin i poslodavac korisničke upute
* Rudimentarni test plan i checklist

---

## 10) Data model (skica)

* `users` (id, name, email, phone, role, verified, created_at)
* `companies` (id, user_id, name, country, profile_public_fields, created_at)
* `jobs` (id, company_id, title, slug, description_full, description_public, salary, num_workers, housing, location, status, secret_token, secret_expires, created_at)
* `uploads` (id, job_id, type, url, uploaded_by, created_at)
* `messages` (id, job_id, from_user, to_user, content, attachments, created_at)
* `audit_logs` (id, user_id, action, target_type, target_id, ip, created_at)

---

## 11) QA test cases (primer)

* Kreiraj oglas kao registrovani poslodavac → javni link pokazuje samo ograničene podatke.
* Generiši tajni link → otvoriti u incognito: vidiš pune podatke.
* Resetuj tajni link → stari link više ne radi.
* Upload 5 slika → proveri da su dostupne u admin panelu.
* Registracija bez phone verify ne dozvoljava kreiranje oglasa.

---

## 12) Napomena za AI agenta (precizne instrukcije koje mu prosleđujete)

* **Ton i prioritet:** Fokusiraj se prvo na privatnost/vidljivost oglasa i robustan chatbot flow — to je key differentiator.
* **Obavezan test:** svaki secret link mora imati test koji proverava da nije indeksiran i da javni view ne prikazuje poverljive podatke.
* **Vizualna ref:** koristi sliku `/mnt/data/A_digital_screenshot_of_the_homepage_of_"Tražim_Ra.png` kao osnovu za stil (boje, raspored).
* **Dokumentacija:** obavezno isporučiti OpenAPI spec i minimalni deploy guide (Docker + env var).



Sjajno — beležim da će **chatbot da radi na ClaudeCode 4.5 Haiku**. Napravio sam konkretan dodatak PRD-u i tehnički vodič za AI agenta kako da integrišeš baš taj model (prompting, sigurnost, token handling, fallback, testovi). Kopiraj/nasledi ispod i prosledi AI agentu.

---

# Instrukcije za AI agenta — **Integracija Chatbota** (ClaudeCode 4.5 Haiku)

**Cilj:** implementirati konverzacijski chatbot koji vodi poslodavca kroz unos oglasa, prikuplja slike/dokumente i garantuje diskreciju (privatni / tajni link / javna ograničena verzija). Model: **ClaudeCode 4.5 Haiku**.

---

## 1) Referentni assets

* Referentni vizuel (koristiti za UI styling i primer upload forme):
  `/mnt/data/A_digital_screenshot_of_the_homepage_of_"Tražim_Ra.png`

---

## 2) Arhitektura integracije (visoko-level)

1. Frontend (Next.js) prikazuje floating chat widget.
2. Svaka nova sesija chatbota kreira `conversation_id` na backendu.
3. Frontend šalje poruke korisnika (text + metapodaci + upload reference) na backend endpoint `/api/chat/:jobId/message`.
4. Backend orkestrira pozive ka **ClaudeCode 4.5 Haiku** (LLM), vrši logiku validacije i persistira poruke + audit log.
5. Kad LLM zahteva upload fajla, frontend otvara modal za upload i vraća `upload_id`.
6. Backend čuva fajl u S3 i povezuje sa `job_id`.
7. Kada je flow kompletan, backend generiše oglas (short + long) i sprema `jobs` red u DB.

---

## 3) System / role prompts (ključne poruke koje šalješ modelu)

### System prompt (obavezno, jasno i kratko)

```
You are a discreet recruitment assistant for Tražim-Radnike.online. Use a professional, concise, and reassuring tone. Your job: guide the employer through creating a private job posting, collect necessary fields, request photos of workplace/housing, and confirm privacy options. Never expose or suggest making the posting public. Ask one question at a time. Validate required fields. If user gives incomplete info, ask for clarification. If user uploads files, request descriptions (what each picture shows). At the end, summarize all collected data and ask for confirmation to save.
```

### Few-shot / example assistant messages (behavioural)

* Greeting + privacy assurance:
  `Zdravo! Ja sam vaš diskretan asistent za regrutaciju. Svi podaci su poverljivi i neizlistani javno. Počnimo: koja je pozicija i koliko radnika tražite?`
* If missing salary:
  `Hvala. Možete li mi navesti očekivanu platu ili okvirni raspon u € mesečno?`
* Request photos:
  `Molim vas pošaljite 3 slike radnog prostora i 2 slike smeštaja (ako nudite). Ovo pomaže kandidatima i povećava stopu odgovora — fajlovi su poverljivi.`

---

## 4) Prompt engineering & constraints (praksa za Haiku model)

* **Ask one question at a time.** Do not present a long checklist in a single message.
* **Use short confirmations** after each critical field (e.g., `Potvrđujem: 5 zidara, plata 900 €/mesec, smeštaj — DA`).
* **Token budget:** Haiku varijante često imaju strožije token/latency tradeoffs — sačuvaj dugačke opise za backend generisanje (post proces).
* **Safety guardrails:** nikad ne traži ili prihvataj osjetljive lične podatke (npr. broj pasoša) kroz chat; za dokumente zahtevaj samo CV i radne reference. Flaguj pokušaje slanja ličnih ID dokumenata i blokiraj automatski.

---

## 5) Example API exchange (pseudo-kod)

**Frontend → Backend (user question)**
`POST /api/chat/:jobId/message`
Body:

```json
{
  "conversation_id":"conv_123",
  "from":"employer_77",
  "text":"Tražim 5 zidara za gradilište u Novom Sadu.",
  "attachments": []
}
```

**Backend → ClaudeCode 4.5 Haiku (system + user messages)**
Payload (pseudo):

```json
{
  "model":"claudecode-4.5-haiku",
  "messages":[
    {"role":"system","content":"<system prompt from above>"},
    {"role":"assistant","content":"Zdravo! ..."},
    {"role":"user","content":"Tražim 5 zidara za gradilište u Novom Sadu."}
  ],
  "max_tokens":800,
  "temperature":0.0
}
```

**Claude response (assistant)** → persisted and forwarded to frontend:

```
Hvala — koliko radnog iskustva tražite (godine)? Da li nudite smeštaj? Molim vas pošaljite 3 slike radnog okruženja i jednu sliku smeštaja.
```

---

## 6) Specific flows i pravila ponašanja chatbota

### A. Flow za kreiranje oglasa (minimalna polja)

1. Naziv pozicije
2. Broj radnika
3. Plata (ili raspon)
4. Mesto rada (grad/država)
5. Radno vreme / smene
6. Smeštaj (da/ne + opis)
7. Poželjno iskustvo / kvalifikacije
8. Jezici komunikacije
9. Upload: 3 slike radnog okruženja, 2 slike smeštaja (ako postoji)
10. Saglasnost za privatnost (checkbox na UI — backend dobija potvrdu)

### B. Pravila vidljivosti

* Nakon potvrde, oglas se sprema sa `visibility = private`.
* Backend automatski generiše `secret_token` (256-bit) i endpoint za tajni link.
* Javni endpoint vraća `description_public` koji je kraći i ne sadrži osjetljive detalje.

### C. Responzivnost i timeout

* Ako employer ne odgovori 72h, chatbot šalje friendly reminder.
* Ako tokom flowa mesec dana nema akcije — oglas prelazi u `stale` i admin dobija notifikaciju.

---

## 7) UI/UX detalji za chat widget

* Floating bubble (lower right), sa statusom: `Diskretan asistent: Online`.
* Indicator stepova (1/10) tokom kreiranja oglasa.
* Upload area with thumbnails + small caption field per file.
* On confirmation screen show: `Sačuvano kao PRIVATNO oglas. Da li želite da generišemo tajni link da biste ga podelili?` (Yes / No)

---

## 8) Sigurnost i pravna napomene koje model treba da naglašava

* Pri svakom početnom pozdravu model treba automatski uključiti kratku rečenicu o privatnosti:
  `Vaši podaci ostaju poverljivi; oglas nije javno indeksiran.`
* Ako korisnik pokušava da objavi lične podatke kandidata (pasoš, broj kartice, itd.) — asistent treba odbiti i dati alternativu: `Molimo pošaljite samo CV i reference; lični dokumenti se ne razmenjuju putem chata. Kontaktirajte nas za siguran kanal.`

---

## 9) Test plan za AI agenta / QA (bitne provjere)

* Scenario A: kreiranje potpunog oglasa — potvrdite da backend sprema sva polja i da `visibility=private`.
* Scenario B: generisanje tajnog linka — u incognito otvori link i potvrdi da vidiš kompletan oglas.
* Scenario C: javni link — potvrda da prikazuje samo `description_public` i da CTA vodi na login.
* Scenario D: upload security — pokušaj upload .exe ili potencijalno opasnog fajla → sistem odbacuje.
* Scenario E: GDPR checkbox — blokiraj kreiranje oglasa bez checkbox potvrde.

---

## 10) Sample assistant messages (srpski) za copy/paste u kod

* Greeting:
  `Zdravo! Ja sam vaš diskretan virtualni regruter. Počnimo sa osnovama: koja je tačna pozicija i koliko radnika vam treba?`

* Ask for salary:
  `Hvala — koji je očekivani iznos plate (ili raspon) u € mesečno?`

* Request images:
  `Molim vas da postavite 3 fotografije radnog mesta i 2 fotografije smeštaja (ako nudite). Ove slike su poverljive i pomažu nam da pronađemo odgovarajuće kandidate.`

* Confirm and finish:
  `Sažetak: [pozicija], [broj], [plata], [mesto], [smeštaj]. Potvrdite da želite da sačuvamo oglas kao PRIVATNO i da ga mi obradimo.`

---

## 11) Deliverables koje agent treba da isporuči

1. Implementiran chatbot flow (backend + sample frontend widget).
2. Postman collection / OpenAPI minimal spec za chat endpoints.
3. Test report (QA scenariji iznad).
4. Kratka dokumentacija za operatera: kako generisati/rekonsumirati tajne linkove, kako resetovati token i pregled audit loga.

