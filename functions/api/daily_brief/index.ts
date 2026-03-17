interface Env {
  DB: D1Database;
}

interface User {
  id: string;
  role: string;
}

export const onRequestGet: PagesFunction<Env, any, { user: User }> = async ({ env }) => {
  try {
    // In Supabase, the RLS policy ensured users could read briefs
    // Assuming 'persona' might be derived from the user's settings, 
    // but for now we fetch the most recent 'general' brief, or all latest briefs
    const { results } = await env.DB.prepare(
      'SELECT * FROM daily_brief ORDER BY brief_date DESC, generated_at DESC LIMIT 1'
    ).all();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: 'No daily brief found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const row = results[0];
    
    // Parse JSON fields safely as they are stored as TEXT in SQLite
    const parsedRow = {
      ...row,
      three_things: safeParse(row.three_things, '[]'),
      action_rationale: safeParse(row.action_rationale, '{}'),
      price_snapshot: safeParseJSON(row.price_snapshot),
      procurement_actions: safeParse(row.procurement_actions, '[]'),
      sector_news_digest: safeParse(row.sector_news_digest, '{}'),
      sector_forward_outlook: safeParse(row.sector_forward_outlook, '{}'),
      top_decision: safeParseJSON(row.top_decision),
      shipping_lane_snapshot: safeParseJSON(row.shipping_lane_snapshot),
      fertilizer_detail: safeParseJSON(row.fertilizer_detail),
    };

    return new Response(JSON.stringify(parsedRow), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch daily brief' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Helper for guaranteed arrays/objects that default to non-null strings in DB
function safeParse(val: unknown, defaultVal: string) {
  if (typeof val !== 'string') val = defaultVal;
  try {
    return JSON.parse(val as string);
  } catch (e) {
    return JSON.parse(defaultVal);
  }
}

// Helper for nullable JSON values
function safeParseJSON(val: unknown) {
  if (!val) return null;
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return null;
  }
}
