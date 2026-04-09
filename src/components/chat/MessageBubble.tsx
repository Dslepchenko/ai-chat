'use client'

import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import type { Message } from '@/lib/api/client'
import { CodeBlock } from './CodeBlock'

interface MessageBubbleProps {
  message: Message & { streaming?: boolean }
}

function useTypewriter(target: string, active: boolean) {
  const [displayed, setDisplayed] = useState(active ? '' : target)

  useEffect(() => {
    if (!active) {
      setDisplayed(target)
      return
    }
    if (displayed.length >= target.length) return
    const raf = requestAnimationFrame(() => {
      setDisplayed(target.slice(0, displayed.length + 2))
    })
    return () => cancelAnimationFrame(raf)
  }, [target, displayed, active])

  return active ? displayed : target
}

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-2 rounded-full bg-foreground/30 animate-bounce"
          style={{ animationDelay: `${i * 160}ms`, animationDuration: '1.2s' }}
        />
      ))}
    </div>
  )
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isThinking = message.streaming && !message.content
  const content = useTypewriter(message.content ?? '', !!message.streaming)

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex flex-col items-end gap-1 max-w-[75%]">
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              {message.images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt={`Image ${i + 1}`}
                  className="max-h-48 max-w-xs rounded-2xl object-cover"
                />
              ))}
            </div>
          )}
          {message.content && (
            <div className="rounded-3xl bg-muted px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[85%] text-sm leading-relaxed text-foreground">
        {isThinking ? (
          <ThinkingDots />
        ) : (
          <div className={cn(
            'prose prose-sm dark:prose-invert max-w-none break-words',
            'prose-p:leading-relaxed prose-p:my-2 prose-p:last:mb-0',
            'prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2',
            'prose-h1:text-xl prose-h2:text-lg prose-h3:text-base',
            'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-xs prose-code:font-mono prose-code:before:content-none prose-code:after:content-none',
            'prose-pre:!p-0 prose-pre:!bg-transparent prose-pre:!rounded-none prose-pre:overflow-visible',
            'prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5',
            'prose-blockquote:border-l-2 prose-blockquote:border-muted-foreground/30 prose-blockquote:pl-4 prose-blockquote:text-muted-foreground prose-blockquote:not-italic',
            'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
            'prose-strong:font-semibold prose-table:text-xs',
            'prose-hr:border-border',
          )}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  const isBlock = !!match || (typeof children === 'string' && children.includes('\n'))
                  if (isBlock) {
                    return (
                      <CodeBlock language={match?.[1]}>
                        {String(children).replace(/\n$/, '')}
                      </CodeBlock>
                    )
                  }
                  return (
                    <code
                      className="bg-muted px-1.5 py-0.5 rounded-md text-xs font-mono"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
              }}
            >
              {content}
            </ReactMarkdown>
            {message.streaming && content && (
              <span className="inline-block w-0.5 h-[1em] bg-foreground/70 align-middle ml-0.5 animate-pulse" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
