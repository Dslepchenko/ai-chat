'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createRealtimeClient } from '@/lib/supabase/realtime'
import { QUERY_KEYS } from '@/lib/constants'
import type { Chat } from '@/lib/api/client'

// Subscribes to the 'chats' table and keeps the sidebar in sync across tabs
export function useRealtimeChats(userId: string | null) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return

    const supabase = createRealtimeClient()

    const channel = supabase
      .channel('chats-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newChat = payload.new as Chat
          queryClient.setQueryData<Chat[]>(QUERY_KEYS.CHATS, (old = []) => {
            // avoid duplicate if already present
            if (old.find((c) => c.id === newChat.id)) return old
            return [newChat, ...old]
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const deleted = payload.old as { id: string }
          queryClient.setQueryData<Chat[]>(QUERY_KEYS.CHATS, (old = []) =>
            old.filter((c) => c.id !== deleted.id)
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as Chat
          queryClient.setQueryData<Chat[]>(QUERY_KEYS.CHATS, (old = []) =>
            old.map((c) => (c.id === updated.id ? updated : c))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, queryClient])
}
