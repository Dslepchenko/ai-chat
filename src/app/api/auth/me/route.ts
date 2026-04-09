import { getUser } from '@/lib/supabase/server'

export async function GET() {
  const user = await getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return Response.json({
    id: user.id,
    email: user.email,
    created_at: user.created_at,
  })
}
