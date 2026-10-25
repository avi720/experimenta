import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your Supabase project values.'
  );
}

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

export const supabase = createClient(supabaseUrl ?? 'http://localhost', supabaseAnonKey ?? 'missing-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  ...(realtimeOptions ? { realtime: realtimeOptions } : {}),
});
