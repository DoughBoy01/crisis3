interface Env {
  DB: D1Database;
}

interface User {
  id: string;
  role: string;
}

export const onRequestGet: PagesFunction<Env, any, { user: User }> = async ({ env, data }) => {
  try {
    if (data.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin only' }), { status: 403 });
    }

    // From components/AgentRunHistory.tsx: supabase.from('pipeline_runs').select('*').order('triggered_at', { ascending: false }).limit(20)
    const { results: runResults } = await env.DB.prepare(
      'SELECT * FROM pipeline_runs ORDER BY triggered_at DESC LIMIT 20'
    ).all();

    // The frontend expects the logs field to be parsed
    const parsedRuns = (runResults || []).map(row => ({
      ...row,
      logs: row.logs ? (typeof row.logs === 'string' ? JSON.parse(row.logs) : row.logs) : [],
      forced: row.forced === 1 // Convert D1 integer 1/0 back to boolean true/false
    }));

    return new Response(JSON.stringify(parsedRuns), { status: 200, headers: { 'Content-Type': 'application/json' }});
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch agent run history' }), { status: 500 });
  }
};
