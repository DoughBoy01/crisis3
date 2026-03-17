interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async () => {
  // Clear the session cookie
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `session_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
    }
  });
};
