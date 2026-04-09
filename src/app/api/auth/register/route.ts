import { createAuthClient } from '@/lib/supabase/server'
import { VALIDATION, ERROR_MESSAGES } from '@/lib/constants'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required' }, { status: 400 })
  }

  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    return Response.json(
      { error: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters` },
      { status: 400 }
    )
  }

  const supabase = await createAuthClient()
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) return Response.json({ error: error.message }, { status: 400 })
  if (!data.user) return Response.json({ error: 'Registration failed' }, { status: 400 })

  return Response.json({
    user: { id: data.user.id, email: data.user.email, created_at: data.user.created_at },
  })
}
