# D'Art — Digital Augmented Reality Art Platform

> **Progetto per il corso di Ingegneria del Software**  
> *Dipartimento di Ingegneria e Scienza dell'Informazione — Università degli Studi di Trento*

---

## Panoramica del Progetto

**D'Art** è un'applicazione web e mobile geolocalizzata dedicata alla valorizzazione dell'arte digitale e del patrimonio culturale nella città di **Trento**. 

La piattaforma consente ad artisti digitali di posizionare installazioni 3D e opere d'arte virtuali inserite nel territorio. Cittadini e turisti possono esplorare la mappa della città, avvicinarsi fisicamente alle coordinate dell'opera entro e fruirne la visualizzazione immersiva in **Realtà Aumentata (AR)**, interagendo con la community.

Il sistema include inoltre una sezione dedicata al **Comune di Trento** per la moderazione dei contenuti, garantendo il rispetto del decoro urbano, delle licenze e della sicurezza degli spazi pubblici.

---

## Funzionalità Principali

### 1. Mappa Interattiva
- **Mappa Geografica di Trento**: Basata su OpenStreetMap e Leaflet con marker vettoriali personalizzati e raggruppamento delle opere.
- **Raggio di Attivazione Spaziale**: In conformità con le specifiche di dominio, un'opera d'arte può essere visualizzata in AR solo se l'utente si trova a una distanza $\le 30\text{ m}$.
- **Simulatore di Movimento**: Navigazione dell'avatar sulla mappa via tastiera (WASD / frecce direzionali), doppio click sulla mappa o trascinamento*.
- **Card Dettaglio Opera**: Visualizzazione metadati, licenza, stato esposizione (attiva o conclusa), commenti in tempo reale e azioni rapide.

### 2. Simulatore di Realtà Aumentata (AR)
- **Sfondo con monumento**: Per simulare la visione della fotocamera dello smartphone, una foto di un monumento della città di Trento viene usato come sfondo.
- **D'ArtWork estratto casualmente**: Per simulare l'asset digitale pubblicato dall'artista, delle immagini sono state estratte casualmente da un API pubblica e salvate sul database con delle specifiche rotazioni e scale che sono poi riprodotte in fase di visita del D'ArtWork.
- **Snapshot & Condivisione**: Possibilità di salvare foto dell'installazione AR nel profilo.

### 🎨 3. Pubblicazione Guidata D'ArtWork (`/publish`)
- **Wizard a 4 Passaggi**:
  1. *Scansione Spaziale AR*: Calibrazione e rilevamento delle superfici reali (simulata).
  2. *Selezione Asset 3D*: Scelta dell'asset digitale tridimensionale (ristretta).
  3. *Posizionamento & Dimensioni*: Regolazione di scala e rotazione spaziale.
  4. *Metadati & Licenza*: Titolo, descrizione, geolocalizzazione automatica, hashtag, licenze Creative Commons (CC BY, CC BY-NC, ecc.) e data di scadenza esposizione.
- **Pubblicazione Istituzionale da Remoto**: Funzionalità riservata ad artisti internazionali invitati dal Comune di Trento.

### 🔍 4. Esplora & Community Social (`/explore` e `/user/[username]`)
- **Ricerca Unificata**: Ricerca full-text istantanea per titolo dell'opera, hashtag tematici o nomi utente.
- **Profili Utente & Artisti**: Pagine profilo dedicate con bio, hashtag seguiti, avatar personalizzati a tema e catalogo delle opere pubblicate e collezionate.
- **Social Engagement**: Sistema di *like*, gestione della propria *collezione personale* (fino a 3 opere in evidenza) e commenti con attribuzione dell'autore.

### 🛡️ 5. Dashboard di Moderazione & Decoro Urbano (`/profile`)
- **Gestione Segnalazioni**: Pannello riservato alla moderazione municipale con suddivisione per categoria (*Contenuto offensivo*, *Violazione copyright*, *Spam*, *Pericolo/Luogo inaccessibile*).
- **Localizzazione Immediata**: Tasto **`VISUALIZZA SULLA MAPPA`** per verificare istantaneamente il contesto urbano dell'opera o del commento segnalato.
- **Azioni di Rimozione**: Archiviazione delle segnalazioni o eliminazione definitiva dal database MongoDB Atlas.

---

## 🏗️ Architettura & Stack Tecnologico

Il progetto è sviluppato seguendo un'architettura full-stack moderna e unificata:

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND & CLIENT UI                     │
│    React Native • Expo SDK 56 • Expo Router v56 • Leaflet   │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON / REST (OpenAPI 3.0)
┌──────────────────────────────▼──────────────────────────────┐
│                  BACKEND SERVERLESS ROUTES                  │
│       Expo API Routes (/src/app/api/*) • TypeScript         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Native Connection Pool
┌──────────────────────────────▼──────────────────────────────┐
│                      DATABASE STORAGE                       │
│           MongoDB Atlas (D'ArtWorks, Users, Assets, Reports)│
└─────────────────────────────────────────────────────────────┘
```

- **Framework Client**: [React Native](https://reactnative.dev/) con [Expo SDK 56](https://expo.dev/) e [Expo Router](https://docs.expo.dev/router/introduction/) (File-based Routing).
- **Backend & Web APIs**: Expo Server API Routes (`src/app/api/+api.ts`) conformi alle specifiche **OpenAPI 3.0**.
- **Database**: [MongoDB Atlas](https://www.mongodb.com/atlas) con driver nativo Node.js (`mongodb`).
- **Linguaggio**: [TypeScript](https://www.typescriptlang.org/) con rigorosa tipizzazione e validazione dei tipi (`tsc --noEmit`).
- **Localizzazione & Temi**: Supporto bilingue completo (**Italiano / Inglese**) e tema dinamico **Dark / Light**.

---

## 📁 Struttura del Repository

```text
dart-2/
├── assets/                  # Icone, immagini dell'app e sfondi fotografici di Trento
│   └── images/trento/       # Foto reali di Piazza Duomo, Castello, Dante, Torre Civica
├── design/                  # Documentazione di progetto, specifiche API e deliverable
│   └── docs/                # Deliverable D1, D2 e specifiche requisiti
├── src/
│   ├── app/                 # Pagine e API Routes (Expo Router File-based Navigation)
│   │   ├── _layout.tsx      # Root layout, Header unificato e configurazione router
│   │   ├── index.tsx        # Schermata principale Mappa & Card Interattiva
│   │   ├── explore.tsx      # Esplorazione opere, hashtag e community
│   │   ├── publish.tsx      # Wizard di creazione e pubblicazione D'ArtWork
│   │   ├── profile.tsx      # Profilo personale, collezione e dashboard moderazione
│   │   ├── settings.tsx     # Impostazioni tema, lingua e crediti
│   │   ├── user/[username].tsx # Profilo pubblico dell'utente / artista
│   │   └── api/             # Endpoint RESTful del backend
│   │       ├── dartworks+api.ts
│   │       ├── dartworks/like+api.ts
│   │       ├── dartworks/visit+api.ts
│   │       ├── users+api.ts
│   │       ├── users/avatar+api.ts
│   │       ├── users/bio+api.ts
│   │       ├── users/collection+api.ts
│   │       ├── users/follow+api.ts
│   │       ├── users/hashtags+api.ts
│   │       ├── comments+api.ts
│   │       ├── assets+api.ts
│   │       └── reports+api.ts
│   ├── components/          # Componenti modulari della UI
│   │   ├── ar-simulator.tsx # Viewport di simulazione Realtà Aumentata con sfondi di Trento
│   │   ├── artwork-modal.tsx# Modal informativo dell'opera
│   │   ├── auth-form.tsx    # Modulo di accesso, registrazione e switch utente rapido
│   │   ├── collection-curator-modal.tsx # Gestione album e opere preferite
│   │   ├── map.web.tsx      # Componente Mappa interattiva OpenStreetMap / Leaflet
│   │   ├── moderation-dashboard.tsx # Dashboard di moderazione del Comune di Trento
│   │   ├── notifications-modal.tsx  # Centro notifiche (like, commenti, nuovi follow)
│   │   ├── report-modal.tsx # Modale di invio segnalazione decoro urbano
│   │   ├── symbol-view.tsx  # Icone multipiattaforma (SF Symbols / MaterialIcons)
│   │   └── themed-text.tsx  # Componente tipografico con supporto Dark/Light mode
│   ├── constants/           # Temi cromatici e dizionari di localizzazione (IT/EN)
│   ├── context/             # AuthContext (stato globale autenticazione e cache dati)
│   ├── hooks/               # Custom hooks per geolocalizzazione, tema e colore
│   ├── lib/                 # Connessione a MongoDB Atlas e helper API
│   └── types/               # Interfacce TypeScript (DArtWork, UserProfile, Comment, ecc.)
├── .env.example             # Template variabili d'ambiente
├── app.json                 # Configurazione Expo Application
├── package.json             # Dipendenze e script npm
└── tsconfig.json            # Configurazione TypeScript
```

---

## 🌐 Endpoint Web APIs (OpenAPI 3.0) & Sicurezza

Il backend espone 12 endpoint RESTful documentati e protetti tramite autenticazione crittografica **Bearer Token (JWT standard RFC 7519 / HMAC-SHA256)** negli header HTTP `Authorization: Bearer <token>`:

| Metodo | Endpoint | Auth Richiesta | Descrizione |
|---|---|:---:|---|
| `GET` | `/api/dartworks` | No | Elenco completo D'ArtWorks con asset e commenti nidificati |
| `POST` | `/api/dartworks` | **Sì (Bearer)** | Pubblicazione nuova opera con validazione e associazione autore |
| `DELETE` | `/api/dartworks` | **Sì (Bearer)** | Cancellazione opera e rimozione a cascata di asset e commenti |
| `POST` | `/api/dartworks/like` | **Sì (Bearer)** | Aggiunta/rimozione like all'opera per l'utente autenticato |
| `POST` | `/api/dartworks/visit` | No | Incremento contatore visualizzazioni in AR |
| `GET` / `POST` | `/api/users` | No | Recupero utenti registrati e registrazione nuovo profilo |
| `PATCH` | `/api/users/bio` | **Sì (Bearer)** | Aggiornamento biografia utente autenticato |
| `PATCH` | `/api/users/avatar` | **Sì (Bearer)** | Modifica emoji e colore avatar dell'utente |
| `POST` | `/api/users/collection` | **Sì (Bearer)** | Aggiornamento collezione personale (max 3 opere) |
| `POST` | `/api/users/follow` | No | Segui / smetti di seguire un utente |
| `PATCH` | `/api/users/hashtags` | **Sì (Bearer)** | Aggiornamento hashtag di interesse |
| `GET` | `/api/comments` | No | Lettura commenti per un'opera |
| `POST` / `DELETE` | `/api/comments` | **Sì (Bearer)** | Pubblicazione e rimozione commenti |
| `GET` / `POST` | `/api/assets` | No | Catalogo modelli digitali 3D disponibili |
| `GET` / `POST` / `DELETE` | `/api/reports` | **Sì (Bearer)** | Invio e archiviazione segnalazioni di moderazione |

---

## 🚀 Guida all'Installazione e Avvio Locale

### Prerequisiti
- **Node.js** (versione $\ge 18.0.0$)
- **pnpm** (versione $\ge 10.0.0$)

### 1. Clonare il repository e installare le dipendenze con pnpm
```bash
git clone https://github.com/unitn-software-engineering/dart-2.git
cd dart-2
pnpm install
```

### 2. Configurare le variabili d'ambiente
Creare il file `.env.local` nella cartella principale del progetto inserendo la stringa di connessione a MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/dart?retryWrites=true&w=majority
```

### 3. Avviare il server di sviluppo
```bash
pnpm start
```
- Premere **`w`** nel terminale per aprire l'applicazione nel browser web (`http://localhost:8081`).
- Per eseguire i test automatizzati Jest:
  ```bash
  pnpm test
  ```
- Per compilare la versione di produzione Web:
  ```bash
  pnpm run build
  ```

---

## 👥 Account di Test Preconfigurati

L'applicazione include profili dimostrativi popolati nel database per testare tutti i ruoli e i flussi utente:

| Username | Ruolo / Descrizione | Note di Test |
|---|---|---|
| `davide_db` | Artista & Collezionista | Autore di opere, commenti e collezione attiva |
| `softeng` | Artista & Moderatore | Utilizzabile per la moderazione |

*(È inoltre possibile accedere come **Ospite** per testare le restrizioni di visualizzazione e i controlli di sicurezza).*
