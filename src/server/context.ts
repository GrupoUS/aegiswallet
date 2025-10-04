import { createClient } from '@supabase/supabase-js'
import { inferAsyncReturnType } from '@trpc/server'

const supabaseUrl = process.env.SUPABASE_URL || 'https://clvdvpbnuifxedpqgrgo.supabase.co'
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsdmR2cGJudWlmeGVkcHFncmdvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1NzE4OTcsImV4cCI6MjA3NTE0Nzg5N30.Rqo96sWOqURMHrcH53Ez1G8EG-7fY-FGa-SVwbXfCT0'

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/v11/context
 */
export const createContext = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return {
    session,
    supabase,
  }
}

export type Context = inferAsyncReturnType<typeof createContext>
