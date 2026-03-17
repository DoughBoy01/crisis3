interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    // In Postgres: .from('scouting_runs').select('run_date, intelligence').order('run_date', 'desc').limit(1)
    const { results } = await env.DB.prepare(
      'SELECT run_date, intelligence, error FROM scouting_runs ORDER BY run_date DESC LIMIT 1'
    ).all();

    if (!results || results.length === 0) {
       return new Response(JSON.stringify(null), { status: 200, headers: { 'Content-Type': 'application/json' }});
    }
    
    const row = results[0];
    
    return new Response(JSON.stringify({
      ...row,
      intelligence: typeof row.intelligence === 'string' ? JSON.parse(row.intelligence) : []
    }), { status: 200, headers: { 'Content-Type': 'application/json' }});
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
  }
};
