import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';

import { supabase } from '@/integrations/supabase/client';
import type { AppRouter } from '@/server/trpc';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      async headers() {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          return {
            Authorization: `Bearer ${session.access_token}`,
          };
        }

        return {};
      }, transformer: superjson, url: '/api/trpc',
    }),
  ],
});
