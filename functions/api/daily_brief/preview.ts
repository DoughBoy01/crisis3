interface Env {
  DB: D1Database;
}

interface User {
  id: string;
  role: string;
}

export const onRequestGet: PagesFunction<Env, any, { user: User }> = async ({ request, env, data }) => {
  try {
    if (data.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const date = url.searchParams.get('date');
    const persona = url.searchParams.get('persona');

    if (!date || !persona) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
    }

    const { results } = await env.DB.prepare(
      'SELECT * FROM daily_brief WHERE brief_date = ? AND persona = ? LIMIT 1'
    ).bind(date, persona).all();

    return new Response(JSON.stringify(results[0] || null), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch brief' }), { status: 500 });
  }
};
