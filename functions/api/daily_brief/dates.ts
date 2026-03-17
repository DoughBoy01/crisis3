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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { results } = await env.DB.prepare(
      'SELECT brief_date FROM daily_brief ORDER BY brief_date DESC LIMIT 70'
    ).all();

    return new Response(JSON.stringify(results), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch brief dates' }), { status: 500 });
  }
};
