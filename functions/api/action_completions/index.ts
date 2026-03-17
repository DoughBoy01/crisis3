interface Env {
  DB: D1Database;
}

interface User {
  id: string;
  role: string;
}

export const onRequestGet: PagesFunction<Env, any, { user: User }> = async ({ env, data }) => {
  try {
    const sessionId = data.user.id; // Tied to the authenticated session context mapping
    
    // We get today's completions for this session
    const today = new Date().toISOString().slice(0, 10);
    
    const { results } = await env.DB.prepare(
      'SELECT action_id FROM action_completions WHERE session_id = ? AND completed_date = ?'
    )
      .bind(sessionId, today)
      .all();

    const completedIds = results?.map(r => r.action_id) || [];

    return new Response(JSON.stringify(completedIds), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env, any, { user: User }> = async ({ request, env, data }) => {
  try {
    const sessionId = data.user.id;
    const body = await request.json() as any;
    const { action_id, completed } = body;
    
    if (!action_id) return new Response(JSON.stringify({ error: 'Missing action_id' }), { status: 400 });

    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();

    if (completed) {
      // Upsert
      const id = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO action_completions (id, session_id, action_id, completed_date, completed_at) 
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(session_id, action_id, completed_date) DO UPDATE SET completed_at=excluded.completed_at
      `).bind(id, sessionId, action_id, today, now).run();
    } else {
      // Delete
      await env.DB.prepare(
        'DELETE FROM action_completions WHERE session_id = ? AND action_id = ? AND completed_date = ?'
      ).bind(sessionId, action_id, today).run();
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
  }
};
