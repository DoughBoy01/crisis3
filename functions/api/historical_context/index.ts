interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    
    let results: any[] = [];
    
    if (type === 'percentiles') {
      const dbRes = await env.DB.prepare('SELECT * FROM commodity_percentiles').all();
      results = dbRes.results || [];
    } else if (type === 'seasonality') {
      const dbRes = await env.DB.prepare('SELECT * FROM commodity_seasonal_patterns').all();
      results = dbRes.results || [];
    } else if (type === 'conflicts') {
       const dbRes = await env.DB.prepare('SELECT * FROM conflict_zone_baselines').all();
       results = dbRes.results || [];
       // parse JSON arrays
       results = results.map(row => ({
         ...row,
         comparable_events: row.comparable_events ? JSON.parse(row.comparable_events as string) : []
       }));
    } else {
      return new Response(JSON.stringify({ error: 'Invalid type param' }), { status: 400 });
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
  }
};
