import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { createRequestScopedClient } from '@/integrations/supabase/factory';

export interface CreateContextOptions {
  req: FetchCreateContextFnOptions['req'];
  session: Session | null;
  user: User | null; // Can be null initially, but non-null after protectedProcedure
  supabase: SupabaseClient;
}

const buildSession = (token: string, user: User): Session => ({
  access_token: token, expires_at: null, expires_in: 0, provider_refresh_token: null, provider_token: null, refresh_token: null, token_type: 'bearer', user,
});

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/v11/context
 */
export const createContext = async (
  opts: FetchCreateContextFnOptions
): Promise<CreateContextOptions> => {
  const authHeader = opts.req.headers.get('Authorization');
  const accessToken = authHeader?.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '').trim()
    : undefined;

  const supabase = createRequestScopedClient(accessToken);

  let session: Session | null = null;
  let user: User | null = null;

  if (accessToken) {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data.user) {
      user = data.user;
      session = buildSession(accessToken, data.user);
    }
  }

  return {
    req: opts.req,
    session,
    supabase,
    user,
  };
};

export type Context = CreateContextOptions;
