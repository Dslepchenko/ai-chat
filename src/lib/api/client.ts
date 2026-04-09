import { API_ROUTES } from '@/lib/constants'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Chat = {
  id: string
  user_id: string | null
  title: string
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  chat_id: string
  role: 'user' | 'assistant'
  content: string
  images?: string[]
  created_at: string
}

export type Document = {
  id: string
  chat_id: string
  filename: string
  content: string
  created_at: string
}

export type User = {
  id: string
  email: string
  created_at: string
}

// ─── Base Fetch ───────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  return res.json()
}

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authApi = {
  me: () => apiFetch<User>(API_ROUTES.AUTH_ME),
  login: (email: string, password: string) =>
    apiFetch<{ user: User }>(API_ROUTES.AUTH_LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    apiFetch<{ user: User }>(API_ROUTES.AUTH_REGISTER, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => apiFetch(API_ROUTES.AUTH_LOGOUT, { method: 'POST' }),
}

// ─── Chats API ────────────────────────────────────────────────────────────────

export const chatsApi = {
  list: () => apiFetch<Chat[]>(API_ROUTES.CHATS),
  create: (title?: string) =>
    apiFetch<Chat>(API_ROUTES.CHATS, {
      method: 'POST',
      body: JSON.stringify({ title }),
    }),
  delete: (id: string) =>
    apiFetch(API_ROUTES.chat(id), { method: 'DELETE' }),
}

// ─── Messages API ─────────────────────────────────────────────────────────────

export const messagesApi = {
  list: (chatId: string) => apiFetch<Message[]>(API_ROUTES.messages(chatId)),
}

// ─── Documents API ────────────────────────────────────────────────────────────

export const documentsApi = {
  upload: async (chatId: string, file: File): Promise<Document> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('chat_id', chatId)

    const res = await fetch(API_ROUTES.DOCUMENTS, { method: 'POST', body: formData })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Upload failed' }))
      throw new Error(body.error)
    }
    return res.json()
  },
  list: (chatId: string) =>
    apiFetch<Document[]>(`${API_ROUTES.DOCUMENTS}?chat_id=${chatId}`),
}
