# NaturalGate Worker — Guía de despliegue y entendimiento

Esta guía está pensada para que entiendas qué hace el Worker de Cloudflare del proyecto **NaturalGate**, y luego lo despliegues paso a paso. No modifica nada del código existente: solo explica y guía.

---

## 1. Qué hace el Worker (lectura del código `worker/src/index.js`)

El Worker es el "cerebro" del sistema. Vive en el edge de Cloudflare y traduce preguntas en lenguaje natural a llamadas API contra un backend FastAPI accesible vía Cloudflare Tunnel.

### Flujo de una petición a `POST /ask`

1. El cliente envía `{"query": "dame los usuarios activos"}` al Worker.
2. El Worker hace `GET /api/spec` al backend para obtener la lista de endpoints disponibles. Esto se cachea en memoria del Worker (variable `cachedSpec`) para que solo se haga una vez por instancia.
3. El Worker llama a Claude (modelo `claude-sonnet-4-20250514`) con un system prompt que le dice: "eres un motor de routing de APIs, dada esta query y este spec, devuelve un JSON con method/path/params".
4. Claude responde algo como `{"method": "GET", "path": "/api/users", "params": {"active": true}}`.
5. El Worker construye la URL y hace `fetch` al backend (a través del tunnel).
6. Si la query lleva `?explain=true`, el Worker hace una segunda llamada a Claude para que resuma los datos en lenguaje natural.
7. Devuelve un JSON con `query`, `translated_to`, `data`, opcionalmente `summary`, y `meta` (tiempo, timestamp).

### Otras rutas

- `GET /` — Devuelve info de uso y ejemplos. Útil para curiosos.
- `GET /health` — Verifica que el backend responde. Devuelve 502 si el tunnel está caído.
- `GET /api/*` — Proxy directo al backend (bypass del gateway inteligente).
- `OPTIONS *` — Preflight CORS (permite que la API se llame desde cualquier dominio).
- Cualquier otra ruta — 404 con sugerencia de usar `/ask` o `/`.

### Detalles clave del código

- **Modelo Claude usado**: `claude-sonnet-4-20250514`, con `max_tokens: 1024`. Suficiente para una respuesta JSON corta.
- **Sin retry ni timeout custom**: si Claude o el backend tardan, el cliente espera. En la demo no debería ser un problema.
- **CORS abierto a `*`**: práctico para una demo, pero en producción lo limitarías.
- **No hay rate limiting ni auth**: cualquiera con la URL puede gastarte créditos de Anthropic. OK para hackathon.
- **El system prompt está hardcoded en inglés** pero le indica explícitamente a Claude entender español, inglés y valenciano. Por eso funciona multilenguaje sin código adicional.
- **El spec del backend se cachea en una variable global del Worker**. Cada instancia del Worker (Cloudflare las recicla) hará una primera petición a `/api/spec` y luego reutiliza el resultado.

---

## 2. Qué necesitas tener montado antes de desplegar el Worker

El Worker, por sí solo, no sirve para nada: necesita un backend al que apuntar. Como en tu equipo tenéis que tener todo arrancado para la demo, este es el orden lógico:

1. **Backend FastAPI** corriendo en `localhost:8080` (lo arranca alguien del equipo o tú).
2. **Cloudflare Tunnel** apuntando ese localhost a un dominio público (p. ej. `api.tu-dominio.com`).
3. **Worker** desplegado, con `BACKEND_URL` apuntando al hostname del tunnel.

Si tu equipo aún no ha arrancado backend ni tunnel, puedes probar el Worker en modo dev local (`wrangler dev`) apuntando a un `BACKEND_URL` temporal: lo veremos al final.

---

## 3. Pre-requisitos

Antes de empezar necesitas:

- **Cuenta de Cloudflare** (gratis sirve). Login en https://dash.cloudflare.com.
- **API key de Anthropic** desde https://console.anthropic.com → Settings → API Keys.
- **Node.js** instalado (v18 o superior). Comprueba con `node -v`.
- **npm** (viene con Node).
- **El proyecto descargado** (lo tienes en el escritorio).

Opcional para la demo end-to-end pero no necesario para desplegar el Worker:

- Backend FastAPI corriendo (lo arranca alguien del equipo).
- Cloudflare Tunnel configurado (lo arranca alguien del equipo).
- Un dominio en Cloudflare (lo tendrá el organizador o tu cuenta).

---

## 4. Renombrar el proyecto a NaturalGate (antes del primer deploy)

Como el producto se llama NaturalGate, conviene reflejarlo en la configuración antes del primer `wrangler deploy`. Cambia estos campos a mano:

**`worker/wrangler.toml`** — cambia el nombre del Worker:

```toml
name = "naturalgate"
```

Esto hará que tu Worker se despliegue en `https://naturalgate.<tu-cuenta>.workers.dev`.

**`worker/package.json`** — opcional pero recomendado por consistencia:

```json
"name": "naturalgate"
```

**Tunnel** (cuando el responsable del tunnel lo cree, sugiérele que lo llame `naturalgate` también):

```bash
cloudflared tunnel create naturalgate
cloudflared tunnel route dns naturalgate api.tu-dominio.com
cloudflared tunnel run naturalgate
```

**`README.md`** del proyecto — opcional, solo si quieres dejarlo limpio para entregar al jurado: cambia los `smart-gateway` por `naturalgate`.

---

## 5. Despliegue paso a paso

### Paso 5.1 — Abrir terminal en la carpeta del Worker

```powershell
cd "$env:USERPROFILE\Desktop\smart-gateway 1\worker"
```

(La carpeta sigue llamándose `smart-gateway 1` en tu escritorio; eso da igual para el deploy.)

### Paso 5.2 — Instalar dependencias

```bash
npm install
```

Esto descarga `wrangler` (el CLI de Cloudflare Workers).

### Paso 5.3 — Login en Cloudflare con wrangler

```bash
npx wrangler login
```

Se abrirá el navegador, autoriza wrangler con tu cuenta de Cloudflare.

> **Si falla con "Wrangler authorization failed"**: suele ser por red corporativa bloqueando el callback. Plan B: crea un API token en https://dash.cloudflare.com/profile/api-tokens (plantilla "Edit Cloudflare Workers"), cópialo, y en PowerShell:
> ```powershell
> $env:CLOUDFLARE_API_TOKEN = "pega-aquí-tu-token"
> npx wrangler whoami
> ```

### Paso 5.4 — Configurar la API key de Anthropic como secret

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```

Te pedirá que pegues la API key. Es un "secret", no se sube al `wrangler.toml` ni a git. Queda almacenada cifrada en Cloudflare.

### Paso 5.5 — Editar `wrangler.toml` con el BACKEND_URL

Abre `worker/wrangler.toml` y cambia la línea:

```toml
BACKEND_URL = "https://api.tu-dominio.com"
```

Por tu hostname real del tunnel. Si todavía no tienes tunnel pero quieres desplegar igualmente, puedes dejarlo apuntando a cualquier URL HTTPS válida (el Worker desplegará, solo que el `POST /ask` fallará con 502 hasta que el backend esté listo).

### Paso 5.6 — Probar en local (opcional pero recomendado)

```bash
npx wrangler dev
```

Esto levanta el Worker en `http://localhost:8787`. Puedes probar:

```bash
curl http://localhost:8787/
curl http://localhost:8787/health
```

Si tienes el backend + tunnel arriba:

```bash
curl -X POST http://localhost:8787/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "dame los usuarios activos"}'
```

### Paso 5.7 — Desplegar a producción

```bash
npx wrangler deploy
```

Al terminar te dará la URL pública del Worker:

```
https://naturalgate.<tu-cuenta>.workers.dev
```

### Paso 5.8 — Verificar el despliegue

```bash
# Info del Worker
curl https://naturalgate.<tu-cuenta>.workers.dev/

# Health (te dirá si el backend está accesible)
curl https://naturalgate.<tu-cuenta>.workers.dev/health

# Query real (necesita backend + tunnel funcionando)
curl -X POST https://naturalgate.<tu-cuenta>.workers.dev/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "dame los usuarios activos"}'
```

---

## 6. Comandos útiles durante la demo

Tenlos preparados en un editor de texto para copiar/pegar rápido. Sustituye `<URL>` por `https://naturalgate.<tu-cuenta>.workers.dev`.

```bash
# Español
curl -X POST <URL>/ask -H "Content-Type: application/json" \
  -d '{"query": "dame los usuarios activos"}'

# Inglés
curl -X POST <URL>/ask -H "Content-Type: application/json" \
  -d '{"query": "show me pending orders"}'

# Valenciano
curl -X POST <URL>/ask -H "Content-Type: application/json" \
  -d '{"query": "quins productes de seguretat hi ha?"}'

# Con explicación en lenguaje natural
curl -X POST "<URL>/ask?explain=true" -H "Content-Type: application/json" \
  -d '{"query": "cuánto hemos facturado en total?"}'

# Bypass del gateway, llamada directa
curl <URL>/api/stats
```

---

## 7. Troubleshooting habitual

| Síntoma | Causa probable | Solución |
|---|---|---|
| `wrangler: command not found` | No ejecutaste con `npx` | Usa `npx wrangler ...` |
| `Authentication error: Authentication required` | No hiciste login | `npx wrangler login` o usa `CLOUDFLARE_API_TOKEN` |
| `Wrangler authorization failed` | Red corporativa bloquea el callback | Usa API token (sección 5.3) |
| `npm.ps1 ... ejecución de scripts deshabilitada` | Política de PowerShell | `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` como admin |
| `Claude API error (401)` | API key mal puesta | Repite `npx wrangler secret put ANTHROPIC_API_KEY` |
| `Could not fetch backend API spec` | El backend o tunnel no están vivos | Comprueba `curl <BACKEND_URL>/api/spec` directo |
| `Backend returned 502` | El tunnel está caído | Reinicia `cloudflared tunnel run naturalgate` |
| CORS error desde el navegador | Eso ya está bien configurado | Comprueba que llamas con `Content-Type: application/json` |
| `Failed to parse Claude response` | Claude devolvió texto en vez de JSON | Suele ser temporal. Reintentar suele bastar. |

---

## 8. Logs en vivo durante la demo

Si quieres ver qué está pasando dentro del Worker en tiempo real:

```bash
npx wrangler tail
```

Te muestra todas las peticiones, respuestas y `console.log` (aunque este Worker no tiene logs explícitos, los errores y los `fetch` se ven igualmente).

---

## 9. Resumen ejecutivo (la versión TL;DR)

```powershell
cd "$env:USERPROFILE\Desktop\smart-gateway 1\worker"
npm install
npx wrangler login
npx wrangler secret put ANTHROPIC_API_KEY      # pega tu key
# edita wrangler.toml → name = "naturalgate"  y  BACKEND_URL = hostname-de-tu-tunnel
npx wrangler deploy
```

Y para probar:

```bash
curl -X POST https://naturalgate.<tu-cuenta>.workers.dev/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "dame los usuarios activos"}'
```

Listo para la demo. Si necesitas que extendamos algo (caché KV, auth, mini UI, AI Gateway), avísame y lo añadimos como sesión aparte.
