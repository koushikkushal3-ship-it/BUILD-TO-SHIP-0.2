import { createClient } from '@supabase/supabase-js';

// Anon key only — used exclusively for auth/session state (login, signup, OAuth,
// token refresh). All actual data reads/writes go through the backend API so the
// AI-orchestration logic and provider keys stay server-side.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
