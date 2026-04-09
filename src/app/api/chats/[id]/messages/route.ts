import { createServiceClient, getUser } from '@/lib/supabase/server'
import { streamText } from 'ai'
import { chatModel, SYSTEM_PROMPT } from '@/lib/ai/model'
import { ERROR_MESSAGES, DOCUMENT_CONFIG, ANON_CONFIG } from '@/lib/constants'
import type { ModelMessage } from 'ai'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = createServiceClient()

  const { data, error } = await db
    .from('messages')
    .select('*')
    .eq('chat_id', id)
    .order('created_at', { ascending: true })

  if (error) return Response.json({ error: ERROR_MESSAGES.SERVER_ERROR }, { status: 500 })

  return Response.json(data)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: chatId } = await params
  const user = await getUser()
  const db = createServiceClient()

  const body = await request.json()
  const { content, images = [], anonCount } = body as {
    content: string
    images?: string[]
    anonCount?: number
  }

  if (!content?.trim() && images.length === 0) {
    return Response.json({ error: 'Message content is required' }, { status: 400 })
  }

  // Enforce anonymous message limit server-side
  if (!user) {
    const count = typeof anonCount === 'number' ? anonCount : 0
    if (count >= ANON_CONFIG.FREE_MESSAGE_LIMIT) {
      return Response.json(
        { error: 'ANON_LIMIT_REACHED', message: 'Sign up to continue chatting' },
        { status: 403 }
      )
    }
  }

  // Verify chat exists (ownership check for authenticated users)
  const chatQuery = db.from('chats').select('id, user_id').eq('id', chatId)
  if (user) chatQuery.eq('user_id', user.id)
  const { data: chat } = await chatQuery.single()

  if (!chat) return Response.json({ error: ERROR_MESSAGES.NOT_FOUND }, { status: 404 })

  // Save user message
  const { error: insertError } = await db.from('messages').insert({
    chat_id: chatId,
    role: 'user',
    content: content || '',
    images: images.length > 0 ? images : null,
  })

  if (insertError) return Response.json({ error: ERROR_MESSAGES.SERVER_ERROR }, { status: 500 })

  // Load conversation history and documents in parallel
  const [{ data: history }, { data: documents }] = await Promise.all([
    db.from('messages').select('role, content, images').eq('chat_id', chatId).order('created_at', { ascending: true }),
    db.from('documents').select('filename, content').eq('chat_id', chatId),
  ])

  // Build system prompt with document context if available
  let systemPrompt = SYSTEM_PROMPT
  if (documents && documents.length > 0) {
    const docContext = documents
      .map((d) => `## Document: ${d.filename}\n\n${d.content.slice(0, DOCUMENT_CONFIG.MAX_CONTENT_CHARS)}`)
      .join('\n\n---\n\n')
    systemPrompt += `\n\n---\n\nYou have access to the following documents:\n\n${docContext}`
  }

  // Build AI message history
  const aiMessages: ModelMessage[] = (history ?? []).map((msg) => {
    if (msg.images && msg.images.length > 0) {
      return {
        role: msg.role as 'user' | 'assistant',
        content: [
          { type: 'text' as const, text: msg.content },
          ...msg.images.map((url: string) => ({ type: 'image' as const, image: url })),
        ],
      }
    }
    return { role: msg.role as 'user' | 'assistant', content: msg.content }
  })

  // Auto-title on first user message
  const isFirstMessage = history?.length === 1
  const titleUpdate = isFirstMessage
    ? { title: content.slice(0, 60) + (content.length > 60 ? '…' : ''), updated_at: new Date().toISOString() }
    : { updated_at: new Date().toISOString() }

  await db.from('chats').update(titleUpdate).eq('id', chatId)

  const result = streamText({
    model: chatModel,
    system: systemPrompt,
    messages: aiMessages,
    onFinish: async ({ text }) => {
      await db.from('messages').insert({ chat_id: chatId, role: 'assistant', content: text })
    },
  })

  return result.toTextStreamResponse()
}
