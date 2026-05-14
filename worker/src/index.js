/**
 * Smart Gateway — Cloudflare Worker
 *
 * An intelligent API gateway that translates natural language queries
 * into backend API calls using Cloudflare Workers AI, then formats
 * the response back into natural language.
 *
 * Deploy: wrangler deploy
 */

// ─── Config ─────────────────────────────────────────────────────────────────

const AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const BACKEND_TIMEOUT_MS = 8000;
const SPEC_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ─── In-memory caches (per-request, Workerisolate lifetime) ─────────────────

let specCache = null;
let specCacheAt = 0;

// Simple in-memory translation cache to avoid duplicate AI calls
const translationCache = new Map();
const TRANSLATION_CACHE_MAX = 100;

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = BACKEND_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

// ─── API Spec (cached with TTL) ─────────────────────────────────────────────

async function getApiSpec(backendUrl) {
  const now = Date.now();
  if (specCache && now - specCacheAt < SPEC_CACHE_TTL_MS) {
    return specCache;
  }
  try {
    const res = await fetchWithTimeout(`${backendUrl}/api/spec`);
    if (!res.ok) throw new Error(`Backend spec returned ${res.status}`);
    specCache = await res.json();
    specCacheAt = now;
    return specCache;
  } catch (err) {
    console.error("Failed to fetch API spec:", err.message);
    return specCache; // fallback to stale cache
  }
}

// ─── Workers AI ─────────────────────────────────────────────────────────────

async function askAI(ai, prompt, systemPrompt) {
  const response = await ai.run(AI_MODEL, {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ],
  });

  if (!response || !response.response) {
    throw new Error("Workers AI returned an empty response");
  }

  return response.response;
}

// ─── Robust JSON extraction ─────────────────────────────────────────────────

function extractJson(text) {
  // Try to find the outermost JSON object or array
  let depth = 0;
  let start = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (ch === "\\") {
      escapeNext = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === "{" || ch === "[") {
      if (depth === 0) start = i;
      depth++;
      continue;
    }

    if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0 && start !== -1) {
        return text.slice(start, i + 1);
      }
      continue;
    }
  }

  // Fallback: strip markdown fences and try the whole string
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
    return cleaned;
  }

  return null;
}

// ─── Translation cache key ──────────────────────────────────────────────────

function cacheKey(query, spec) {
  // Simple hash of query + endpoint count
  const specHash = spec.endpoints.length;
  return `${query.toLowerCase().trim()}|${specHash}`;
}

// ─── Natural language → API call translation ────────────────────────────────

async function translateQuery(ai, query, spec) {
  const cacheKeyValue = cacheKey(query, spec);
  if (translationCache.has(cacheKeyValue)) {
    return translationCache.get(cacheKeyValue);
  }

  const systemPrompt = `You are an API routing engine for a car rental e-commerce platform called "Natural Coches".

Your job: translate the user's natural-language query into a single backend API call.

AVAILABLE ENDPOINTS:
${JSON.stringify(spec.endpoints, null, 2)}

DOMAIN CONTEXT:
- This is a car rental system with cars, reservations, payments, and statistics.
- Cars have: brand, model, type (Sedán, Compacto, SUV, Furgoneta), fuel, transmission, location (Valencia, Madrid, Barcelona), price_per_day, available.
- Reservations have: id, car_id, customer_name, email, status (confirmada, en_curso, completada, cancelada), payment_status (pending, paid), total_price.
- Stats endpoint returns aggregated data: total_cars, available_cars, total_reservations, active_reservations, total_revenue, avg_reservation_value.

RULES:
1. Respond ONLY with a JSON object. No markdown, no explanation, no preamble.
2. Format: {"method": "GET|POST", "path": "/api/...", "query": {...}, "body": {...}}
   - Use "query" for GET parameters (they become URL query string)
   - Use "body" for POST request payloads
3. If the query clearly does not match any endpoint, respond: {"error": "No matching endpoint found"}
4. Infer filters from context. Examples:
   - "SUVs available in Valencia" → {"method":"GET","path":"/api/cars","query":{"type":"SUV","location":"Valencia"}}
   - "show me electric cars" → {"method":"GET","path":"/api/cars","query":{"type":"Sedán"}} (best match)
   - "how much revenue do we have?" → {"method":"GET","path":"/api/stats"}
   - "cancel reservation ABC123" → {"method":"POST","path":"/api/reservations/ABC123/cancel"}
   - "find reservation for maria" → {"method":"GET","path":"/api/reservations/search","query":{"q":"maria"}}
   - "book a BMW for Juan" → {"method":"POST","path":"/api/reservations","body":{"car_id":1,"customer_name":"Juan",...}}
5. Understand Spanish, English, and Valencian.
6. If vague, pick the most reasonable endpoint.
7. Today's date is ${new Date().toISOString().split("T")[0]}`;

  const raw = await askAI(ai, query, systemPrompt);
  const candidate = extractJson(raw);

  let parsed;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return { error: "Failed to parse AI response", raw };
  }

  // Store in cache
  if (translationCache.size >= TRANSLATION_CACHE_MAX) {
    const firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }
  translationCache.set(cacheKeyValue, parsed);

  return parsed;
}

// ─── Response formatting ────────────────────────────────────────────────────

async function formatResponse(ai, query, data) {
  const systemPrompt = `You are a helpful, friendly car rental assistant. The user asked a natural-language question and the backend returned data.

Your task: summarize the results in the SAME LANGUAGE the user asked. Be concise (2-3 sentences). Focus on the key takeaway — do not list every raw field unless specifically asked. If the data is a list, mention the count and a highlight. If it's a single object, mention the main detail.`;

  const prompt = `User asked: "${query}"
Backend returned: ${JSON.stringify(data).slice(0, 4000)}

Please provide a brief, friendly summary.`;

  return askAI(ai, prompt, systemPrompt);
}

// ─── Request handler ────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = getCorsHeaders();

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ─── Route: GET / ───
    if (url.pathname === "/" && request.method === "GET") {
      return Response.json(
        {
          service: "Natural Gate",
          version: "1.0.0",
          description: "AI-powered API gateway for Natural Coches car rental",
          usage: {
            endpoint: "POST /ask",
            body: { query: "your natural language question here" },
            options: {
              explain: "Add ?explain=true to get a human-friendly summary",
              lang: "Supports Spanish, English, Valencian",
            },
          },
          examples: [
            "show me SUVs available in Valencia",
            "how much revenue do we have?",
            "find reservation for maria.garcia@email.com",
            "cancel reservation RES-A1B2C3",
            "what are the stats?",
          ],
        },
        { headers: corsHeaders }
      );
    }

    // ─── Route: GET /health ───
    if (url.pathname === "/health") {
      try {
        const res = await fetchWithTimeout(`${env.BACKEND_URL}/api/stats`);
        const backend = res.ok ? "ok" : `error_${res.status}`;
        return Response.json(
          { gateway: "ok", backend, timestamp: new Date().toISOString() },
          { headers: corsHeaders }
        );
      } catch (err) {
        return Response.json(
          { gateway: "ok", backend: "unreachable", error: err.message },
          { status: 502, headers: corsHeaders }
        );
      }
    }

    // ─── Route: POST /ask ───
    if (url.pathname === "/ask" && request.method === "POST") {
      const startTime = Date.now();

      try {
        let body;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { error: "Invalid JSON body" },
            { status: 400, headers: corsHeaders }
          );
        }

        const query = body.query;
        if (!query || typeof query !== "string" || query.trim().length === 0) {
          return Response.json(
            { error: "Missing 'query' field. Send: {\"query\": \"your question\"}" },
            { status: 400, headers: corsHeaders }
          );
        }

        const explain = url.searchParams.get("explain") === "true";

        // 1. Get API spec
        const spec = await getApiSpec(env.BACKEND_URL);
        if (!spec) {
          return Response.json(
            {
              error: "Could not fetch backend API spec",
              detail: `Worker tried to reach ${env.BACKEND_URL}/api/spec but failed.`,
              solutions: [
                "If testing locally: run 'npx wrangler dev' instead of using the deployed Worker",
                "If using deployed Worker: your backend must be publicly accessible. Set up cloudflared tunnel and update BACKEND_URL in wrangler.toml"
              ],
            },
            { status: 502, headers: corsHeaders }
          );
        }

        // 2. Translate query
        const translation = await translateQuery(env.AI, query, spec);

        if (translation.error) {
          return Response.json(
            {
              error: translation.error,
              suggestion: "Try rephrasing your query. Examples: 'show me SUVs', 'how many reservations', 'get stats'.",
            },
            { status: 400, headers: corsHeaders }
          );
        }

        // 3. Build request
        const method = translation.method || "GET";
        let backendUrl = `${env.BACKEND_URL}${translation.path}`;
        const fetchOpts = { method };

        if (translation.query && Object.keys(translation.query).length > 0) {
          const qs = new URLSearchParams();
          for (const [k, v] of Object.entries(translation.query)) {
            qs.append(k, String(v));
          }
          backendUrl += `?${qs.toString()}`;
        }

        if (translation.body && Object.keys(translation.body).length > 0) {
          fetchOpts.headers = { "Content-Type": "application/json" };
          fetchOpts.body = JSON.stringify(translation.body);
        }

        // 4. Call backend
        const backendRes = await fetchWithTimeout(backendUrl, fetchOpts);

        let data;
        const contentType = backendRes.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await backendRes.json();
        } else {
          data = { raw: await backendRes.text() };
        }

        if (!backendRes.ok) {
          return Response.json(
            {
              error: `Backend returned ${backendRes.status}`,
              translated_to: { method, path: translation.path, query: translation.query, body: translation.body },
              backend_response: data,
            },
            { status: backendRes.status, headers: corsHeaders }
          );
        }

        // 5. Optionally summarize with AI
        let summary = null;
        if (explain) {
          try {
            summary = await formatResponse(env.AI, query, data);
          } catch (err) {
            console.error("Formatting failed:", err.message);
            summary = null;
          }
        }

        // 6. Build response
        const elapsed = Date.now() - startTime;
        const response = {
          query,
          translated_to: {
            method,
            path: translation.path,
            query: translation.query || null,
            body: translation.body || null,
          },
          data,
          ...(summary && { summary }),
          meta: {
            elapsed_ms: elapsed,
            gateway: "natural-gate-v1",
            ai_model: AI_MODEL,
            timestamp: new Date().toISOString(),
          },
        };

        return Response.json(response, { headers: corsHeaders });
      } catch (err) {
        console.error("Gateway error:", err.stack || err.message);
        return Response.json(
          { error: "Gateway error", details: err.message },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // ─── Fallback: proxy any /api/* to backend ───
    if (url.pathname.startsWith("/api/")) {
      try {
        const backendRes = await fetchWithTimeout(
          `${env.BACKEND_URL}${url.pathname}${url.search}`,
          {
            method: request.method,
            headers: request.headers,
            body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
          }
        );

        const contentType = backendRes.headers.get("content-type") || "";
        let data;
        if (contentType.includes("application/json")) {
          data = await backendRes.json();
        } else {
          data = await backendRes.text();
        }

        return new Response(
          typeof data === "string" ? data : JSON.stringify(data),
          {
            status: backendRes.status,
            headers: {
              ...corsHeaders,
              "content-type": contentType || "application/json",
            },
          }
        );
      } catch (err) {
        return Response.json(
          { error: "Backend unreachable", details: err.message },
          { status: 502, headers: corsHeaders }
        );
      }
    }

    return Response.json(
      { error: "Not found. Try POST /ask or GET /health" },
      { status: 404, headers: corsHeaders }
    );
  },
};
