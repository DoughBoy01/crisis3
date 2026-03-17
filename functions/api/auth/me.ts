interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface User {
  id: string;
  role: string;
}

export const onRequestGet: PagesFunction<Env, any, { user: User }> = async ({ data }) => {
  // If we reach this handler, the generic JWT middleware in _middleware.ts
  // has already validated the session (either via Cookie or Header) and attached
  // the resulting user object to the context.data plane.
  
  if (!data.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ user: data.user }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
