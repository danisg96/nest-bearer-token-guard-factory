# Lloydsfarmacia ETL Application

ETL (Extract, Transform, Load) application che sincronizza dati di prodotti farmaceutici, prezzi, giacenze e promozioni tra i sistemi gestionali IBS/eFidelity e la piattaforma e-commerce Shopify.

## Overview

L'applicazione **Lloydsfarmacia ETL** è un servizio Node.js che gestisce l'intero flusso di sincronizzazione dei dati per la farmacia online Lloydsfarmacia. Processa file CSV/XML provenienti da FTP, esegue trasformazioni sui dati, e li sincronizza con Shopify tramite GraphQL API.

### Funzionalità Principali

- **Import Automatico**: Monitora directory FTP per nuovi file di prodotti, prezzi, stock e promozioni
- **Gestione Prezzi**: Integrazione con il motore prezzi (MP) per calcolo e applicazione prezzi competitivi
- **Sincronizzazione Shopify**: Aggiornamento automatico di prodotti, varianti, inventario e metafields
- **Gestione Gallery**: Import e sincronizzazione di immagini prodotto
- **Webhook Handler**: Ricezione e gestione webhook da Shopify
- **Scheduler/Cron**: Esecuzione schedulata di job per import ed export
- **Monitoraggio**: Logging dettagliato di tutte le operazioni

## Architecture

### Componenti Principali

```
┌─────────────────────────────────────────────────────────────┐
│                    Lloydsfarmacia ETL                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ File Monitor │  │   Scheduler  │  │   Webhooks   │      │
│  │   (FTP)      │  │    (Cron)    │  │   Handler    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────┬───────┴──────────────────┘              │
│                    │                                          │
│         ┌──────────▼───────────┐                             │
│         │   ETL Import Core    │                             │
│         │  - Item Parser       │                             │
│         │  - Price Parser      │                             │
│         │  - Stock Parser      │                             │
│         │  - Fidelity Parser   │                             │
│         │  - Promo Importer    │                             │
│         │  - Gallery Manager   │                             │
│         └──────────┬───────────┘                             │
│                    │                                          │
│         ┌──────────▼───────────┐                             │
│         │  Shopify Integration │                             │
│         │  - Product Manager   │                             │
│         │  - Variant Manager   │                             │
│         │  - Inventory Sync    │                             │
│         │  - Metafields Sync   │                             │
│         └──────────┬───────────┘                             │
│                    │                                          │
└────────────────────┼──────────────────────────────────────────┘
                     │
         ┌───────────▼────────────┐
         │   PostgreSQL Database  │
         │   - ETL Configuration  │
         │   - Product Entities   │
         │   - Sync Status        │
         │   - MP Shared Tables   │
         └────────────────────────┘
```

### Flusso Dati

1. **Input Sources**:
   - IBS FTP Server: File CSV con anagrafica prodotti, prezzi, giacenze
   - eFidelity FTP: File XML con dati programma fedeltà e promozioni
   - Shopify Webhooks: Eventi in tempo reale su ordini e prodotti

2. **Processing**:
   - Parsing e validazione file CSV/XML
   - Trasformazione dati secondo business rules
   - Arricchimento con dati da motore prezzi (MP)
   - Gestione gallery e immagini prodotto
   - Generazione metafields SEO

3. **Output**:
   - Shopify GraphQL API: Creazione/aggiornamento prodotti, varianti, inventario
   - Database PostgreSQL: Persistenza stato sincronizzazione
   - Notifiche Email: Alert su errori o completamento job

## Getting Started

### Prerequisites

- **Node.js**: v14.19.0 (gestito con Volta)
- **PostgreSQL**: Database per persistenza dati
- **Ngrok**: (opzionale) Per testare webhook in locale
- **Motore Prezzi**: Progetto `lloydsfarmacia-mp-api` per tabelle condivise

### Installation

```bash
# Clone repository
git clone https://github.com/phx-grandslam/lloydsfarmacia-etl-app.git
cd lloydsfarmacia-etl-app

# Install dependencies
npm install

# Setup environment
# Creare file .env seguendo template in:
# https://spotview.atlassian.net/wiki/spaces/RUL/pages/1936195585/Sviluppo+e+avvio+in+locale
```

### Database Setup

L'applicazione richiede 3 tabelle condivise create dal Motore Prezzi:
- `mp_ibs_prices`
- `mp_price_changes`
- `mp_changed_products`

**Opzione 1**: Avviare il progetto MP in locale
```bash
# In directory separata
git clone https://github.com/phx-grandslam/lloydsfarmacia-mp-api.git
cd lloydsfarmacia-mp-api
npm install
npm run dev
```

**Opzione 2**: Script di inizializzazione
```bash
node tool/devel_start/init_mp.js
```

### Local Development

**Avvio base (senza webhook)**:
```bash
npm run dev
```

**Avvio con supporto webhook**:
```bash
# Terminal 1: Avvia ngrok tunnel
npm run wk-tunnel

# Terminal 2: Aggiorna .env con URL ngrok
npm run wk-env

# Terminal 3: Avvia applicazione
npm run dev
```

### Production Deployment

```bash
# Build application
npm run build

# Start in production mode
npm start
```

## Configuration

### Environment Variables

Variabili principali nel file `.env`:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=etl_database
DB_USER=etl_user
DB_PASSWORD=secret

# Shopify
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET_KEY=your_secret
SHOPIFY_SHOP=youstore.myshopify.com

# FTP Directories
HOME_FTP=/home/user/ftp
HOME_IBS=/home/user/ibs
HOME_EFIDELITY=/home/user/efidelity

# Email Notifications
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USER=notifications@example.com
MAIL_PASS=secret

# Webhook (per sviluppo locale)
HOST=https://your-ngrok-url.ngrok.io
```

### Cron Jobs Configuration

I job schedulati sono configurati in `config/crontab.default.json`:

```json
{
  "task": "import_items",
  "hm": "08-20_00-59",
  "interval": 15,
  "priority": 1,
  "description": "Import anagrafica prodotti IBS"
}
```

Parametri:
- `task`: Nome funzione da eseguire
- `hm`: Range orario (formato `HH-HH_MM-MM` o `*` per sempre)
- `interval`: Intervallo in minuti
- `priority`: Priorità esecuzione (1=alta, maggiore=bassa)

## API Reference

### Debug/Admin Endpoints

L'applicazione espone endpoint di debug/amministrazione:

**Cron Management**:
- `GET /debug/cron` - Dashboard gestione cron jobs
- `POST /debug/cron-api` - Trigger manuale job
- `GET /debug/status-api` - Status applicazione

**File Management**:
- `GET /debug/file` - Lista file ricevuti
- `POST /debug/file-api` - Gestione file

**Queue Management**:
- `GET /debug/queue` - Dashboard code elaborazione
- `POST /debug/queue-api` - Gestione code

**SQL Console**:
- `GET /debug/sql` - Console SQL interattiva
- `POST /debug/sql-api` - Esecuzione query

### Webhook Endpoints

- `POST /webhooks/orders/create` - Nuovo ordine
- `POST /webhooks/products/update` - Aggiornamento prodotto
- `POST /webhooks/products/delete` - Eliminazione prodotto

## Operations

### Monitoring

L'applicazione usa un sistema di logging strutturato con classe `Logger`:

```javascript
const Logger = require('./src/logger')
const log = new Logger('component.name')

await log.connect()
log.info('Messaggio informativo')
log.error('Errore', { error: err })
```

I log sono salvati nel database PostgreSQL per analisi e debugging.

### Common Tasks

**Forzare import manuale**:
```bash
# Via debug interface
curl -X POST http://localhost:8081/debug/cron-api \
  -H "Content-Type: application/json" \
  -d '{"action":"trigger","task":"import_items"}'
```

**Verificare stato sincronizzazione**:
```bash
# Controllare tabelle database
SELECT * FROM etl_product WHERE last_sync > NOW() - INTERVAL '1 hour';
```

**Resettare stato prodotto**:
```sql
UPDATE etl_product 
SET sync_status = 'pending', sync_error = NULL
WHERE sku = 'PRODUCT_SKU';
```

### Troubleshooting

**Problema**: File non vengono processati
- Verificare permessi directory FTP
- Controllare formato file CSV/XML
- Verificare log: `SELECT * FROM etl_log WHERE level = 'error' ORDER BY created_at DESC`

**Problema**: Prodotti non si sincronizzano con Shopify
- Verificare credenziali Shopify in `.env`
- Controllare rate limiting API Shopify
- Verificare che prodotto abbia tutti i campi obbligatori

**Problema**: Prezzi non aggiornati
- Verificare che tabelle MP siano popolate
- Controllare sincronizzazione con `lloydsfarmacia-mp-api`
- Verificare job `update_prices` in cron

**Problema**: Webhook non funzionano in locale
- Verificare che ngrok sia attivo: `npm run wk-tunnel`
- Aggiornare .env: `npm run wk-env`
- Verificare registrazione webhook su Shopify admin

### Performance Tuning

**Rate Limiting Shopify**:
L'applicazione gestisce automaticamente i limiti API Shopify (40 req/sec). Configurabile in `src/shopify.js`.

**Batch Processing**:
Import massivi usano batch di 50 prodotti per ottimizzare performance.

**Database Indexes**:
Assicurarsi che indici siano presenti su:
- `etl_product(sku)`
- `etl_product(shopify_id)`
- `etl_category(ibs_id)`

## Technologies

### Core Stack
- **Runtime**: Node.js 14.19.0
- **Framework**: Next.js 11.x (per UI admin)
- **Server**: Koa 2.x
- **Database**: PostgreSQL + TypeORM 0.2.x
- **API Client**: GraphQL (apollo-boost), Axios

### Key Dependencies
- `@shopify/app-bridge-react`: Integrazione Shopify App
- `@shopify/koa-shopify-auth`: Autenticazione Shopify
- `@shopify/koa-shopify-webhooks`: Gestione webhook
- `typeorm`: ORM per PostgreSQL
- `csv-string`: Parsing file CSV
- `fast-xml-parser`: Parsing file XML
- `nodemailer`: Invio notifiche email
- `soap`: Client SOAP per servizi esterni

## Development Guidelines

### Code Structure

```
src/
├── entity/          # Entity TypeORM (database models)
├── debug/           # Admin/debug endpoints
├── etl_import.js    # Core ETL orchestrator
├── shopify.js       # Shopify API client
├── cron.js          # Scheduler/cron manager
├── ibs_*.js         # Parser per file IBS
├── efidelity.js     # Parser eFidelity
├── gallery*.js      # Gestione immagini
├── product.js       # Business logic prodotti
├── metafields.js    # SEO metafields
└── logger.js        # Logging system
```

### Testing

```bash
# Run tests
npm test

# Test specifici
npm test -- --testPathPattern=src/__tests__/product
```

### Contributing

1. Creare branch feature: `git checkout -b feature/LFS-XXXX-description`
2. Commit con riferimento ticket: `git commit -m "LFS-XXXX: Description"`
3. Push e creare Pull Request
4. Attendere review e CI/CD checks

## Links & Resources

- **Wiki Confluence**: [Sviluppo e avvio in locale](https://spotview.atlassian.net/wiki/spaces/RUL/pages/1936195585/Sviluppo+e+avvio+in+locale)
- **Repository**: [GitHub - lloydsfarmacia-etl-app](https://github.com/phx-grandslam/lloydsfarmacia-etl-app)
- **Motore Prezzi**: [lloydsfarmacia-mp-api](https://github.com/phx-grandslam/lloydsfarmacia-mp-api)
- **Shopify API Docs**: [Shopify GraphQL API](https://shopify.dev/api/admin-graphql)

## Support

Per supporto o domande:
- **Team**: SpotView Development Team
- **Issue Tracker**: GitHub Issues
- **Documentation**: Confluence Wiki
