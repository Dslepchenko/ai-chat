import { createServiceClient, getUser } from '@/lib/supabase/server'
import { ERROR_MESSAGES } from '@/lib/constants'

export async function GET() {
  const user = await getUser()
  if (!user) return Response.json([])

  const db = createServiceClient()
  const { data, error } = await db
    .from('chats')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return Response.json({ error: ERROR_MESSAGES.SERVER_ERROR }, { status: 500 })

  return Response.json(data)
}

export async function POST(request: Request) {
  const { title } = await request.json().catch(() => ({ title: undefined }))
  const user = await getUser()
  const db = createServiceClient()

  const { data, error } = await db
    .from('chats')
    .insert({
      user_id: user?.id ?? null,
      title: title || 'New Chat',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return Response.json({ error: ERROR_MESSAGES.SERVER_ERROR }, { status: 500 })

  return Response.json(data, { status: 201 })
}
