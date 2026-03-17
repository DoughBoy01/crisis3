// Translates edge function 'delete-story' to a standard API
interface Env {
  DB: D1Database;
}

interface User {
  id: string;
  role: string;
}

export const onRequestPost: PagesFunction<Env, any, { user: User }> = async ({ request, env, data }) => {
  try {
    // Requires admin privileges
    if (data.user?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const { feedFetchedAt, sourceName, storyLink } = await request.json() as any;
    
    if (!feedFetchedAt || !sourceName || !storyLink) {
       return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400 });
    }

    // 1. Fetch current payload
    const res = await env.DB.prepare('SELECT id, payload FROM feed_cache WHERE fetched_at = ? LIMIT 1').bind(feedFetchedAt).all();
    if (!res.results || res.results.length === 0) {
      return new Response(JSON.stringify({ error: 'Feed not found' }), { status: 404 });
    }

    const row = res.results[0];
    const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;

    if (!payload?.sources) {
      return new Response(JSON.stringify({ error: 'Invalid payload structure' }), { status: 500 });
    }

    // 2. Mutate: Remove the story
    let modified = false;
    for (const source of payload.sources) {
      if (source.source_name === sourceName && source.items) {
        const initialLen = source.items.length;
        source.items = source.items.filter((item: any) => item.link !== storyLink);
        if (source.items.length < initialLen) modified = true;
      }
    }

    if (!modified) {
      return new Response(JSON.stringify({ error: 'Story not found or no changes made' }), { status: 404 });
    }

    // 3. Save modified payload back
    const payloadStr = JSON.stringify(payload);
    await env.DB.prepare('UPDATE feed_cache SET payload = ? WHERE id = ?').bind(payloadStr, row.id).run();

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
  }
};
