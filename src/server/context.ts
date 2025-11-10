import type { inferAsyncReturnType } from '@trpc/server';
import { createServerClient } from '@/integrations/supabase/factory';

const supabase = createServerClient();

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/v11/context
 */
export const createContext = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    session,
    user: session?.user || null,
    supabase,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
