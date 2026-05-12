import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Backend URL — points to Supabase Edge Functions in production / mobile
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ||
  `${supabaseUrl}/functions/v1`;

/**
 * Authenticated fetch wrapper for admin-only edge function calls.
 * Automatically attaches the current user's JWT as a Bearer token.
 */
export const adminFetch = async (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  return fetch(`${BACKEND_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  });
};
