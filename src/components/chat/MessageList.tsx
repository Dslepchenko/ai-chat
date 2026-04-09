'use client'

import { useEffect, useRef } from 'react'
import { MessageSquare } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { useMessages } from '@/hooks/useMessages'
import type { Message } from '@/lib/api/client'

interface MessageListProps {
  chatId: string
  streamingContent: string | null
}

export function MessageList({ chatId, streamingContent }: MessageListProps) {
  const { data: messages, isLoading } = useMessages(chatId)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const hasMessages = messages && messages.length > 0

  return (
    <div className="flex-1 overflow-y-auto">
      {!hasMessages && !streamingContent ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center p-8">
          <div className="rounded-full bg-muted p-4">
            <MessageSquare className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Start the conversation</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Type a message below to chat with Gemini AI
            </p>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
          {messages?.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {streamingContent !== null && (
            <MessageBubble
              message={{
                id: 'streaming',
                chat_id: chatId,
                role: 'assistant',
                content: streamingContent,
                created_at: new Date().toISOString(),
                streaming: true,
              } as Message & { streaming: boolean }}
            />
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  )
}
