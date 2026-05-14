# Natural Gate Backend

Car rental e-commerce API built with FastAPI and Stripe payments.

## Quick Start

```bash
cd backend
poetry install
poetry run uvicorn natural_gate.main:app --reload --port 8080
```

Open API docs at http://127.0.0.1:8080/docs

## Project Structure

```
backend/
├── src/natural_gate/
│   ├── main.py                 # FastAPI entry point
│   ├── core/                   # Config, exceptions, security, DI
│   ├── domains/
│   │   ├── cars/
│   │   ├── reservations/
│   │   ├── payments/
│   │   └── stats/
│   └── shared/infrastructure/
│       └── memory_store.py     # In-memory repositories
├── tests/
├── pyproject.toml
├── Dockerfile
└── .env.example
```

## Environment

Copy `.env.example` to `.env` and set your Stripe secret key:

```bash
cp .env.example .env
```

## Commands

```bash
# Run server
poetry run uvicorn natural_gate.main:app --reload --port 8080

# Run tests
poetry run pytest

# Code quality
poetry run black src/ tests/
poetry run ruff check src/ tests/
poetry run mypy src/
```
