# Natural Gate

An intelligent API gateway that translates natural-language questions into real API calls, using:

- **Cloudflare Worker** → intercepts requests at the edge and uses Claude to translate
- **Cloudflare Tunnel** → securely connects to your local backend
- **FastAPI (Python)** → car-rental e-commerce REST API with Stripe payments and PostgreSQL persistence

## Architecture

```
Client → POST /ask {"query": "show me available SUVs in Valencia"}
   ↓
Worker (Cloudflare Edge)
   ├─ Claude translates → GET /api/cars?type=SUV&location=Valencia
   ├─ (optional) formats response with Claude
   ↓
Tunnel (cloudflared)
   ↓
FastAPI (localhost:8080)  ← PostgreSQL database
   └─ Returns data
```

---

## 1. Backend (FastAPI + PostgreSQL)

### Prerequisites

- Python 3.11+
- PostgreSQL running locally or accessible via network
- Poetry

### Install & configure

```bash
cd backend
poetry install

# Copy and edit environment variables
cp .env.example .env
# Set STRIPE_SECRET_KEY and DATABASE_URL
```

Example `.env`:

```env
STRIPE_SECRET_KEY=sk_test_your_key_here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/natural_gate
```

### Run migrations (creates tables + seed data)

```bash
poetry run alembic upgrade head
```

### Start server

```bash
poetry run uvicorn natural_gate.main:app --host 0.0.0.0 --port 8080
```

Open API docs at http://127.0.0.1:8080/docs

### Verify locally

```bash
curl http://localhost:8080/api/cars
curl http://localhost:8080/api/cars?type=SUV
curl http://localhost:8080/api/stats
curl http://localhost:8080/api/spec   # Spec consumed by the Worker
```

---

## 2. Cloudflare Tunnel

```bash
# Install cloudflared
# macOS:   brew install cloudflare/cloudflare/cloudflared
# Linux:   https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# Login
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create smart-gateway

# Create DNS record (replace your-domain.com)
cloudflared tunnel route dns smart-gateway api.your-domain.com

# Copy config (edit tunnel ID and domain)
cp tunnel/config.yml ~/.cloudflared/config.yml
# → Edit: tunnel ID, credentials-file, hostname

# Start tunnel
cloudflared tunnel run smart-gateway
```

Verify: `curl https://api.your-domain.com/api/stats`

---

## 3. Worker

```bash
cd worker

# Install dependencies
npm install

# Configure secrets
npx wrangler secret put ANTHROPIC_API_KEY
# → Paste your Anthropic API key

# Edit wrangler.toml → BACKEND_URL = your tunnel hostname

# Local dev
npx wrangler dev

# Deploy
npx wrangler deploy
```

---

## 4. Test

```bash
# Simple query
curl -X POST https://smart-gateway.<your-account>.workers.dev/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "show me available SUVs in Valencia"}'

# With natural-language summary
curl -X POST "https://smart-gateway.<your-account>.workers.dev/ask?explain=true" \
  -H "Content-Type: application/json" \
  -d '{"query": "how many reservations do we have?"}'

# Direct API access (bypass gateway)
curl https://smart-gateway.<your-account>.workers.dev/api/cars

# Health check
curl https://smart-gateway.<your-account>.workers.dev/health
```

---

## Backend API Reference

### Cars

| Method | Endpoint             | Description                                                                                |
|--------|----------------------|--------------------------------------------------------------------------------------------|
| GET    | `/api/cars`          | List cars with filters: `brand`, `type`, `min_price`, `max_price`, `available`, `location` |
| GET    | `/api/cars/{car_id}` | Get a single car by ID                                                                     |

### Reservations

| Method | Endpoint                            | Description                                   |
|--------|-------------------------------------|-----------------------------------------------|
| POST   | `/api/reservations`                 | Create a new reservation                      |
| GET    | `/api/reservations/search`          | Search reservations by email or ID (`?q=...`) |
| POST   | `/api/reservations/{res_id}/cancel` | Cancel a confirmed reservation                |

### Payments

| Method | Endpoint                | Description                                   |
|--------|-------------------------|-----------------------------------------------|
| POST   | `/api/payments/intent`  | Create a Stripe PaymentIntent                 |
| POST   | `/api/payments/confirm` | Confirm payment and update reservation status |

### Stats

| Method | Endpoint     | Description                                               |
|--------|--------------|-----------------------------------------------------------|
| GET    | `/api/stats` | Overall statistics: cars, reservations, revenue, averages |

---

## Example Queries

| Natural language query               | Translates to                                    |
|--------------------------------------|--------------------------------------------------|
| "show me available SUVs in Valencia" | `GET /api/cars?type=SUV&location=Valencia`       |
| "list BMWs under 80 euros per day"   | `GET /api/cars?brand=BMW&max_price=80`           |
| "how many reservations do we have?"  | `GET /api/stats`                                 |
| "find reservation for maria.garcia"  | `GET /api/reservations/search?q=maria.garcia`    |
| "cancel reservation RES-A1B2C3"      | `POST /api/reservations/RES-A1B2C3/cancel`       |
| "show me electric cars"              | `GET /api/cars?type=Sedán` (inferred via Claude) |
| "what is our total revenue?"         | `GET /api/stats`                                 |

---

## Project Structure

```
natural-gate/
├── backend/
│   ├── src/natural_gate/
│   │   ├── main.py                    # FastAPI entry point
│   │   ├── core/                      # Config, exceptions, security, DI
│   │   ├── domains/
│   │   │   ├── cars/                  # Cars listing & filtering
│   │   │   ├── reservations/          # Booking CRUD + search + cancel
│   │   │   ├── payments/              # Stripe PaymentIntent & confirm
│   │   │   └── stats/                 # Aggregated dashboard data
│   │   └── shared/infrastructure/
│   │       ├── database.py            # SQLAlchemy engine & sessions
│   │       ├── orm_models.py          # CarORM, ReservationORM
│   │       └── seed.py                # Sample data for migrations/tests
│   ├── alembic/                       # Database migrations
│   ├── tests/                         # Unit + integration tests
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── .env.example
├── worker/
│   ├── src/index.js                   # Cloudflare Worker (gateway)
│   ├── wrangler.toml                  # Worker config
│   └── package.json
├── tunnel/
│   └── config.yml                     # cloudflared template
└── README.md
```

---

## Development Commands

```bash
# Backend tests
cd backend
poetry run pytest

# Backend code quality
poetry run black src/ tests/
poetry run ruff check src/ tests/
poetry run mypy src/

# Database migrations
cd backend
poetry run alembic revision --autogenerate -m "description"
poetry run alembic upgrade head
```

---

## Ideas to Expand

- **KV Cache**: store query-to-endpoint translations to avoid duplicate Claude calls
- **Rate limiting**: limit requests per IP with Cloudflare Rules
- **API key auth**: validate an `X-API-Key` header in the Worker before processing
- **Web dashboard**: a simple UI to submit queries from the browser
- **AI Gateway**: place Cloudflare AI Gateway in front of Claude calls for metrics and fallback
