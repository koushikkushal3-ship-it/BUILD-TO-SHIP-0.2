import axios from 'axios';
import { supabase } from './supabaseClient.js';

// Every backend route is mounted under /api, but it's easy to set
// VITE_API_BASE_URL to the bare origin instead. That sends every request one
// level too high, where the catch-all 404 answers with {"error":"Not found"}
// — which reads like a missing record rather than a misconfigured URL.
// Normalize here so either form works.
function normalizeBaseUrl(raw) {
  const trimmed = (raw || '').trim().replace(/\/+$/, '');
  if (!trimmed) return trimmed;
  return /\/api$/.test(trimmed) ? trimmed : `${trimmed}/api`;
}

export const apiClient = axios.create({
  baseURL: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
});

// Attach the current Supabase session's access token to every request so the
// backend's requireAuth middleware can verify it.
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
