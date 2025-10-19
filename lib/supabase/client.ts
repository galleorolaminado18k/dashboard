import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.SUPABASE_SUPABASE_NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY_ANON_KEY

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Please ensure SUPABASE_NEXT_PUBLIC_SUPABASE_URL and SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY are set in your environment.",
    )
  }

  return createBrowserClient(url, key)
}
