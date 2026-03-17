interface Env {
  DB: D1Database;
}

interface User {
  id: string;
  role: string;
}

export const onRequestGet: PagesFunction<Env, any, { user: User }> = async ({ env }) => {
  try {
    const { results } = await env.DB.prepare(
      'SELECT * FROM feed_cache ORDER BY fetched_at DESC LIMIT 50'
    ).all();

    if (!results) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Safely parse the text payload back to JSON objects for the frontend
    const parsedResults = results.map(row => {
      let payloadObj = {};
      try {
        payloadObj = row.payload ? JSON.parse(row.payload as string) : {};
      } catch (e) {
        console.error('Failed to parse payload for feed_cache row', row.id);
      }
      return {
        ...row,
        payload: payloadObj
      };
    });

    return new Response(JSON.stringify(parsedResults), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch feed cache' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestPost: PagesFunction<Env, any, { user: User }> = async ({ request, env, data }) => {
  // Ensure only admins can insert new cache items, matching the Supabase logic intention
  // (In Supabase, anon insert was eventually restricted or done by service_role,
  // but let's strictly require authenticated admin here as per user instruction "insert new feed entry (admin only)")
  if (data.user?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json() as any;
    const payload = body.payload;

    if (!payload) {
      return new Response(JSON.stringify({ error: 'Payload is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const id = crypto.randomUUID();
    const payloadStr = JSON.stringify(payload);
    const fetchedAt = body.fetched_at || new Date().toISOString();
    const createdAt = new Date().toISOString();

    await env.DB.prepare(
      'INSERT INTO feed_cache (id, fetched_at, payload, created_at) VALUES (?, ?, ?, ?)'
    )
      .bind(id, fetchedAt, payloadStr, createdAt)
      .run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to insert feed cache' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
