import { createServiceClient, getUser } from '@/lib/supabase/server'

async function extractText(file: File): Promise<string> {
  if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
    return file.text()
  }

  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    const pdfParse = (await import('pdf-parse')) as unknown as (buf: Buffer) => Promise<{ text: string }>
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await pdfParse(buffer)
    return result.text
  }

  throw new Error('Unsupported file type. Please upload a PDF or TXT file.')
}

export async function POST(request: Request) {
  const user = await getUser()
  const formData = await request.formData()

  const file = formData.get('file') as File | null
  const chatId = formData.get('chat_id') as string | null

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!chatId) {
    return Response.json({ error: 'chat_id is required' }, { status: 400 })
  }

  // 10 MB limit
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
  }

  let content: string
  try {
    content = await extractText(file)
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'Failed to extract text' },
      { status: 422 }
    )
  }

  const db = createServiceClient()

  const { data, error } = await db
    .from('documents')
    .insert({
      chat_id: chatId,
      filename: file.name,
      content: content.slice(0, 50_000), // cap at 50k chars
      user_id: user?.id ?? null,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data, { status: 201 })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chatId = searchParams.get('chat_id')

  if (!chatId) {
    return Response.json({ error: 'chat_id is required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('documents')
    .select('id, chat_id, filename, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json(data)
}
