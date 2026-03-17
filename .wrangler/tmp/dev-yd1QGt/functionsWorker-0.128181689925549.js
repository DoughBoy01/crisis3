var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-Epr5Hc/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/pages-BabGJd/functionsWorker-0.128181689925549.mjs
var __defProp2 = Object.defineProperty;
var __name2 = /* @__PURE__ */ __name((target, value) => __defProp2(target, "name", { value, configurable: true }), "__name");
var urls2 = /* @__PURE__ */ new Set();
function checkURL2(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls2.has(url.toString())) {
      urls2.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL2, "checkURL");
__name2(checkURL2, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL2(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});
function base64urlEncode(source) {
  let encoded;
  if (typeof source === "string") {
    encoded = btoa(source);
  } else {
    encoded = btoa(String.fromCharCode(...new Uint8Array(source)));
  }
  return encoded.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
__name(base64urlEncode, "base64urlEncode");
__name2(base64urlEncode, "base64urlEncode");
function base64urlDecode(encoded) {
  const pad = encoded.length % 4;
  let b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  if (pad) {
    b64 += "=".repeat(4 - pad);
  }
  return atob(b64);
}
__name(base64urlDecode, "base64urlDecode");
__name2(base64urlDecode, "base64urlDecode");
async function verifyJwt(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, signatureB64] = parts;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify("HMAC", key, signature, data);
    if (!isValid) return null;
    const payloadStr = base64urlDecode(payloadB64);
    const payload = JSON.parse(payloadStr);
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}
__name(verifyJwt, "verifyJwt");
__name2(verifyJwt, "verifyJwt");
async function signJwt(payload, secret, expiresInSeconds = 86400) {
  const encoder = new TextEncoder();
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const finalPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1e3) + expiresInSeconds
  };
  const encodedPayload = base64urlEncode(JSON.stringify(finalPayload));
  const datatoSign = encoder.encode(`${encodedHeader}.${encodedPayload}`);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, datatoSign);
  const encodedSignature = base64urlEncode(signatureBuffer);
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}
__name(signJwt, "signJwt");
__name2(signJwt, "signJwt");
var onRequest = /* @__PURE__ */ __name2(async (context) => {
  const { request, env, next } = context;
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      },
      status: 204
    });
  }
  const url = new URL(request.url);
  if (url.pathname === "/api/auth/login") {
    const response2 = await next();
    response2.headers.set("Access-Control-Allow-Origin", "*");
    return response2;
  }
  if (url.pathname.startsWith("/api/")) {
    let token = "";
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      const cookieHeader = request.headers.get("Cookie");
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split("; ").map((c) => {
            const parts = c.split("=");
            return [parts[0], parts.slice(1).join("=")];
          })
        );
        if (cookies["session_token"]) {
          token = cookies["session_token"];
        }
      }
    }
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    const payload = await verifyJwt(token, env.JWT_SECRET);
    if (!payload) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
    context.data.user = { id: payload.sub, role: payload.role };
  }
  const response = await next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  return response;
}, "onRequest");
var onRequestPost = /* @__PURE__ */ __name2(async ({ request, env }) => {
  try {
    const body = await request.json();
    const { email, password } = body;
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (email === "admin@example.com" && password === "admin") {
      const mockUser = { id: "admin-123", role: "admin" };
      const token = await signJwt({ sub: mockUser.id, role: mockUser.role }, env.JWT_SECRET);
      return new Response(JSON.stringify({ user: mockUser }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `session_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
        }
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");
var onRequestPost2 = /* @__PURE__ */ __name2(async () => {
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `session_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
    }
  });
}, "onRequestPost");
var onRequestGet = /* @__PURE__ */ __name2(async ({ data }) => {
  if (!data.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  return new Response(JSON.stringify({ user: data.user }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}, "onRequestGet");
var onRequestPost3 = /* @__PURE__ */ __name2(async ({ request, env, data }) => {
  try {
    const { password } = await request.json();
    if (!password || password.length < 8) {
      return new Response(JSON.stringify({ error: "Invalid password" }), { status: 400 });
    }
    const userId = data.user?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", passwordData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedPassword = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(hashedPassword, userId).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to update password" }), { status: 500 });
  }
}, "onRequestPost");
var onRequestGet2 = /* @__PURE__ */ __name2(async ({ env, data }) => {
  try {
    if (data.user?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const { results } = await env.DB.prepare(
      "SELECT brief_date FROM daily_brief ORDER BY brief_date DESC LIMIT 70"
    ).all();
    return new Response(JSON.stringify(results), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch brief dates" }), { status: 500 });
  }
}, "onRequestGet");
var onRequestGet3 = /* @__PURE__ */ __name2(async ({ request, env, data }) => {
  try {
    if (data.user?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    const url = new URL(request.url);
    const date = url.searchParams.get("date");
    const persona = url.searchParams.get("persona");
    if (!date || !persona) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400 });
    }
    const { results } = await env.DB.prepare(
      "SELECT * FROM daily_brief WHERE brief_date = ? AND persona = ? LIMIT 1"
    ).bind(date, persona).all();
    return new Response(JSON.stringify(results[0] || null), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch brief" }), { status: 500 });
  }
}, "onRequestGet");
var onRequestGet4 = /* @__PURE__ */ __name2(async ({ request, env }) => {
  const upgradeHeader = request.headers.get("Upgrade");
  if (!upgradeHeader || upgradeHeader !== "websocket") {
    return new Response("Expected Upgrade: websocket", { status: 426 });
  }
  if (!env.MARKET_FEED_ROOM) {
    return new Response("MARKET_FEED_ROOM binding is missing", { status: 500 });
  }
  const id = env.MARKET_FEED_ROOM.idFromName("global_market_feed");
  const stub = env.MARKET_FEED_ROOM.get(id);
  return stub.fetch(request);
}, "onRequestGet");
var onRequestGet5 = /* @__PURE__ */ __name2(async ({ env, data }) => {
  try {
    const sessionId = data.user.id;
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const { results } = await env.DB.prepare(
      "SELECT action_id FROM action_completions WHERE session_id = ? AND completed_date = ?"
    ).bind(sessionId, today).all();
    const completedIds = results?.map((r) => r.action_id) || [];
    return new Response(JSON.stringify(completedIds), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
  }
}, "onRequestGet");
var onRequestPost4 = /* @__PURE__ */ __name2(async ({ request, env, data }) => {
  try {
    const sessionId = data.user.id;
    const body = await request.json();
    const { action_id, completed } = body;
    if (!action_id) return new Response(JSON.stringify({ error: "Missing action_id" }), { status: 400 });
    const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (completed) {
      const id = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO action_completions (id, session_id, action_id, completed_date, completed_at) 
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(session_id, action_id, completed_date) DO UPDATE SET completed_at=excluded.completed_at
      `).bind(id, sessionId, action_id, today, now).run();
    } else {
      await env.DB.prepare(
        "DELETE FROM action_completions WHERE session_id = ? AND action_id = ? AND completed_date = ?"
      ).bind(sessionId, action_id, today).run();
    }
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
  }
}, "onRequestPost");
var onRequestGet6 = /* @__PURE__ */ __name2(async ({ env, data }) => {
  try {
    if (data.user?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden: Admin only" }), { status: 403 });
    }
    const { results: runResults } = await env.DB.prepare(
      "SELECT * FROM pipeline_runs ORDER BY triggered_at DESC LIMIT 20"
    ).all();
    const parsedRuns = (runResults || []).map((row) => ({
      ...row,
      logs: row.logs ? typeof row.logs === "string" ? JSON.parse(row.logs) : row.logs : [],
      forced: row.forced === 1
      // Convert D1 integer 1/0 back to boolean true/false
    }));
    return new Response(JSON.stringify(parsedRuns), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch agent run history" }), { status: 500 });
  }
}, "onRequestGet");
var onRequestGet7 = /* @__PURE__ */ __name2(async ({ env }) => {
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM daily_brief ORDER BY brief_date DESC, generated_at DESC LIMIT 1"
    ).all();
    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: "No daily brief found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const row = results[0];
    const parsedRow = {
      ...row,
      three_things: safeParse(row.three_things, "[]"),
      action_rationale: safeParse(row.action_rationale, "{}"),
      price_snapshot: safeParseJSON(row.price_snapshot),
      procurement_actions: safeParse(row.procurement_actions, "[]"),
      sector_news_digest: safeParse(row.sector_news_digest, "{}"),
      sector_forward_outlook: safeParse(row.sector_forward_outlook, "{}"),
      top_decision: safeParseJSON(row.top_decision),
      shipping_lane_snapshot: safeParseJSON(row.shipping_lane_snapshot),
      fertilizer_detail: safeParseJSON(row.fertilizer_detail)
    };
    return new Response(JSON.stringify(parsedRow), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch daily brief" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
function safeParse(val, defaultVal) {
  if (typeof val !== "string") val = defaultVal;
  try {
    return JSON.parse(val);
  } catch (e) {
    return JSON.parse(defaultVal);
  }
}
__name(safeParse, "safeParse");
__name2(safeParse, "safeParse");
function safeParseJSON(val) {
  if (!val) return null;
  if (typeof val !== "string") return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return null;
  }
}
__name(safeParseJSON, "safeParseJSON");
__name2(safeParseJSON, "safeParseJSON");
var onRequestGet8 = /* @__PURE__ */ __name2(async ({ request, env, data }) => {
  try {
    const url = new URL(request.url);
    const persona = url.searchParams.get("persona") || "general";
    const limit = parseInt(url.searchParams.get("limit") || "5", 10);
    const { results } = await env.DB.prepare(
      "SELECT brief_date, narrative, three_things FROM daily_brief WHERE persona = ? ORDER BY brief_date DESC LIMIT ?"
    ).bind(persona, limit).all();
    if (!results) {
      return new Response(JSON.stringify([]), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    const parsed = results.map((row) => ({
      ...row,
      three_things: typeof row.three_things === "string" ? JSON.parse(row.three_things) : row.three_things || []
    }));
    return new Response(JSON.stringify(parsed), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
  }
}, "onRequestGet");
var onRequestPost5 = /* @__PURE__ */ __name2(async ({ request, env, data }) => {
  try {
    if (data.user?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }
    const { feedFetchedAt, sourceName, storyLink } = await request.json();
    if (!feedFetchedAt || !sourceName || !storyLink) {
      return new Response(JSON.stringify({ error: "Missing params" }), { status: 400 });
    }
    const res = await env.DB.prepare("SELECT id, payload FROM feed_cache WHERE fetched_at = ? LIMIT 1").bind(feedFetchedAt).all();
    if (!res.results || res.results.length === 0) {
      return new Response(JSON.stringify({ error: "Feed not found" }), { status: 404 });
    }
    const row = res.results[0];
    const payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
    if (!payload?.sources) {
      return new Response(JSON.stringify({ error: "Invalid payload structure" }), { status: 500 });
    }
    let modified = false;
    for (const source of payload.sources) {
      if (source.source_name === sourceName && source.items) {
        const initialLen = source.items.length;
        source.items = source.items.filter((item) => item.link !== storyLink);
        if (source.items.length < initialLen) modified = true;
      }
    }
    if (!modified) {
      return new Response(JSON.stringify({ error: "Story not found or no changes made" }), { status: 404 });
    }
    const payloadStr = JSON.stringify(payload);
    await env.DB.prepare("UPDATE feed_cache SET payload = ? WHERE id = ?").bind(payloadStr, row.id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
  }
}, "onRequestPost");
var onRequestGet9 = /* @__PURE__ */ __name2(async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    if (!type) return new Response(JSON.stringify({ error: "Missing type" }), { status: 400 });
    const { results } = await env.DB.prepare(
      "SELECT ref_id FROM dismissed_intel WHERE type = ?"
    ).bind(type).all();
    const ids = results?.map((r) => r.ref_id) || [];
    return new Response(JSON.stringify(ids), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch dismissed intel" }), { status: 500 });
  }
}, "onRequestGet");
var onRequestPost6 = /* @__PURE__ */ __name2(async ({ request, env, data }) => {
  try {
    const body = await request.json();
    const { type, ref_id, ref_label, category, signal, reason, scouting_run_id } = body;
    const id = crypto.randomUUID();
    const dismissed_by = data.user.id;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(`
      INSERT INTO dismissed_intel 
      (id, type, ref_id, ref_label, category, signal, reason, dismissed_by, dismissed_at, scouting_run_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      type,
      ref_id,
      ref_label,
      category,
      signal,
      reason,
      dismissed_by,
      now,
      scouting_run_id,
      now
    ).run();
    return new Response(JSON.stringify({ success: true, id }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
  }
}, "onRequestPost");
var onRequestDelete = /* @__PURE__ */ __name2(async ({ request, env, data }) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const ref_id = url.searchParams.get("ref_id");
    if (!type || !ref_id) return new Response(JSON.stringify({ error: "Missing parts" }), { status: 400 });
    const { results } = await env.DB.prepare("SELECT dismissed_by FROM dismissed_intel WHERE type=? AND ref_id=?").bind(type, ref_id).all();
    if (results && results.length > 0) {
      if (results[0].dismissed_by !== data.user.id && data.user.role !== "admin") {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
      }
    }
    await env.DB.prepare("DELETE FROM dismissed_intel WHERE type = ? AND ref_id = ?").bind(type, ref_id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
  }
}, "onRequestDelete");
var onRequestGet10 = /* @__PURE__ */ __name2(async ({ env }) => {
  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM feed_cache ORDER BY fetched_at DESC LIMIT 50"
    ).all();
    if (!results) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    const parsedResults = results.map((row) => {
      let payloadObj = {};
      try {
        payloadObj = row.payload ? JSON.parse(row.payload) : {};
      } catch (e) {
        console.error("Failed to parse payload for feed_cache row", row.id);
      }
      return {
        ...row,
        payload: payloadObj
      };
    });
    return new Response(JSON.stringify(parsedResults), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch feed cache" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var onRequestPost7 = /* @__PURE__ */ __name2(async ({ request, env, data }) => {
  if (data.user?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const payload = body.payload;
    if (!payload) {
      return new Response(JSON.stringify({ error: "Payload is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const id = crypto.randomUUID();
    const payloadStr = JSON.stringify(payload);
    const fetchedAt = body.fetched_at || (/* @__PURE__ */ new Date()).toISOString();
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare(
      "INSERT INTO feed_cache (id, fetched_at, payload, created_at) VALUES (?, ?, ?, ?)"
    ).bind(id, fetchedAt, payloadStr, createdAt).run();
    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to insert feed cache" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestPost");
var onRequestGet11 = /* @__PURE__ */ __name2(async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    let results = [];
    if (type === "percentiles") {
      const dbRes = await env.DB.prepare("SELECT * FROM commodity_percentiles").all();
      results = dbRes.results || [];
    } else if (type === "seasonality") {
      const dbRes = await env.DB.prepare("SELECT * FROM commodity_seasonal_patterns").all();
      results = dbRes.results || [];
    } else if (type === "conflicts") {
      const dbRes = await env.DB.prepare("SELECT * FROM conflict_zone_baselines").all();
      results = dbRes.results || [];
      results = results.map((row) => ({
        ...row,
        comparable_events: row.comparable_events ? JSON.parse(row.comparable_events) : []
      }));
    } else {
      return new Response(JSON.stringify({ error: "Invalid type param" }), { status: 400 });
    }
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
  }
}, "onRequestGet");
var onRequestGet12 = /* @__PURE__ */ __name2(async ({ env }) => {
  try {
    const { results } = await env.DB.prepare(
      "SELECT run_date, intelligence, error FROM scouting_runs ORDER BY run_date DESC LIMIT 1"
    ).all();
    if (!results || results.length === 0) {
      return new Response(JSON.stringify(null), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    const row = results[0];
    return new Response(JSON.stringify({
      ...row,
      intelligence: typeof row.intelligence === "string" ? JSON.parse(row.intelligence) : []
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
  }
}, "onRequestGet");
var onRequestGet13 = /* @__PURE__ */ __name2(async ({ env, data }) => {
  try {
    const sessionId = data.user.id;
    const { results } = await env.DB.prepare(
      "SELECT * FROM user_settings WHERE session_id = ?"
    ).bind(sessionId).all();
    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: "Settings not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(results[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch user settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestGet");
var onRequestPatch = /* @__PURE__ */ __name2(async ({ request, env, data }) => {
  try {
    const sessionId = data.user.id;
    const body = await request.json();
    const { timezone } = body;
    if (timezone) {
      await env.DB.prepare(
        "UPDATE user_settings SET timezone = ?, updated_at = ? WHERE session_id = ?"
      ).bind(timezone, (/* @__PURE__ */ new Date()).toISOString(), sessionId).run();
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to update user settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}, "onRequestPatch");
var routes = [
  {
    routePath: "/api/auth/login",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/auth/logout",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/auth/me",
    mountPath: "/api/auth",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/auth/update_password",
    mountPath: "/api/auth",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/daily_brief/dates",
    mountPath: "/api/daily_brief",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/daily_brief/preview",
    mountPath: "/api/daily_brief",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/feed_cache/connect",
    mountPath: "/api/feed_cache",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/action_completions",
    mountPath: "/api/action_completions",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/action_completions",
    mountPath: "/api/action_completions",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost4]
  },
  {
    routePath: "/api/agent_run_history",
    mountPath: "/api/agent_run_history",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/daily_brief",
    mountPath: "/api/daily_brief",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/api/daily_diff",
    mountPath: "/api/daily_diff",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/api/delete_story",
    mountPath: "/api/delete_story",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost5]
  },
  {
    routePath: "/api/dismissed_intel",
    mountPath: "/api/dismissed_intel",
    method: "DELETE",
    middlewares: [],
    modules: [onRequestDelete]
  },
  {
    routePath: "/api/dismissed_intel",
    mountPath: "/api/dismissed_intel",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
  },
  {
    routePath: "/api/dismissed_intel",
    mountPath: "/api/dismissed_intel",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost6]
  },
  {
    routePath: "/api/feed_cache",
    mountPath: "/api/feed_cache",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet10]
  },
  {
    routePath: "/api/feed_cache",
    mountPath: "/api/feed_cache",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost7]
  },
  {
    routePath: "/api/historical_context",
    mountPath: "/api/historical_context",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet11]
  },
  {
    routePath: "/api/scout_intel",
    mountPath: "/api/scout_intel",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet12]
  },
  {
    routePath: "/api/user_settings",
    mountPath: "/api/user_settings",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet13]
  },
  {
    routePath: "/api/user_settings",
    mountPath: "/api/user_settings",
    method: "PATCH",
    middlewares: [],
    modules: [onRequestPatch]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "",
    middlewares: [onRequest],
    modules: []
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
__name2(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name2(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name2(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name2(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name2(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name2(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
__name2(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
__name2(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name2(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
__name2(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
__name2(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
__name2(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
__name2(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
__name2(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
__name2(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
__name2(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");
__name2(pathToRegexp, "pathToRegexp");
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
__name2(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name2(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name2(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name2((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
var drainBody = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
__name2(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name2(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
__name2(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
__name2(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");
__name2(__facade_invoke__, "__facade_invoke__");
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  static {
    __name(this, "___Facade_ScheduledController__");
  }
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name2(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name2(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name2(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
__name2(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name2((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name2((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
__name2(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default2 = drainBody2;

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
__name(reduceError2, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default2 = jsonError2;

// .wrangler/tmp/bundle-Epr5Hc/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// ../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
__name(__facade_register__2, "__facade_register__");
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__2, "__facade_invokeChain__");
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}
__name(__facade_invoke__2, "__facade_invoke__");

// .wrangler/tmp/bundle-Epr5Hc/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class ___Facade_ScheduledController__2 {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler2, "wrapExportedHandler");
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint2, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.128181689925549.js.map
