/**
 * Smart Gateway — Cloudflare Worker
 * 
 * An intelligent API gateway that translates natural language queries
 * into backend API calls using AI Models, then formats the response.
 * 
 * Deploy: wrangler deploy
 */

// ─── API Spec (cached in Worker, fetched from backend on first request) ─────

let cachedSpec = null;

async function getApiSpec(backendUrl) {
  if (cachedSpec) return cachedSpec;
  try {
    const res = await fetch(`${backendUrl}/api/spec`);
    cachedSpec = await res.json();
    return cachedSpec;
  } catch {
    return null;
  }
}

// ─── Workers AI integration (binding nativo, sin API key) ───────────────────

const AI_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

async function askInferenceServer(ai, prompt, systemPrompt) {
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

// ─── Natural language → API call translation ────────────────────────────────

async function translateQuery(apiKey, query, spec) {
  const systemPrompt = `You are an API routing engine. Given a natural language query and an API specification, determine which endpoint to call and with what parameters.

AVAILABLE ENDPOINTS:
${JSON.stringify(spec.endpoints, null, 2)}

RULES:
- Respond ONLY with a JSON object, no markdown, no explanation.
- Format: {"method": "GET", "path": "/api/...", "params": {"key": "value"}}
- If the query doesn't match any endpoint, respond: {"error": "No matching endpoint found"}
- Infer filters from context (e.g. "active users" → active=true)
- Understand Spanish, English, Valencian, and other languages.
- Today's date is ${new Date().toISOString().split("T")[0]}
- "last month" means since one month ago, "this year" means since January, etc.`;

  const raw = await askInferenceServer(apiKey, query, systemPrompt);

  try {
    const cleaned = raw.replace(/```json\s?|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return { error: "Failed to parse response", raw };
  }
}

// ─── Response formatting ────────────────────────────────────────────────────

async function formatResponse(apiKey, query, data, explain) {
  if (!explain) return null;

  const systemPrompt = `You are a helpful API assistant. The user asked a question in natural language, and the backend returned data. Provide a brief, friendly summary of the results in the same language the user used. Be concise (2-3 sentences max). Do not repeat all the raw data, just summarize the key points.`;

  const prompt = `User asked: "${query}"
API returned: ${JSON.stringify(data)}
Summarize the results.`;

  return askInferenceServer(apiKey, prompt, systemPrompt);
}

// ─── Request handler ────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ─── Route: GET / ─── Landing info
    if (url.pathname === "/" && request.method === "GET") {
      return Response.json(
        {
          service: "Smart Gateway",
          version: "1.0.0",
          usage: {
            endpoint: "POST /ask",
            body: { query: "your natural language question here" },
            options: {
              explain: "Add ?explain=true to get a human-friendly summary",
              lang: "Supports any language (Spanish, English, Valencian...)",
            },
          },
          examples: [
            "dame los usuarios activos",
            "show me pending orders",
            "quins productes de seguretat teniu?",
            "cuánto hemos facturado este mes?",
            "get me the stats",
          ],
        },
        { headers: corsHeaders }
      );
    }

    // ─── Route: GET /health ───
    if (url.pathname === "/health") {
      // Check backend connectivity
      try {
        const res = await fetch(`${env.BACKEND_URL}/`);
        const backend = await res.json();
        return Response.json(
          { gateway: "ok", backend: "ok", backend_version: backend.version },
          { headers: corsHeaders }
        );
      } catch (err) {
        return Response.json(
          { gateway: "ok", backend: "unreachable", error: err.message },
          { status: 502, headers: corsHeaders }
        );
      }
    }

    // ─── Route: POST /ask ─── Main gateway endpoint
    if (url.pathname === "/ask" && request.method === "POST") {
      const startTime = Date.now();

      try {
        const body = await request.json();
        const query = body.query;

        if (!query || typeof query !== "string") {
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
            { error: "Could not fetch backend API spec" },
            { status: 502, headers: corsHeaders }
          );
        }

        // 2. Translate natural language → API call
        const translation = await translateQuery(env.AI, query, spec);

        if (translation.error) {
          return Response.json(
            {
              error: translation.error,
              suggestion: "Try rephrasing your query or ask 'GET /' for available endpoints.",
            },
            { status: 400, headers: corsHeaders }
          );
        }

        // 3. Build backend URL with params
        let backendPath = translation.path;
        if (translation.params && Object.keys(translation.params).length > 0) {
          const qs = new URLSearchParams();
          for (const [k, v] of Object.entries(translation.params)) {
            qs.append(k, String(v));
          }
          backendPath += `?${qs.toString()}`;
        }

        // 4. Call backend via tunnel
        const backendRes = await fetch(`${env.BACKEND_URL}${backendPath}`, {
          method: translation.method || "GET",
        });

        if (!backendRes.ok) {
          return Response.json(
            {
              error: `Backend returned ${backendRes.status}`,
              translated_to: { method: translation.method, path: backendPath },
            },
            { status: backendRes.status, headers: corsHeaders }
          );
        }

        const data = await backendRes.json();

        // 5. Optionally format with Claude
        let summary = null;
        if (explain) {
          summary = await formatResponse(env.AI, query, data, explain);
        }

        // 6. Build response
        const elapsed = Date.now() - startTime;
        const response = {
          query,
          translated_to: {
            method: translation.method,
            path: backendPath,
          },
          data,
          ...(summary && { summary }),
          meta: {
            elapsed_ms: elapsed,
            gateway: "smart-gateway-v1",
            timestamp: new Date().toISOString(),
          },
        };

        return Response.json(response, { headers: corsHeaders });
      } catch (err) {
        return Response.json(
          { error: "Gateway error", details: err.message },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // ─── Fallback: proxy to backend ───
    if (url.pathname.startsWith("/api/")) {
      try {
        const backendRes = await fetch(`${env.BACKEND_URL}${url.pathname}${url.search}`, {
          method: request.method,
          headers: request.headers,
          body: request.method !== "GET" ? request.body : undefined,
        });
        const data = await backendRes.json();
        return Response.json(data, {
          status: backendRes.status,
          headers: corsHeaders,
        });
      } catch (err) {
        return Response.json(
          { error: "Backend unreachable", details: err.message },
          { status: 502, headers: corsHeaders }
        );
      }
    }

    return Response.json(
      { error: "Not found. Try POST /ask or GET /" },
      { status: 404, headers: corsHeaders }
    );
  },
};
