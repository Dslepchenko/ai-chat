import { createAuthClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const supabase = await createAuthClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return Response.json({ error: error.message }, { status: 401 })
  }

  return Response.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      created_at: data.user.created_at,
    },
  })
}
