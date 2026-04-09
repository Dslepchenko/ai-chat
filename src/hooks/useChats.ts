'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatsApi, type Chat } from '@/lib/api/client'
import { QUERY_KEYS, QUERY_CONFIG, STORAGE_KEYS } from '@/lib/constants'

// ─── Anonymous chat tracking (localStorage) ───────────────────────────────────

function getAnonChatIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ANON_CHAT_IDS) ?? '[]')
  } catch {
    return []
  }
}

function addAnonChatId(id: string) {
  const ids = getAnonChatIds()
  if (!ids.includes(id)) {
    localStorage.setItem(STORAGE_KEYS.ANON_CHAT_IDS, JSON.stringify([id, ...ids]))
  }
}

function removeAnonChatId(id: string) {
  const ids = getAnonChatIds().filter((i) => i !== id)
  localStorage.setItem(STORAGE_KEYS.ANON_CHAT_IDS, JSON.stringify(ids))
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useChats() {
  return useQuery<Chat[]>({
    queryKey: QUERY_KEYS.CHATS,
    queryFn: async () => {
      const serverChats = await chatsApi.list()
      const serverIds = new Set(serverChats.map((c) => c.id))

      // Merge in any anonymous chats not already returned by the server
      const anonIds = getAnonChatIds().filter((id) => !serverIds.has(id))
      if (anonIds.length === 0) return serverChats

      const results = await Promise.allSettled(
        anonIds.map((id) => fetch(`/api/chats/${id}`).then((r) => (r.ok ? r.json() : null)))
      )
      const anonChats = results
        .filter((r): r is PromiseFulfilledResult<Chat> => r.status === 'fulfilled' && r.value !== null)
        .map((r) => r.value)

      return [...serverChats, ...anonChats]
    },
    staleTime: QUERY_CONFIG.CHATS_STALE_TIME_MS,
  })
}

export function useCreateChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (title?: string) => chatsApi.create(title),
    onSuccess: (newChat) => {
      if (!newChat.user_id) addAnonChatId(newChat.id)
      queryClient.setQueryData<Chat[]>(QUERY_KEYS.CHATS, (old = []) => [newChat, ...old])
    },
  })
}

export function useDeleteChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => chatsApi.delete(id),
    onSuccess: (_data, deletedId) => {
      removeAnonChatId(deletedId)
      queryClient.setQueryData<Chat[]>(QUERY_KEYS.CHATS, (old = []) =>
        old.filter((c) => c.id !== deletedId)
      )
    },
  })
}
