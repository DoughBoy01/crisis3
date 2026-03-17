interface Env {
  DB: D1Database;
}

interface User {
  id: string;
  role: string;
}

export const onRequestGet: PagesFunction<Env, any, { user: User }> = async ({ request, env, data }) => {
  try {
    const url = new URL(request.url);
    const persona = url.searchParams.get('persona') || 'general';
    const limit = parseInt(url.searchParams.get('limit') || '5', 10);
    
    // Auth check based on persona - here assuming all authenticated users can view, but role checking can be added
    
    // In postgres it was: select * from supabase.from('daily_brief').eq('persona', persona).order('brief_date', 'desc').limit(limit)
    const { results } = await env.DB.prepare(
      'SELECT brief_date, narrative, three_things FROM daily_brief WHERE persona = ? ORDER BY brief_date DESC LIMIT ?'
    )
      .bind(persona, limit)
      .all();

    if (!results) {
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' }});
    }

    // Safely parse JSON strings
    const parsed = results.map(row => ({
      ...row,
      three_things: typeof row.three_things === 'string' ? JSON.parse(row.three_things) : row.three_things || []
    }));

    return new Response(JSON.stringify(parsed), { status: 200, headers: { 'Content-Type': 'application/json' }});
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
  }
};
