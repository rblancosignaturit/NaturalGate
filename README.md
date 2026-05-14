# Smart Gateway — Setup & Deploy Guide

## Qué es esto

Un API gateway inteligente que traduce preguntas en lenguaje natural a llamadas API reales, usando:
- **Cloudflare Worker** → intercepta peticiones en el edge y usa Claude para traducir
- **Cloudflare Tunnel** → conecta de forma segura con tu backend local
- **FastAPI (Python)** → API REST con datos de ejemplo

## Arquitectura

```
Cliente → POST /ask {"query": "dame los usuarios activos"}
   ↓
Worker (Cloudflare Edge)
   ├─ Claude traduce → GET /api/users?active=true
   ├─ (opcional) formatea respuesta con Claude
   ↓
Tunnel (cloudflared)
   ↓
FastAPI (localhost:8080)
   └─ Devuelve datos
```

---

## 1. Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080
```

Verifica que funciona:
```bash
curl http://localhost:8080/api/users
curl http://localhost:8080/api/stats
curl http://localhost:8080/api/spec   # El spec que lee el Worker
```

## 2. Cloudflare Tunnel

```bash
# Instalar cloudflared
# macOS:   brew install cloudflare/cloudflare/cloudflared
# Linux:   https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# Login
cloudflared tunnel login

# Crear tunnel
cloudflared tunnel create smart-gateway

# Crear DNS record (sustituye tu-dominio.com)
cloudflared tunnel route dns smart-gateway api.tu-dominio.com

# Copiar config (edita tunnel ID y dominio)
cp tunnel/config.yml ~/.cloudflared/config.yml
# → Edita: tunnel ID, credentials-file, hostname

# Arrancar tunnel
cloudflared tunnel run smart-gateway
```

Verifica: `curl https://api.tu-dominio.com/api/stats`

## 3. Worker

```bash
cd worker

# Instalar dependencias
npm install

# Configurar secrets
npx wrangler secret put ANTHROPIC_API_KEY
# → Pega tu API key de Anthropic

# Editar wrangler.toml → BACKEND_URL = tu hostname del tunnel

# Dev local
npx wrangler dev

# Desplegar
npx wrangler deploy
```

## 4. Probar

```bash
# Pregunta simple
curl -X POST https://smart-gateway.<tu-cuenta>.workers.dev/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "dame los usuarios activos"}'

# Con explicación en lenguaje natural
curl -X POST "https://smart-gateway.<tu-cuenta>.workers.dev/ask?explain=true" \
  -H "Content-Type: application/json" \
  -d '{"query": "cuánto hemos facturado en total?"}'

# En valenciano
curl -X POST https://smart-gateway.<tu-cuenta>.workers.dev/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "quins productes de seguretat hi ha?"}'

# Acceso directo a la API (bypass del gateway)
curl https://smart-gateway.<tu-cuenta>.workers.dev/api/products

# Health check
curl https://smart-gateway.<tu-cuenta>.workers.dev/health
```

## Ejemplos de queries que puedes probar en la demo

| Query natural | Se traduce a |
|---|---|
| "dame los usuarios activos" | `GET /api/users?active=true` |
| "show me pending orders" | `GET /api/orders?status=pending` |
| "productos gratis" | `GET /api/products?max_price=0` |
| "quins productes de seguretat teniu?" | `GET /api/products?category=security` |
| "cuánto hemos facturado?" | `GET /api/stats` |
| "pedidos de Ana" | `GET /api/orders?user_id=1` |
| "revenue breakdown by week" | `GET /api/stats/revenue?period=week` |
| "quién es el usuario 3?" | `GET /api/users/3` |

## Estructura del proyecto

```
smart-gateway/
├── backend/
│   ├── main.py              ← FastAPI con endpoints de ejemplo
│   └── requirements.txt
├── worker/
│   ├── src/index.js         ← Cloudflare Worker (gateway inteligente)
│   ├── wrangler.toml        ← Config del Worker
│   └── package.json
├── tunnel/
│   └── config.yml           ← Template de config para cloudflared
└── README.md
```

## Ideas para expandir (si te da tiempo)

- **Caché con KV**: guardar traducciones query→endpoint para no llamar a Claude dos veces con lo mismo
- **Rate limiting**: limitar peticiones por IP con Cloudflare Rules
- **Auth con API keys**: el Worker valida un header `X-API-Key` antes de procesar
- **Dashboard web**: una UI sencilla para hacer queries desde el navegador
- **AI Gateway**: meter Cloudflare AI Gateway delante de las llamadas a Claude para tener métricas y fallback
