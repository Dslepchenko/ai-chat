'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  language?: string
  children: string
}

export function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lang = language || 'text'

  return (
    <div className="group my-3 overflow-hidden rounded-xl border border-border bg-[#1e1e1e]">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-[#2a2a2a] px-4 py-2">
        <span className="text-xs font-medium text-zinc-400 lowercase">{lang}</span>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors',
            copied
              ? 'text-green-400'
              : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
          )}
        >
          {copied ? (
            <>
              <Check className="size-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Code */}
      <SyntaxHighlighter
        language={lang}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'transparent',
          fontSize: '0.8125rem',
          lineHeight: '1.6',
        }}
        codeTagProps={{ style: { fontFamily: 'var(--font-mono, monospace)' } }}
        wrapLongLines={false}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}
