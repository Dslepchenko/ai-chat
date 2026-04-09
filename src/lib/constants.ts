// ─── Query Keys ────────────────────────────────────────────────────────────────
export const QUERY_KEYS = {
  USER: ['user'] as const,
  CHATS: ['chats'] as const,
  messages: (chatId: string) => ['messages', chatId] as const,
} as const

// ─── Client Routes ─────────────────────────────────────────────────────────────
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  chat: (id: string) => `/chat/${id}`,
} as const

// ─── API Routes ────────────────────────────────────────────────────────────────
export const API_ROUTES = {
  AUTH_ME: '/api/auth/me',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGOUT: '/api/auth/logout',
  CHATS: '/api/chats',
  chat: (id: string) => `/api/chats/${id}`,
  messages: (chatId: string) => `/api/chats/${chatId}/messages`,
  DOCUMENTS: '/api/documents',
} as const

// ─── Storage Keys ──────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  PENDING_MESSAGE: 'pending_message',
  ANON_MESSAGE_COUNT: 'anon_message_count',
  ANON_CHAT_IDS: 'anon_chat_ids',
} as const

// ─── Anonymous Access ─────────────────────────────────────────────────────────
export const ANON_CONFIG = {
  FREE_MESSAGE_LIMIT: 3,
} as const

// ─── Query Config ──────────────────────────────────────────────────────────────
export const QUERY_CONFIG = {
  USER_STALE_TIME_MS: 5 * 60 * 1000,   // 5 minutes
  CHATS_STALE_TIME_MS: 30 * 1000,      // 30 seconds
} as const

// ─── AI Config ─────────────────────────────────────────────────────────────────
export const AI_CONFIG = {
  MODEL_ID: 'gpt-4o-mini',
  SYSTEM_PROMPT: `You are a helpful, knowledgeable, and friendly AI assistant.
Provide clear, accurate, and thoughtful responses.
When presented with documents or files, analyze them carefully and use their content to answer.
Format responses using Markdown when it improves readability (code, lists, structured content).`,
} as const

// ─── Documents ────────────────────────────────────────────────────────────────
export const DOCUMENT_CONFIG = {
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,  // 10 MB
  MAX_CONTENT_CHARS: 50_000,
  ACCEPTED_TYPES: ['.pdf', '.txt'],
} as const

// ─── Validation ───────────────────────────────────────────────────────────────
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
} as const

// ─── Error Messages ───────────────────────────────────────────────────────────
export const ERROR_MESSAGES = {
  AUTH_REQUIRED: 'Authentication required',
  NOT_FOUND: 'Not found',
  FORBIDDEN: 'Access denied',
  SERVER_ERROR: 'Something went wrong. Please try again.',
  STREAM_ERROR: 'AI response failed. Please try again.',
} as const
