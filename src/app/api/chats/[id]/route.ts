import { createServiceClient, getUser } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = createServiceClient()

  const { data, error } = await db
    .from('chats')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return Response.json({ error: 'Chat not found' }, { status: 404 })
  }

  return Response.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getUser()
  const db = createServiceClient()

  // Verify ownership
  const { data: chat } = await db
    .from('chats')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!chat) {
    return Response.json({ error: 'Chat not found' }, { status: 404 })
  }

  if (chat.user_id && chat.user_id !== user?.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Delete messages and documents first (cascade)
  await db.from('messages').delete().eq('chat_id', id)
  await db.from('documents').delete().eq('chat_id', id)

  const { error } = await db.from('chats').delete().eq('id', id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
