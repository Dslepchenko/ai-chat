'use client'

import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

// Public client — used ONLY for Realtime subscriptions
export function createRealtimeClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
