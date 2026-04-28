import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Cookie-based server client for Route Handlers and Server Components.
// Reads the session automatically from the request cookies so individual
// routes don't need to forward Bearer tokens manually.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Called from a Server Component — reads are fine, writes are silently ignored.
            // Session refresh is handled by middleware instead.
          }
        },
      },
    }
  )
}
