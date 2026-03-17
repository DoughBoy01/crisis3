interface Env {
  DB: D1Database;
}

interface User {
  id: string;
  role: string;
}

export const onRequestGet: PagesFunction<Env, any, { user: User }> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'scout_topic' or 'news_story'
    
    if (!type) return new Response(JSON.stringify({ error: 'Missing type' }), { status: 400 });
    
    const { results } = await env.DB.prepare(
      'SELECT ref_id FROM dismissed_intel WHERE type = ?'
    ).bind(type).all();

    const ids = results?.map(r => r.ref_id) || [];
    return new Response(JSON.stringify(ids), { status: 200, headers: { 'Content-Type': 'application/json' }});
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch dismissed intel' }), { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env, any, { user: User }> = async ({ request, env, data }) => {
  try {
    const body = await request.json() as any;
    const { type, ref_id, ref_label, category, signal, reason, scouting_run_id } = body;
    const id = crypto.randomUUID();
    const dismissed_by = data.user.id;
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO dismissed_intel 
      (id, type, ref_id, ref_label, category, signal, reason, dismissed_by, dismissed_at, scouting_run_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, type, ref_id, ref_label, category, signal, reason, dismissed_by, now, scouting_run_id, now
    ).run();

    return new Response(JSON.stringify({ success: true, id }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env, any, { user: User }> = async ({ request, env, data }) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const ref_id = url.searchParams.get('ref_id');
    
    if (!type || !ref_id) return new Response(JSON.stringify({ error: 'Missing parts' }), { status: 400 });

    // RLS emulation check — only allow the user who dismissed it, OR an admin, to revert it
    const { results } = await env.DB.prepare('SELECT dismissed_by FROM dismissed_intel WHERE type=? AND ref_id=?').bind(type, ref_id).all();
    if (results && results.length > 0) {
      if (results[0].dismissed_by !== data.user.id && data.user.role !== 'admin') {
         return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
      }
    }

    await env.DB.prepare('DELETE FROM dismissed_intel WHERE type = ? AND ref_id = ?').bind(type, ref_id).run();
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
  }
};
