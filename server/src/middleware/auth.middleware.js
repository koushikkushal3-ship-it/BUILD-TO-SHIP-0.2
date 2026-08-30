import { supabaseAdmin } from '../lib/supabaseClient.js';

// Verifies the Supabase-issued JWT sent by the frontend (Authorization: Bearer <token>).
// Supabase Auth (GoTrue) already handled credential hashing and token issuance —
// this middleware just confirms the token is valid and attaches the user to req.
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' });
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = { id: data.user.id, email: data.user.email };
  next();
}
