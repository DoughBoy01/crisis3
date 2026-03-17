import { signJwt } from '../../_middleware';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json() as any;
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // NOTE: In a real migration, D1 needs a users table containing hashed passwords.
    // For this scaffold, we simulate a DB query that authenticates against a hypothetical 'users' table.
    
    // Example:
    // const { results } = await env.DB.prepare('SELECT id, role, password_hash FROM users WHERE email = ?').bind(email).all();
    // if (!results || results.length === 0 || !(await checkPasswordSync(password, results[0].password_hash))) { ... }
    
    // Hardcoded mock for scaffold example (REPLACE WITH REAL D1 QUERY AND HASHING)
    if (email === 'admin@example.com' && password === 'admin') {
      const mockUser = { id: 'admin-123', role: 'admin' };
      
      const token = await signJwt({ sub: mockUser.id, role: mockUser.role }, env.JWT_SECRET);

      return new Response(JSON.stringify({ user: mockUser }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': `session_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
        }
      });
    } else {
       return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
