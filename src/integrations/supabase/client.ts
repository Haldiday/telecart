import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { createApiDbClient, setAuthTokenProvider } from '@/lib/api/dbClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabaseAuth = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

setAuthTokenProvider(async () => {
  const { data: { session } } = await supabaseAuth.auth.getSession();
  return session?.access_token ?? null;
});

const apiDb = createApiDbClient();

export const supabase = {
  auth: supabaseAuth.auth,
  functions: supabaseAuth.functions,
  channel: supabaseAuth.channel.bind(supabaseAuth),
  removeChannel: supabaseAuth.removeChannel.bind(supabaseAuth),
  from: apiDb.from.bind(apiDb),
  storage: apiDb.storage,
} as typeof supabaseAuth;
