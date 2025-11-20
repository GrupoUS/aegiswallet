import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { createServerClient } from '@/integrations/supabase/factory';

const supabase = createServerClient();

export interface CreateContextOptions {
  session: Session | null;
  user: User | null;
  supabase: SupabaseClient;
}

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/v11/context
 */
export const createContext = async (): Promise<CreateContextOptions> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    session,
    user: session?.user ?? null,
    supabase,
  };
};

export type Context = CreateContextOptions;
