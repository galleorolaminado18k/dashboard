import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase environment variables. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment.',
    )
  }

  // For server routes, returning a normal supabase-js client is acceptable
  // It exposes the .from() API used across the codebase.
  return createSupabaseClient(url, key)
}

export const createClient = createServerClient
