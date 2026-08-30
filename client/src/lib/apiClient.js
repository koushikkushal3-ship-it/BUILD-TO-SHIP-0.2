import axios from 'axios';
import { supabase } from './supabaseClient.js';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Attach the current Supabase session's access token to every request so the
// backend's requireAuth middleware can verify it.
apiClient.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
