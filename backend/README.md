# LeagueMate — Backend

Backend REST per la gestione di tornei amatoriali di calcio a girone all'italiana.

> Questo backend è stato sviluppato originariamente nel repository [LeagueMate-API](https://github.com/Barbagallo2296/LeagueMate-API) e fa ora parte del monorepo LeagueMate.
> Per avviare l'intero progetto (database, backend, frontend e AI) vedi il [README principale](../README.md).


## Tecnologie

| Stack | Versione |
|---|---|
| Java | 21 |
| Spring Boot | 4.1.0 |
| Spring Security | 7.x |
| Spring Data JPA / Hibernate | 7.x |
| MySQL | 8.x |
| H2 (solo test) | in memoria |
| Spring Authorization Server | 7.1.x (parte di Spring Security) |
| Spring OAuth2 Resource Server | 7.1.x |
| Flyway | 12.x |
| Spring Boot Actuator | 4.1.x |
| springdoc-openapi (Swagger UI) | 3.1.x |
| Bucket4j | 8.x |
| Testcontainers | 2.x |
| Ollama + modello `qwen3.5:4b` (AI locale) | ultima immagine `ollama/ollama` |
| Lombok | 1.18.x |
| JaCoCo | 0.8.12 |
| Maven | 3.x |

---

## Architettura

Struttura MVC a tre layer rigorosi:

```
Controller → Service (interfaccia + impl) → Repository
```
```

src/main/java/com/leaguemate/api/
│
├── controller/ # Endpoint REST
├── service/ # Interfacce di business logic
│ └── impl/ # Implementazioni
├── repository/ # Interfacce Spring Data JPA
├── entity/ # Entity JPA su MySQL
├── config/ # Configurazione OpenAPI
├── dto/ # Java Records (input/output)
├── mapper/ # Conversione Entity → DTO, in un unico punto
├── security/ # Authorization Server, token opachi, SecurityConfig, ownership di tornei e squadre
├── exception/ # Handler eccezioni
└── ai/ # Funzionalità AI
    ├── client/ # AiClient: Ollama, servizi compatibili OpenAI, AI disattivata
    ├── recap/ # Cronaca della giornata: fatti, generazione in background
    └── assistant/ # Assistente del torneo: tool, ciclo agentico, rate limit

src/main/resources/db/
├── migration/ # Schema versionato Flyway (V1, V2, V3...)
└── demo/ # Dati di esempio (migrazione ripetibile, solo su richiesta)
```

I mapper sono classi statiche senza stato. I service restituiscono un DTO quando la conversione legge associazioni LAZY (es. `TeamMemberService`, `UserService.getProfile`), perché con `open-in-view=false` deve avvenire dentro la transazione; negli altri casi restituiscono l'entity e la conversione avviene nel controller.


### Moduli funzionali

| Modulo | Controller | Service | Descrizione |
|---|---|---|---|
| **Auth** | `AuthController` | `AuthService` | Registrazione, login, rinnovo e revoca dei token |
| **User** | `UserController` | `UserService` | Gestione utenti, ruoli e profilo (`@OneToOne`) |
| **Tournament** | `TournamentController` | `TournamentService` | CRUD tornei, iscrizioni, calendario, classifica, statistiche, co-organizzatori |
| **Team** | `TeamController` | `TeamService` | CRUD squadre con proprietario |
| **TeamMember** | `TeamMemberController` | `TeamMemberService` | Membri delle squadre con ruoli |
| **Match** | `MatchController` | `MatchService` | Risultati delle partite |
| **Cronaca AI** | `RoundRecapController` | `RoundRecapService` | Cronaca della giornata scritta dall'AI |
| **Assistente AI** | `AssistantController` | `TournamentAssistantService` | Domande in linguaggio naturale sul torneo |

> **Nessuna Entity JPA viene esposta nelle risposte API.** Tutti i controller restituiscono esclusivamente DTO (Java Records), isolando completamente il modello di persistenza dal contratto REST.

---

## Data Layer

### Relazioni JPA — tutte e quattro le tipologie

| Tipo | Entità | Note |
|---|---|---|
| `@OneToOne` | `User` ↔ `UserProfile` | FK su `UserProfile`, esposta via `/api/users/{id}/profile` |
| `@OneToOne` | `AiRoundRecap` → `Round` | Una cronaca AI per giornata, FK unica su `ai_round_recaps` con `ON DELETE CASCADE` |
| `@ManyToOne / @OneToMany` | `Tournament` → `Round` → `Match` | Tutte LAZY |
| `@ManyToMany`  | `Tournament` ↔ `User` (co-organizzatori) | `@JoinTable` su `tournament_organizers` — la relazione non porta attributi propri |
| `@ManyToMany`  | `User` ↔ `Team` tramite `TeamMember` | Attributi: `teamRole`, `joinedAt` |
| `@ManyToMany`  | `Tournament` ↔ `Team` tramite `TournamentRegistration` | Attributi: `status`, `registeredAt` |

**Scelta progettuale:** dove la relazione N:N porta attributi propri si usa un'entità di giunzione (modellazione corretta); dove non ne porta si usa `@ManyToMany` pura con `@JoinTable`. Nel progetto c'è una sola `@ManyToMany` pura (torneo-organizzatori); le altre due N:N sono modellate con entità di giunzione.

### Elementi avanzati JPA

| Elemento | Dove | Perché |
|---|---|---|
| `FetchType.LAZY` | Tutte le relazioni `@ManyToOne` e `@ManyToMany` | Evita query non necessarie |
| **JPQL con `@Query` + `@Param`** | `MatchRepository`, `TournamentRepository`, `TournamentRegistrationRepository`, `TeamMemberRepository` | Query esplicite e type-safe |
| **`JOIN FETCH`** | `findCompletedMatchesWithTeams()`, `findByRoundIdWithTeams()`, `findConfirmedWithTeams()`, `findByIdWithTeams()`, `findByTeamIdWithUserAndTeam()` | **Risolve problemi N+1 reali** nel calcolo della classifica e nell'elenco dei membri |
| **Query di aggregazione (`COUNT`, `GROUP BY`)** | `countByStatus()` (proiezione a interfaccia), `countMatchesByTournamentAndStatus()`, `countByRole()` | Statistiche e regole di dominio |
| **Query derivate dal nome** | `existsByTeamIdAndUserId()`, `existsByUsername()`, `countByRole()` | Controlli senza caricare intere tabelle |
| **`@EntityGraph`** | `findWithRegistrationsById()` | Fetch dichiarativo, usato nell'iscrizione delle squadre |

### Schema del database (Flyway)

Lo schema è gestito **solo da Flyway**: ogni modifica è una migrazione versionata in `db/migration` (`V1__init_schema.sql`, `V2__limit_profile_bio_length.sql`, `V3__add_double_round_robin.sql`, `V4__oauth2_authorizations.sql`, `V5__add_team_owner.sql`, `V6__ai_round_recaps.sql`). Hibernate gira con `ddl-auto=validate`: non modifica mai il database e all'avvio verifica che le entity corrispondano alle tabelle.

- I **test di integrazione** applicano le stesse migrazioni su H2, quindi girano sullo schema reale.
- I **dati demo** (`db/demo/R__demo_data.sql`) si caricano solo aggiungendo `classpath:db/demo` a `FLYWAY_LOCATIONS`, come fa il `docker-compose.yml` nella cartella principale del repository.
- Un database creato prima di Flyway viene registrato come versione 1 (`baseline-on-migrate`) e riceve solo le migrazioni successive.

### Configurazione JPA

`spring.jpa.open-in-view=false` — disattivato di proposito. La sessione Hibernate non resta aperta durante la serializzazione della risposta: ogni endpoint carica esplicitamente le associazioni necessarie tramite `JOIN FETCH` o `@EntityGraph`, evitando accessi lazy nascosti fuori dalla transazione.

### Entity

- **User** — implementa `UserDetails`, ruoli enum (`ADMIN`, `ORGANIZER`, `USER`)
- **UserProfile** — dati aggiuntivi (bio, avatar, telefono), relazione `@OneToOne`
- **Team** — squadra con proprietario (`@ManyToOne` verso `User`), membri e iscrizioni
- **TeamMember** — giunzione ricca User↔Team con `TeamRole` (CAPTAIN/PLAYER/RESERVE) e `joinedAt`
- **Tournament** — torneo con stagione, stato, configurazione punti, formula (sola andata o andata e ritorno) e **co-organizzatori**
- **TournamentRegistration** — giunzione ricca Tournament↔Team con `RegistrationStatus` e `registeredAt`
- **Round** — giornata del torneo
- **Match** — partita con squadra casa/trasferta, score e stato
- **AiRoundRecap** — cronaca AI di una giornata (`@OneToOne` verso `Round`): stato `PENDING`/`READY`/`FAILED`, testo, modello, data di generazione, eventuale errore

---

## Funzionalità principali

### Generazione calendario (round-robin, metodo del cerchio)
`generateRounds()` genera il calendario all'italiana con il **metodo del cerchio** (circle method), che produce lo stesso calendario delle tabelle di Berger: una squadra resta fissa e le altre ruotano attorno a essa. Con N squadre genera N-1 giornate da N/2 partite, e ogni coppia si incontra esattamente una volta. Gestisce il numero dispari con un turno di riposo e alterna casa/trasferta fra le giornate. Se il torneo è creato con `"doubleRoundRobin": true`, dopo l'andata genera il **girone di ritorno**: stesse giornate nello stesso ordine, con casa e trasferta invertite (N squadre → 2(N-1) giornate). La generazione è consentita **solo in stato `DRAFT`**, per non cancellare risultati già registrati.

### Calcolo classifica dinamico (Stream API + JOIN FETCH)
`calculateStandings()` calcola la classifica in tempo reale dalle partite `COMPLETED`, senza persisterla: non può mai andare fuori sincrono con i risultati. Usa un accumulatore tipizzato `TeamStats` (niente indici magici) e ordina per punti, differenza reti, gol fatti e nome.

```java
return table.values().stream()
    .map(TeamStats::toEntry)
    .sorted(Comparator.comparingInt(StandingEntry::points).reversed()
        .thenComparing(Comparator.comparingInt(StandingEntry::goalDifference).reversed())
        .thenComparing(Comparator.comparingInt(StandingEntry::goalsFor).reversed())
        .thenComparing(StandingEntry::teamName))
    .toList();
```

### Statistiche del torneo
`getTournamentStats()` aggrega squadre iscritte, partite giocate/rimanenti, gol totali, media gol a partita e miglior attacco. Il conteggio delle partite per stato è una sola query `GROUP BY` con proiezione a interfaccia, e la classifica viene calcolata una sola volta e riutilizzata. Il miglior attacco resta vuoto finché non viene segnato almeno un gol.

### Validazioni di dominio
- Le squadre possono essere iscritte **solo a tornei in stato `DRAFT`**
- Il calendario può essere generato **solo in stato `DRAFT`**
- Un torneo `COMPLETED` non può essere modificato
- Un torneo `ACTIVE` non può essere eliminato
- I risultati si inseriscono solo in un torneo `ACTIVE`
- Un torneo si chiude (`ACTIVE → COMPLETED`) solo quando tutte le partite sono state giocate; da quel momento i risultati sono bloccati
- Non è possibile declassare l'ultimo `ADMIN` rimasto
- I punti per vittoria e pareggio si modificano solo in stato `DRAFT`: dopo l'avvio si possono cambiare solo nome e stagione
- Un pareggio non può valere più punti di una vittoria
- Solo un utente con ruolo `ORGANIZER` o `ADMIN` può diventare co-organizzatore di un torneo, e l'ultimo organizzatore rimasto non può essere rimosso
- Chi crea una squadra ne diventa proprietario ed entra fra i membri come `CAPTAIN`

---

## Funzionalità AI

Il backend integra un modello linguistico **locale** (Ollama con `qwen3.5:4b`) con due funzioni:

1. **Cronaca della giornata**: quando l'ultima partita di una giornata viene registrata, l'AI scrive in background un breve articolo in stile quotidiano sportivo.
2. **Assistente del torneo**: si fanno domande in linguaggio naturale ("Quando gioca Straw Hat FC?", "Chi ha il miglior attacco?") e l'AI risponde consultando i dati del torneo tramite **tool calling**.

Tutto il codice è nel package `ai/` e non usa librerie AI: le chiamate HTTP sono fatte con il `RestClient` di Spring, per avere pieno controllo sul JSON inviato (per esempio `"think": false`) ed evitare dipendenze non ancora compatibili con Spring Boot 4.1.

### Principio: i fatti li scrive il backend

**L'LLM non riceve mai numeri grezzi da interpretare.** Nei test preliminari i modelli piccoli, ricevendo dati come `home_score: 3, away_score: 2`, invertivano i risultati o sbagliavano chi aveva vinto. Per questo il backend calcola tutto (esiti, classifica, statistiche) e passa al modello frasi già scritte in italiano:

```
Giornata 4 di 7 del torneo New World League.

RISULTATI:
- Blackbeard City batte Big Mom Pirates 1-0 (vittoria in trasferta)
- Marine Ford batte Red Hair United 2-0 (vittoria in casa)
- Heart Pirates batte Kid Pirates 3-2 (vittoria in trasferta)
- Straw Hat FC batte Whitebeard Rovers 2-0 (vittoria in trasferta)

CLASSIFICA DOPO LA GIORNATA:
1. Straw Hat FC 10 punti (3 vittorie, 1 pareggio, 0 sconfitte)
2. Marine Ford 10 punti (3 vittorie, 1 pareggio, 0 sconfitte)
...

DA SEGNALARE:
- Capolista a pari punti: Straw Hat FC e Marine Ford (10 punti)
- Miglior attacco: Straw Hat FC (8 gol)
- Peggior difesa: Kid Pirates (8 gol subiti)
- Ancora imbattute: Straw Hat FC e Marine Ford
- Ancora senza vittorie: Whitebeard Rovers
- Mancano 12 partite alla fine

PROSSIMA GIORNATA:
- Marine Ford - Big Mom Pirates
...
```

Chi vince è sempre scritto per primo con il proprio punteggio, i plurali sono corretti ("1 punto", "3 punti") e le parità in testa vengono dichiarate esplicitamente. All'AI resta solo il compito di raccontare. Lo stesso principio vale per l'assistente: ogni partita giocata restituita dai tool contiene anche il risultato già scritto a parole.

Per lo stesso motivo il **titolo** della cronaca non è chiesto al modello (nelle prove lo ometteva o lo inventava): il frontend mostra un titolo fisso "Giornata N · Nome torneo" e l'AI scrive solo i due paragrafi.

### Cronaca della giornata (in background)

```
PUT /api/matches/{id}/result
  └─ MatchServiceImpl salva il risultato
       └─ nessuna partita SCHEDULED nella giornata? → pubblica RoundCompletedEvent
            └─ risposta immediata all'organizzatore (l'AI non viene attesa)

dopo il commit della transazione, su un thread dedicato:
RecapGenerationListener (@TransactionalEventListener AFTER_COMMIT + @Async)
  └─ RoundRecapService: riga in PENDING → RoundFactsBuilder → AI → READY oppure FAILED
```

- `RoundFactsBuilder` costruisce i fatti riusando `TournamentService`, compresa `calculateStandingsUpToRound`: la classifica è quella **alla fine di quella giornata**, anche se ne sono già state giocate di successive.
- Le cronache sono salvate nella tabella `ai_round_recaps` (una per giornata). Se un risultato di una giornata già raccontata viene modificato, la cronaca viene rigenerata.
- L'executor `aiExecutor` ha **un solo thread** (Ollama elabora comunque una richiesta alla volta) e una coda di 20 richieste.
- All'avvio, eventuali cronache rimaste `PENDING` per un riavvio vengono portate a `FAILED`, così possono essere rigenerate.
- Il testo viene ripulito da eventuale markdown (`**`, `#`) prima del salvataggio.

### Assistente del torneo (tool calling)

L'assistente è un piccolo agente: il modello riceve la domanda e la descrizione di 4 tool, decide quale usare, il backend lo esegue e gli restituisce il risultato; il ciclo si ripete per **massimo 4 passaggi**, dopo i quali un'ultima chiamata senza tool obbliga il modello a rispondere.

| Tool | Restituisce |
|---|---|
| `get_standings()` | classifica attuale |
| `get_tournament_stats()` | squadre, partite giocate e da giocare, gol, media gol, miglior attacco |
| `get_round(round_number)` | partite di una giornata con il risultato scritto o "da giocare" |
| `get_team_matches(team_name)` | tutte le partite di una squadra (i nomi ammessi sono passati come `enum` nello schema) |

- I tool sono **solo in lettura** e sempre vincolati al torneo dell'URL: il modello non può leggere altri tornei né modificare dati.
- Argomenti non validi, squadre inesistenti o giornate fuori intervallo producono un JSON `{"error": "..."}` restituito al modello, non un'eccezione.
- Il nome della squadra è confrontato senza distinzione di maiuscole.
- **Rate limit**: 10 domande al minuto per utente (Bucket4j, configurabile), oltre le quali la risposta è `429 Too Many Requests` con header `Retry-After`.
- La risposta è un normale JSON, non in streaming:

```json
{ "status": "OK", "answer": "Straw Hat FC gioca la giornata 5 in casa contro Heart Pirates.", "toolsUsed": ["get_team_matches"], "message": null }
```

### Prompt e parametri del modello

| Parametro | Valore |
|---|---|
| Modello | `qwen3.5:4b` (configurabile con `AI_MODEL`) |
| Ragionamento | disattivato con `"think": false`; se il modello non supporta il campo, la richiesta viene ripetuta senza |
| `num_ctx` / `temperature` | 4096 / 0.4 |
| Lunghezza massima della risposta | 400 token per la cronaca, 300 per l'assistente |

I system prompt sono in `RoundRecapService.SYSTEM_PROMPT` e `TournamentAssistantService.SYSTEM_PROMPT`. Quello della cronaca chiede di usare solo i fatti forniti, di non inventare marcatori, minuti, giocatori, date o episodi, e di scrivere 2 paragrafi senza titolo né markdown (massimo 120 parole). Quello dell'assistente viene compilato con nome del torneo, elenco delle squadre e giornate giocate.

### L'app funziona anche senza AI

Se Ollama è spento, lento, il modello non è ancora scaricato oppure `AI_ENABLED=false`:

- tutti gli altri endpoint funzionano normalmente e il backend parte comunque (anche con un `AI_PROVIDER` non valido, che disattiva solo l'AI con un errore nel log);
- la cronaca va in stato `FAILED` con un messaggio breve, e il `GET` restituisce sempre 200;
- l'assistente risponde 200 con `"status": "UNAVAILABLE"` e un messaggio leggibile;
- nessuna funzione AI restituisce mai un `500`.

### Configurazione dell'AI

| Profilo | Come | Quando |
|---|---|---|
| **Ollama nel docker compose** (default) | nessuna configurazione | funziona ovunque, su CPU |
| **Ollama nel compose con GPU NVIDIA** | `docker compose -f docker-compose.yml -f docker-compose.gpu.yml up --build` | PC con scheda NVIDIA e Docker con supporto GPU |
| **Ollama installato sul PC** | `AI_BASE_URL=http://host.docker.internal:11434` | Mac con chip Apple (Ollama nativo usa la GPU Metal) o chi ha già Ollama |
| **Servizio online compatibile OpenAI** | `AI_PROVIDER=openai`, `AI_BASE_URL=https://openrouter.ai/api/v1`, `AI_API_KEY=...`, `AI_MODEL=<modello del servizio>` | OpenRouter, OpenAI, Groq e simili |

Il servizio `ollama-init` del compose scarica il modello al primo avvio (circa **3,4 GB**, una sola volta: resta nel volume `ollama_data`) e lo carica in memoria, così anche la prima richiesta è veloce. Il backend non lo aspetta: parte subito e le funzioni AI si attivano appena il modello è pronto. Per seguire il download: `docker compose logs -f ollama-init`.

Il servizio `ollama` non espone porte sull'host: lo raggiunge solo il backend dalla rete interna di Docker.

### Requisiti e tempi misurati

- Circa **3,4 GB** di disco per il modello e almeno **6 GB di RAM** assegnati a Docker.
- Su PC poco potenti si può usare `AI_MODEL=qwen3.5:2b`.

| | Con GPU (RTX 3070) | Solo CPU |
|---|---|---|
| Cronaca | 3-25 s | circa 25 s |
| Assistente | circa 1 s | circa 20 s |

### Limiti noti

- Il modello è piccolo: lo stile delle cronache varia da una generazione all'altra (circa 120-180 parole) e a volte aggiunge frasi di colore non presenti nei fatti. I risultati delle partite, scritti dal backend, sono riportati correttamente.
- Quando l'assistente fa confronti numerici da solo (per esempio "quanti gol in meno") può sbagliare il calcolo, anche se i dati ricevuti dai tool sono corretti.
- Se una rigenerazione fallisce, la cronaca va in `FAILED` ma conserva il testo precedente, che il frontend può decidere se mostrare.

---

## Sicurezza

- Autenticazione con **Spring Authorization Server**: al login vengono emessi un **access token opaco** (una stringa casuale senza dati, valida 15 minuti) e un **refresh token** (valido 7 giorni). Le durate sono configurabili con `ACCESS_TOKEN_TTL` e `REFRESH_TOKEN_TTL`
- **Rotazione dei refresh token**: ogni rinnovo emette una nuova coppia e invalida quella precedente (`reuseRefreshTokens=false` nelle `TokenSettings` del client registrato)
- **Token salvati solo come hash SHA-512**, come in Django Knox: `HashedOAuth2AuthorizationService` implementa l'`OAuth2AuthorizationService` dell'Authorization Server e nel database (tabella `oauth2_authorizations`) non scrive mai il token in chiaro
- **Revoca immediata**: `logout` elimina la sessione corrente, `logout-all` tutte le sessioni dell'utente su ogni dispositivo
- Il backend è anche **Resource Server**: ogni richiesta con `Authorization: Bearer <token>` è verificata da `StoredTokenIntrospector`, che legge l'autorizzazione direttamente dal database (nessuna chiamata HTTP) e controlla scadenza ed esistenza dell'utente
- Le autorizzazioni scadute vengono eliminate ogni ora da un task programmato (`ExpiredTokenCleanup`)
- Password hashate con **BCrypt**
- Autorizzazione **per ruolo** (RBAC) tramite `@PreAuthorize` e `@EnableMethodSecurity`
- Autorizzazione **a livello di risorsa**: un utente può modificare solo il proprio profilo, un `ADMIN` qualsiasi profilo
- **Ownership dei tornei**: chi crea un torneo ne diventa organizzatore; un `ORGANIZER` può gestire (modifica, iscrizioni, calendario, risultati, chiusura, co-organizzatori) **solo i tornei di cui è organizzatore**, tramite il bean `TournamentSecurity` usato nelle espressioni `@PreAuthorize`. Un `ADMIN` può gestire qualsiasi torneo
- **Ownership delle squadre**: chi crea una squadra ne diventa proprietario e capitano; modificarla e gestirne i membri è consentito solo al proprietario o a un `ADMIN`, tramite il bean `TeamSecurity`. Qualsiasi utente autenticato può creare la propria squadra
- Richiesta senza token → `401`; autenticato ma senza permessi → `403` (`AuthenticationEntryPoint` e `AccessDeniedHandler` dedicati)
- L'email di un utente e il numero di telefono del suo profilo sono visibili solo all'utente stesso o a un `ADMIN`
- Messaggi di errore generici in fase di login per prevenire la *user enumeration*
- **Rate limit sul login** (`LoginRateLimitFilter`, Bucket4j): 10 tentativi al minuto per IP, oltre i quali la risposta è `429 Too Many Requests` con header `Retry-After`. Configurabile con `LOGIN_RATE_LIMIT_CAPACITY` e `LOGIN_RATE_LIMIT_PERIOD`. Dietro un reverse proxy l'IP reale viene letto da `X-Forwarded-For` (`server.forward-headers-strategy=native`: Tomcat si fida solo dei proxy interni, quindi un client esterno non può falsificarlo), e i contatori inattivi vengono eliminati periodicamente
- **Rate limit sull'assistente AI** (`AssistantRateLimiter`, Bucket4j): 10 domande al minuto **per utente**, oltre le quali la risposta è `429` con `Retry-After`. Configurabile con `AI_ASSISTANT_RATE_LIMIT_CAPACITY` e `AI_ASSISTANT_RATE_LIMIT_PERIOD`
- **Tool dell'assistente in sola lettura**, vincolati al torneo dell'URL: il modello non può leggere altri tornei né modificare dati
- **CORS** abilitato per il frontend: le origini ammesse si configurano con `CORS_ALLOWED_ORIGINS` (separate da virgola; default `http://localhost:5173,http://localhost:3000`, le porte di sviluppo di Vite e Create React App)

---

## Gestione Errori

`@RestControllerAdvice` centralizzato, con formato di risposta coerente su tutta l'API:

| Eccezione | HTTP Status |
|---|---|
| `MethodArgumentNotValidException` | `400 Bad Request` |
| `HttpMessageNotReadableException` (JSON malformato) | `400 Bad Request` |
| `MethodArgumentTypeMismatchException` (path variable non valido) | `400 Bad Request` |
| `AuthenticationException` | `401 Unauthorized` |
| `AccessDeniedException` | `403 Forbidden` |
| `ResourceNotFoundException`, `NoResourceFoundException` | `404 Not Found` |
| `HttpRequestMethodNotSupportedException` | `405 Method Not Allowed` |
| `ResourceConflictException`, `DataIntegrityViolationException` | `409 Conflict` |
| `HttpMediaTypeNotSupportedException` | `415 Unsupported Media Type` |
| `TooManyRequestsException` (rate limit dell'assistente, con `Retry-After`) | `429 Too Many Requests` |
| `Exception` (fallback, con stack trace nei log) | `500 Internal Server Error` |

Gli errori che nascono nella filter chain di Spring Security (token non valido, token mancante, accesso negato a livello URL) avvengono prima del `DispatcherServlet` e non sono intercettabili dal `@RestControllerAdvice`: li scrive `SecurityErrorResponse`, con lo stesso formato JSON.

---

## Endpoint REST — 41 totali

Le liste di tornei, squadre e utenti sono **paginate**: `?page=0&size=20&sort=name,asc` (default 20 elementi, massimo 100). La risposta ha la forma `{ "content": [...], "page": { "size", "number", "totalElements", "totalPages" } }`. Il parametro `sort` accetta solo i campi ammessi da ciascun endpoint; un campo diverso restituisce `400`.

### Auth (5)
| Metodo | Endpoint | Accesso |
|---|---|---|
| POST | `/api/auth/register` | Pubblico |
| POST | `/api/auth/login` | Pubblico — restituisce `access_token`, `refresh_token`, `token_type`, `expires_in` |
| POST | `/api/auth/refresh` | Pubblico — body `{"refresh_token": "..."}`, restituisce una nuova coppia |
| POST | `/api/auth/logout` | Autenticato — revoca la sessione corrente |
| POST | `/api/auth/logout-all` | Autenticato — revoca tutte le sessioni dell'utente |

### Utenti (6)
| Metodo | Endpoint | Accesso |
|---|---|---|
| GET | `/api/users/me` | Autenticato |
| GET | `/api/users` | **ADMIN** |
| GET | `/api/users/{id}` | Autenticato |
| PUT | `/api/users/{id}/role` | **ADMIN** |
| GET | `/api/users/{id}/profile` | Autenticato — il telefono è visibile solo al proprietario o a un **ADMIN** |
| PUT | `/api/users/{id}/profile` | Proprietario o **ADMIN** |

### Tornei (14)
| Metodo | Endpoint | Accesso |
|---|---|---|
| POST | `/api/tournaments` | **ADMIN / ORGANIZER** |
| GET | `/api/tournaments` | Autenticato |
| GET | `/api/tournaments/mine` | Autenticato — tornei di cui l'utente è organizzatore |
| GET | `/api/tournaments/{id}` | Autenticato |
| GET | `/api/tournaments/status/{status}` | Autenticato |
| PUT | `/api/tournaments/{id}` | **ADMIN / organizzatore del torneo** |
| DELETE | `/api/tournaments/{id}` | **ADMIN** |
| POST | `/api/tournaments/{id}/register-team/{teamId}` | **ADMIN / organizzatore del torneo** |
| POST | `/api/tournaments/{id}/generate-rounds` | **ADMIN / organizzatore del torneo** |
| POST | `/api/tournaments/{id}/complete` | **ADMIN / organizzatore del torneo** |
| GET | `/api/tournaments/{id}/standings` | Autenticato |
| GET | `/api/tournaments/{id}/stats` | Autenticato |
| GET | `/api/tournaments/{id}/rounds` | Autenticato — calendario completo: giornate con le partite |
| GET | `/api/tournaments/{id}/teams` | Autenticato — squadre iscritte |

### Co-organizzatori — `@ManyToMany` (3)
| Metodo | Endpoint | Accesso |
|---|---|---|
| POST | `/api/tournaments/{id}/organizers/{userId}` | **ADMIN / organizzatore del torneo** |
| GET | `/api/tournaments/{id}/organizers` | Autenticato |
| DELETE | `/api/tournaments/{id}/organizers/{userId}` | **ADMIN / organizzatore del torneo** |

### Squadre (5)
| Metodo | Endpoint | Accesso |
|---|---|---|
| POST | `/api/teams` | Autenticato — chi crea diventa proprietario e capitano |
| GET | `/api/teams` | Autenticato |
| GET | `/api/teams/{id}` | Autenticato |
| PUT | `/api/teams/{id}` | **ADMIN / proprietario della squadra** |
| DELETE | `/api/teams/{id}` | **ADMIN** |

### Membri delle squadre (3)
| Metodo | Endpoint | Accesso |
|---|---|---|
| POST | `/api/teams/{teamId}/members` | **ADMIN / proprietario della squadra** |
| GET | `/api/teams/{teamId}/members` | Autenticato |
| DELETE | `/api/teams/{teamId}/members/{memberId}` | **ADMIN / proprietario della squadra** |

### Partite (2)
| Metodo | Endpoint | Accesso |
|---|---|---|
| PUT | `/api/matches/{id}/result` | **ADMIN / organizzatore del torneo** — se completa la giornata, avvia la cronaca AI |
| GET | `/api/matches/round/{roundId}` | Autenticato |

### AI (3)
| Metodo | Endpoint | Accesso |
|---|---|---|
| GET | `/api/tournaments/{id}/rounds/{roundNumber}/recap` | Autenticato — `{ status, content, model, generatedAt }`, con `status` fra `READY`, `PENDING`, `FAILED`, `NOT_AVAILABLE`; sempre `200` per una giornata esistente, `404` altrimenti |
| POST | `/api/tournaments/{id}/rounds/{roundNumber}/recap` | **ADMIN / organizzatore del torneo** — rigenera in background, `202 Accepted`; `409` se la giornata non è completa o l'AI è disattivata |
| POST | `/api/tournaments/{id}/assistant` | Autenticato — body `{"question": "..."}` (1-300 caratteri), risposta `{ status, answer, toolsUsed, message }` con `status` `OK` o `UNAVAILABLE`; `429` oltre il rate limit |

---

## Documentazione API e health check

- **Swagger UI**: `http://localhost:8080/swagger-ui.html` — documentazione interattiva di tutti gli endpoint. Con il pulsante *Authorize* si incolla l'`access_token` ottenuto dal login. Disattivabile con `SWAGGER_ENABLED=false`.
- **Specifica OpenAPI**: `http://localhost:8080/v3/api-docs`
- **Health check**: `http://localhost:8080/actuator/health` — pubblico, restituisce solo `{"status":"UP"}`. Nessun altro endpoint di Actuator è esposto.
- **Collection Postman**: `docs/LeagueMate-API.postman_collection.json` nella cartella principale del repository.

---

## Avvio con Docker (consigliato)

Il `docker-compose.yml` e il file `.env.example` si trovano nella **cartella principale del repository**: i comandi seguenti vanno lanciati da lì, non da `backend/`.

```bash
docker compose up --build
```

Nessuna configurazione è obbligatoria: ogni variabile ha un valore predefinito. Per personalizzarle (password MySQL, durata dei token, porte) si copia `.env.example` in `.env`:

```bash
cp .env.example .env
```

| Variabile | Default | Uso |
|---|---|---|
| `DB_PORT` / `API_PORT` | `3306` / `8080` | Porte esposte sulla macchina (per esempio `DB_PORT=3307` se c'è già un MySQL locale) |
| `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` | `root`, `leaguemate_db`, `leaguemate_user`, `leaguemate_pass` | Credenziali del database |
| `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL` | `15m` / `7d` | Durata dei token |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Origini del frontend ammesse |
| `LOGIN_RATE_LIMIT_CAPACITY` / `LOGIN_RATE_LIMIT_PERIOD` | `10` / `1m` | Tentativi di login consentiti per IP |
| `SWAGGER_ENABLED` | `true` | Abilita Swagger UI e la specifica OpenAPI |
| `AI_ENABLED` | `true` | Con `false` le funzioni AI rispondono "non disponibile" e Ollama non viene mai chiamato |
| `AI_PROVIDER` | `ollama` | `ollama` (API nativa di Ollama) oppure `openai` (qualsiasi servizio compatibile OpenAI) |
| `AI_BASE_URL` | `http://ollama:11434` | Indirizzo del servizio AI: il container `ollama`, `http://host.docker.internal:11434` per un Ollama installato sul PC, oppure per esempio `https://openrouter.ai/api/v1` |
| `AI_MODEL` | `qwen3.5:4b` | Modello da usare (scaricato automaticamente da `ollama-init`); `qwen3.5:2b` per PC poco potenti |
| `AI_API_KEY` | vuota | Chiave del servizio online (solo con `AI_PROVIDER=openai`) |
| `AI_CONNECT_TIMEOUT` / `AI_READ_TIMEOUT` | `5s` / `180s` | Attesa massima per collegarsi al servizio AI e per ricevere la risposta |
| `AI_ASSISTANT_RATE_LIMIT_CAPACITY` / `AI_ASSISTANT_RATE_LIMIT_PERIOD` | `10` / `1m` | Domande all'assistente consentite per utente |

Con una GPU NVIDIA si può far usare la scheda video a Ollama aggiungendo il secondo file di compose:

```bash
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up --build
```

Lo stesso comando avvia MySQL 8, Ollama e il backend, insieme agli altri servizi del progetto descritti nel README principale. Al primo avvio `ollama-init` scarica il modello (circa 3,4 GB); il backend parte subito e le funzioni AI si attivano appena il modello è pronto (vedi [Funzionalità AI](#funzionalità-ai)). All'avvio Flyway applica le migrazioni dello schema e carica i dati demo. Il Dockerfile scarica le dipendenze Maven in un layer separato (le build successive riusano la cache se il `pom.xml` non cambia), l'applicazione gira con un utente non-root e il container ha un `HEALTHCHECK` sull'endpoint di Actuator. Il build è multi-stage (Maven → JRE), MySQL ha un healthcheck e l'app attende che sia pronto.

### Utenti precaricati

Tutti con password `password123`:

| Username | Ruolo |
|---|---|
| `manuel22` | ADMIN |
| `law_organizer` | ORGANIZER |
| `shanks_player` | USER |
| `zoro_player` | USER |

Ogni squadra demo ha come proprietario il suo capitano: `manuel22` (Straw Hat FC), `law_organizer` (Heart Pirates e Blackbeard City), `shanks_player` (Red Hair United). I tornei di esempio sono due, entrambi con `law_organizer` come organizzatore:

- **Grand Line Cup** (id 1) — stato `DRAFT` con 4 squadre iscritte: è possibile lanciare subito `generate-rounds` e vedere il calendario generato dal metodo del cerchio.
- **New World League** (id 2) — stato `ACTIVE` con 8 squadre (alle 4 precedenti si aggiungono Marine Ford, Kid Pirates, Whitebeard Rovers e Big Mom Pirates, di proprietà di `law_organizer`) e 7 giornate. Le giornate 1-3 sono giocate; nella giornata 4 manca solo **Whitebeard Rovers - Straw Hat FC** (partita con id `116`): inserendo quel risultato la giornata si completa e parte la cronaca AI. Le giornate 1-3 non hanno ancora una cronaca e si possono generare con il `POST` di rigenerazione.

Per ripartire dai dati demo originali: `docker compose down` e poi `docker volume rm leaguemate_mysql_data` (il modello AI, nel volume `leaguemate_ollama_data`, resta scaricato).

---

## Avvio in locale

### Prerequisiti
Java 21, Maven 3.x, MySQL 8.x

Ogni proprietà in `application.properties` è sovrascrivibile da variabile d'ambiente e ha un valore predefinito per lo sviluppo locale:

```properties
spring.datasource.url=${SPRING_DATASOURCE_URL:jdbc:mysql://localhost:3306/leaguemate_db?createDatabaseIfNotExist=true}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME:root}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD:root}
app.auth.access-token-ttl=${ACCESS_TOKEN_TTL:15m}
app.auth.refresh-token-ttl=${REFRESH_TOKEN_TTL:7d}
```

Dalla cartella principale del repository:

```bash
cd backend
export FLYWAY_LOCATIONS=classpath:db/migration,classpath:db/demo   # facoltativo: dati demo
./mvnw spring-boot:run
```

In locale il backend cerca Ollama su `http://localhost:11434`. Il servizio `ollama` del compose non espone porte, quindi per le funzioni AI serve Ollama installato sul PC (da [ollama.com](https://ollama.com), poi `ollama pull qwen3.5:4b`) oppure un servizio online configurato con le variabili `AI_*`. In alternativa `AI_ENABLED=false` disattiva l'AI: tutto il resto funziona normalmente.

---

## Testing

**246 test** con JUnit 5, Mockito, Spring Security Test e MockMvc — tutti verdi.
**Code coverage: 95%** (requisito minimo 35%).

Nessun test richiede Ollama: nei test l'AI è disattivata (`app.ai.enabled=false`) oppure il modello è simulato con Mockito o con `MockRestServiceServer`.

### Test unitari (service, security, exception)

| Classe testata | Test | Descrizione |
|---|---|---|
| `TournamentServiceImpl` | 45 | CRUD, **generazione calendario** (anche andata e ritorno), **classifica** (anche fino a una giornata), **statistiche**, co-organizzatori, chiusura torneo, calendario e squadre iscritte |
| `UserServiceImpl` | 18 | Registrazione, ruoli, **profilo con autorizzazione a livello di risorsa** |
| `TeamServiceImpl` | 10 | CRUD completo, proprietario e capitano alla creazione, unicità nome, vincoli di cancellazione |
| `TeamMemberServiceImpl` | 10 | Aggiunta membri, duplicati, rimozione vincolata alla squadra |
| `GlobalExceptionHandler` | 8 | 400, 401, 404, 409, 500, token non valido e mascheramento messaggi |
| `MatchServiceImpl` | 10 | Aggiornamento risultato, blocco su torneo non attivo, giornata inesistente, caricamento eager, **avvio della cronaca solo all'ultima partita della giornata** |
| `AuthServiceImpl` | 6 | Registrazione con hashing, login, rinnovo, logout e logout-all |
| `LoginRateLimitFilter` | 2 | Pulizia dei contatori inattivi del rate limit |
| `TournamentControllerSecurityTest` | 3 | **403 con USER, 201 con ORGANIZER** (`@WebMvcTest`) |

### Test unitari della parte AI

| Classe testata | Test | Descrizione |
|---|---|---|
| `RoundRecapService` | 16 | Cronaca `READY`, Ollama irraggiungibile o risposta vuota → `FAILED`, errori inattesi, AI disattivata, lettura e rigenerazione, cronache `PENDING` interrotte, generazioni contemporanee, pulizia del markdown |
| `TournamentTools` | 9 | I 4 tool, risultati scritti a parole, nome della squadra senza maiuscole, giornata o squadra inesistente, tool sconosciuto |
| `RoundFactsBuilder` | 7 | **Formato esatto dei fatti**, vittoria in casa e in trasferta, plurali, righe facoltative, ultima giornata, parità in testa, squadra a riposo |
| `TournamentAssistantService` | 7 | System prompt compilato, ciclo con tool, limite di 4 passaggi, Ollama irraggiungibile → `UNAVAILABLE`, AI disattivata, torneo inesistente |
| `OpenAiCompatibleClient` | 6 | Chiave API, argomenti dei tool da stringa JSON, id mancanti, indirizzo con barra finale, errori |
| `OllamaAiClient` | 5 | `think: false` e opzioni, tool call, nuovo tentativo senza `think`, timeout, modello non scaricato |
| `AiClientConfig` | 4 | Scelta del provider, AI disattivata, provider non valido senza bloccare l'avvio |
| `AssistantRateLimiter` | 3 | Limite superato, limite per utente, pulizia dei contatori |

### Test di integrazione (H2 in memoria, `@SpringBootTest` + MockMvc)

| Classe | Test | Descrizione |
|---|---|---|
| `AuthIntegrationTest` | 10 | Flusso register→login→endpoint protetto, RBAC, 401 identici, password mai esposta |
| `TokenAuthenticationIntegrationTest` | 10 | Token opachi, hash nel database, rotazione dei refresh token, logout, logout-all, scadenze, pulizia automatica |
| `InputValidationIntegrationTest` | 6 | Valori al limite: lunghezze allineate alle colonne del database, password oltre il limite di BCrypt, punti incoerenti |
| `TournamentFlowIntegrationTest` | 10 | Ciclo di vita completo del torneo end-to-end |
| `InfrastructureIntegrationTest` | 6 | Rate limit sul login, health check, specifica OpenAPI |
| `MySqlSchemaIntegrationTest` | 3 | Migrazioni Flyway e dati demo su **MySQL 8 reale** (Testcontainers), classifica fino a una giornata sul torneo demo, tabella `ai_round_recaps` |
| `RoundRecapIntegrationTest` | 6 | Cronaca con Ollama irraggiungibile: 401, `NOT_AVAILABLE`, 404, 403 per USER, 409, risultato salvato subito e cronaca in `FAILED` senza mai un 500 |
| `AssistantIntegrationTest` | 5 | 401, 400 per domanda vuota o troppo lunga, 404, AI disattivata → `UNAVAILABLE`, 429 oltre il rate limit |
| `AuthorizationRulesIntegrationTest` | 20 | Ownership dei tornei (compreso l'ultimo organizzatore) e delle squadre, chiusura torneo, andata e ritorno, paginazione, calendario, squadre iscritte, i miei tornei, CORS, membri, privacy di email e telefono, 401/400/404/409 |
| `ApiApplicationTests` | 1 | Caricamento del contesto Spring |

I test di integrazione girano su un database H2 in memoria (profilo `test`) su cui Flyway applica le stesse migrazioni della produzione, quindi la suite si esegue senza un MySQL attivo. `MySqlSchemaIntegrationTest` avvia invece un MySQL 8 in un container: gira quando Docker è disponibile (sempre in CI) e viene saltato altrimenti.

### Coverage per package

| Package | Coverage |
|---|---|
| `security` | 92% |
| `exception` | 86% |
| `service.impl` | 98% |
| `mapper` | 99% |
| `config` | 100% |
| `controller` | 90% |
| `ai.client` | 92% |
| `ai.recap` | 99% |
| `ai.assistant` | 98% |
| **Totale** | **95%** |

> `dto` ed `entity` sono esclusi dal report (boilerplate Lombok). I controller sono **inclusi** e coperti dai test di integrazione.

Dalla cartella principale del repository:

```bash
cd backend
./mvnw clean test
```
Report JaCoCo in `backend/target/site/jacoco/index.html`.

### Integrazione continua

A ogni push su `main` e a ogni pull request GitHub Actions (`.github/workflows/ci.yml`, nella cartella principale del repository) esegue `mvnw verify` dentro `backend/` con JDK 21, incluso il test su MySQL reale, e pubblica il report JaCoCo come artifact.

---

## Deliverables

| Elemento | Stato |
|---|---|
| Codice sorgente completo | ✅ |
| Script SQL (migrazioni Flyway in `db/migration` + dati demo in `db/demo`) | ✅ |
| Collection Postman in `docs/` (52 richieste, 10 cartelle, compresa la cartella AI; login, refresh e logout gestiti in automatico) | ✅ |
| Script Docker (`backend/Dockerfile`, `docker-compose.yml` con Ollama e `docker-compose.gpu.yml` facoltativo, nella cartella principale) | ✅ |
| Funzionalità AI con LLM locale (cronaca della giornata e assistente con tool calling) | ✅ |

---

## Autore

**Manuel Barbagallo**  
ITS Prodigi — Full Stack Developer (2025–2027)  
[GitHub](https://github.com/Barbagallo2296) | [LinkedIn](https://linkedin.com/in/manuel-barbagallo/)