import { createClient } from '@supabase/supabase-js';

export function resolveSupabaseConfig(env = import.meta.env) {
  const supabaseUrl = env?.VITE_SUPABASE_URL;
  const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your Supabase project values.'
    );
  }

  return { supabaseUrl, supabaseAnonKey };
}

const { supabaseUrl, supabaseAnonKey } = resolveSupabaseConfig();

// In environments where native WebSocket is not available (e.g. headless unit tests or Node < 22),
// provide a dummy transport so client instantiation doesn't throw.
const realtimeOptions =
  typeof globalThis.WebSocket === 'undefined'
    ? {
        transport: class DummyWebSocket {
          addEventListener() {}
          removeEventListener() {}
          send() {}
          close() {}
        },
      }
    : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  ...(realtimeOptions ? { realtime: realtimeOptions } : {}),
});
