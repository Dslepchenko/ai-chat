import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * No forced redirects — anonymous users can access chat pages (up to 3 free messages).
 * Auth is enforced at the API layer for privileged operations.
 * This proxy exists as a placeholder for future route-level logic (e.g. rate limiting).
 */
export function proxy(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [],
}
