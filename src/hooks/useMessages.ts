'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { messagesApi, type Message } from '@/lib/api/client'
import { QUERY_KEYS, API_ROUTES, STORAGE_KEYS } from '@/lib/constants'
import { useState, useCallback } from 'react'

export function useMessages(chatId: string) {
  return useQuery<Message[]>({
    queryKey: QUERY_KEYS.messages(chatId),
    queryFn: () => messagesApi.list(chatId),
    enabled: !!chatId,
  })
}

export function useSendMessage(chatId: string) {
  const queryClient = useQueryClient()
  const [streamingContent, setStreamingContent] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (content: string, images: string[] = []) => {
      setError(null)
      setIsStreaming(true)
      setStreamingContent('')

      const anonCount = parseInt(localStorage.getItem(STORAGE_KEYS.ANON_MESSAGE_COUNT) ?? '0', 10)

      const optimisticMessage: Message = {
        id: `optimistic-${Date.now()}`,
        chat_id: chatId,
        role: 'user',
        content,
        images: images.length > 0 ? images : undefined,
        created_at: new Date().toISOString(),
      }

      queryClient.setQueryData<Message[]>(QUERY_KEYS.messages(chatId), (old = []) => [
        ...old,
        optimisticMessage,
      ])

      try {
        const response = await fetch(API_ROUTES.messages(chatId), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, images, anonCount }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({ error: 'Request failed' }))
          if (err.error === 'ANON_LIMIT_REACHED') throw new Error('ANON_LIMIT_REACHED')
          throw new Error(err.error || `HTTP ${response.status}`)
        }

        // Track anonymous message count
        localStorage.setItem(STORAGE_KEYS.ANON_MESSAGE_COUNT, String(anonCount + 1))

        if (!response.body) throw new Error('No response body')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          accumulated += decoder.decode(value, { stream: true })
          setStreamingContent(accumulated)
        }

        // Detect error JSON in stream (AI SDK error format)
        try {
          const parsed = JSON.parse(accumulated.trim())
          if (parsed?.type === 'error' || parsed?.error) {
            throw new Error(parsed?.error?.message ?? parsed?.message ?? 'AI error')
          }
        } catch (e) {
          if (!(e instanceof SyntaxError)) throw e
        }

        // Add AI response optimistically to prevent flicker during refetch
        queryClient.setQueryData<Message[]>(QUERY_KEYS.messages(chatId), (old = []) => [
          ...old,
          {
            id: `optimistic-ai-${Date.now()}`,
            chat_id: chatId,
            role: 'assistant' as const,
            content: accumulated,
            created_at: new Date().toISOString(),
          },
        ])

        setStreamingContent(null)
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(chatId) })
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CHATS })
      } catch (err) {
        queryClient.setQueryData<Message[]>(QUERY_KEYS.messages(chatId), (old = []) =>
          old.filter((m) => m.id !== optimisticMessage.id)
        )
        setError(err instanceof Error ? err.message : 'Failed to send')
        throw err
      } finally {
        setIsStreaming(false)
      }
    },
    [chatId, queryClient]
  )

  return { sendMessage, streamingContent, isStreaming, error }
}
