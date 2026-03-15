import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ScoutTopic {
  id: string;
  label: string;
  query: string;
  category: "energy" | "agricultural" | "freight" | "fertilizer" | "metals" | "fx" | "geopolitical" | "policy";
}

interface TopicIntelligence {
  topic_id: string;
  topic_label: string;
  category: string;
  query: string;
  findings: string[];
  sources: { title: string; url: string }[];
  summary: string;
  signal: "BULLISH" | "BEARISH" | "NEUTRAL" | "WATCH";
  prompt_tokens: number;
  completion_tokens: number;
}

const SCOUT_TOPICS: ScoutTopic[] = [
  {
    id: "energy_overnight",
    label: "Energy Markets Overnight",
    query: "Brent crude oil WTI natural gas price movement today overnight geopolitical supply disruption",
    category: "energy",
  },
  {
    id: "grain_supply",
    label: "Grain & Wheat Supply",
    query: "wheat corn soybeans grain supply Black Sea Ukraine Russia export ban port disruption harvest forecast today",
    category: "agricultural",
  },
  {
    id: "shipping_lanes",
    label: "Shipping Lane Disruptions",
    query: "Red Sea Suez Canal Panama Canal shipping disruption Houthi attack freight rates Baltic Dry Index today",
    category: "freight",
  },
  {
    id: "fertilizer_market",
    label: "Fertilizer Market",
    query: "urea ammonia potash phosphate fertilizer price supply shortage Russia Belarus sanctions today",
    category: "fertilizer",
  },
  {
    id: "metals_outlook",
    label: "Industrial Metals",
    query: "copper aluminium steel iron ore nickel metal price London Metal Exchange LME China demand today",
    category: "metals",
  },
  {
    id: "gbp_fx",
    label: "GBP & Sterling FX",
    query: "GBP USD EUR sterling exchange rate Bank of England interest rate UK inflation CPI today",
    category: "fx",
  },
  {
    id: "geopolitical_risk",
    label: "Geopolitical Risk",
    query: "Middle East conflict Ukraine war sanctions trade restrictions supply chain disruption commodity today",
    category: "geopolitical",
  },
  {
    id: "uk_policy",
    label: "UK Policy & Macro",
    query: "UK economic data Bank of England rate decision UK inflation PMI GDP trade policy today",
    category: "policy",
  },
];

async function scoutTopic(
  openaiApiKey: string,
  topic: ScoutTopic,
): Promise<TopicIntelligence> {
  const systemPrompt = `You are a commodity market intelligence scout specialising in UK agri-food, energy, freight and financial markets.

Your job is to find the most recent and relevant intelligence on a given topic using web search.

Return a structured JSON response with:
- "findings": array of 3-5 specific, factual intelligence items (each as a plain string, no markdown)
- "sources": array of up to 5 source objects with "title" and "url" for the most relevant articles found
- "summary": one sentence executive summary of the overall picture
- "signal": one of BULLISH (prices rising, supply tightening), BEARISH (prices falling, supply easing), NEUTRAL (mixed/stable), or WATCH (developing situation requiring monitoring)

Focus on:
- Specific price levels and % moves where available
- Named supply disruptions, sanctions, weather events
- Forward-looking signals (what happens next)
- UK-specific impact where relevant

Be concise and factual. No fluff.`;

  const userPrompt = `Scout topic: ${topic.label}
Category: ${topic.category}
Search query: ${topic.query}

Find the latest intelligence from today or the last 24 hours. Return JSON only.`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      tools: [{ type: "web_search_preview" }],
      tool_choice: "required",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "topic_intelligence",
          schema: {
            type: "object",
            properties: {
              findings: { type: "array", items: { type: "string" } },
              sources: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    url: { type: "string" },
                  },
                  required: ["title", "url"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string" },
              signal: { type: "string", enum: ["BULLISH", "BEARISH", "NEUTRAL", "WATCH"] },
            },
            required: ["findings", "sources", "summary", "signal"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errText}`);
  }

  const result = await response.json();

  const outputText = result.output?.find((o: { type: string }) => o.type === "message")
    ?.content?.find((c: { type: string }) => c.type === "output_text")
    ?.text ?? "{}";

  let parsed: { findings: string[]; sources: { title: string; url: string }[]; summary: string; signal: string };
  try {
    parsed = JSON.parse(outputText);
  } catch {
    parsed = { findings: [], sources: [], summary: "Parse error", signal: "NEUTRAL" };
  }

  const usage = result.usage ?? {};

  return {
    topic_id: topic.id,
    topic_label: topic.label,
    category: topic.category,
    query: topic.query,
    findings: parsed.findings ?? [],
    sources: parsed.sources ?? [],
    summary: parsed.summary ?? "",
    signal: (parsed.signal as TopicIntelligence["signal"]) ?? "NEUTRAL",
    prompt_tokens: usage.input_tokens ?? 0,
    completion_tokens: usage.output_tokens ?? 0,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const runStarted = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY")!;

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const db = createClient(supabaseUrl, serviceKey);

    const nowUtc = new Date();
    const todayUtc = nowUtc.toISOString().slice(0, 10);

    const body = await req.json().catch(() => ({}));
    const force = body?.force === true;

    if (!force) {
      const { data: existingRun } = await db
        .from("scouting_runs")
        .select("id, triggered_at, completed_at")
        .eq("run_date", todayUtc)
        .maybeSingle();

      if (existingRun?.completed_at) {
        return new Response(
          JSON.stringify({
            skipped: true,
            reason: `Scouting already completed for ${todayUtc} at ${existingRun.triggered_at}. Pass { force: true } to re-scout.`,
            run_date: todayUtc,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const { data: runRecord, error: insertErr } = await db
      .from("scouting_runs")
      .upsert(
        {
          run_date: todayUtc,
          triggered_at: new Date(runStarted).toISOString(),
          forced: force,
          model: "gpt-4o",
          topics_queried: SCOUT_TOPICS.map(t => t.id),
          intelligence: [],
          error: null,
          completed_at: null,
        },
        { onConflict: "run_date" },
      )
      .select("id")
      .maybeSingle();

    if (insertErr) {
      throw new Error(`Failed to create scouting run record: ${insertErr.message}`);
    }

    const runId = runRecord?.id;

    const intelligence: TopicIntelligence[] = [];
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let scoutError: string | null = null;

    for (const topic of SCOUT_TOPICS) {
      try {
        const result = await scoutTopic(openaiApiKey, topic);
        intelligence.push(result);
        totalPromptTokens += result.prompt_tokens;
        totalCompletionTokens += result.completion_tokens;
      } catch (err) {
        intelligence.push({
          topic_id: topic.id,
          topic_label: topic.label,
          category: topic.category,
          query: topic.query,
          findings: [],
          sources: [],
          summary: `Scout failed: ${String(err)}`,
          signal: "NEUTRAL",
          prompt_tokens: 0,
          completion_tokens: 0,
        });
        scoutError = scoutError ?? String(err);
      }
    }

    const completedAt = new Date().toISOString();
    const duration_ms = Date.now() - runStarted;

    if (runId) {
      await db
        .from("scouting_runs")
        .update({
          completed_at: completedAt,
          duration_ms,
          intelligence,
          total_prompt_tokens: totalPromptTokens,
          total_completion_tokens: totalCompletionTokens,
          error: scoutError,
        })
        .eq("id", runId);
    }

    return new Response(
      JSON.stringify({
        success: !scoutError,
        run_date: todayUtc,
        duration_ms,
        topics_scouted: intelligence.length,
        total_prompt_tokens: totalPromptTokens,
        total_completion_tokens: totalCompletionTokens,
        intelligence,
        error: scoutError,
      }),
      {
        status: scoutError ? 207 : 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err), duration_ms: Date.now() - runStarted }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
