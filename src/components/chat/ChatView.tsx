'use client'

import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { useSendMessage } from '@/hooks/useMessages'
import { QUERY_KEYS, QUERY_CONFIG, API_ROUTES, STORAGE_KEYS } from '@/lib/constants'

interface ChatViewProps {
  chatId: string
}

export function ChatView({ chatId }: ChatViewProps) {
  const { sendMessage, streamingContent, isStreaming, error } = useSendMessage(chatId)
  const pendingSent = useRef(false)

  const { data: user } = useQuery({
    queryKey: QUERY_KEYS.USER,
    queryFn: () => fetch(API_ROUTES.AUTH_ME).then((r) => (r.ok ? r.json() : null)),
    retry: false,
    staleTime: QUERY_CONFIG.USER_STALE_TIME_MS,
  })

  // Send the message typed on the home page before navigation
  useEffect(() => {
    if (pendingSent.current) return
    const raw = sessionStorage.getItem(STORAGE_KEYS.PENDING_MESSAGE)
    if (!raw) return

    sessionStorage.removeItem(STORAGE_KEYS.PENDING_MESSAGE)
    pendingSent.current = true

    try {
      const { content, images } = JSON.parse(raw) as { content: string; images: string[] }
      if (content || images?.length) sendMessage(content, images ?? [])
    } catch {
      // Malformed session data — ignore
    }
  }, [sendMessage])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <MessageList chatId={chatId} streamingContent={streamingContent} />
      <ChatInput
        chatId={chatId}
        isStreaming={isStreaming}
        onSend={sendMessage}
        error={error}
        isLoggedIn={!!user}
      />
    </div>
  )
}
