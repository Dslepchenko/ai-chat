'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TextareaAutosize from 'react-textarea-autosize'
import { Paperclip, ArrowUp, X, ImageIcon, Square, Plus, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DocumentTag } from './DocumentTag'
import { documentsApi } from '@/lib/api/client'
import { ROUTES, STORAGE_KEYS, ANON_CONFIG } from '@/lib/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  chatId: string
  isStreaming: boolean
  onSend: (content: string, images: string[]) => Promise<void>
  error: string | null
  isLoggedIn: boolean
}

export function ChatInput({ chatId, isStreaming, onSend, error: streamError, isLoggedIn }: ChatInputProps) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [pendingDoc, setPendingDoc] = useState<{ file: File; name: string } | null>(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [anonCount, setAnonCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setAnonCount(parseInt(localStorage.getItem(STORAGE_KEYS.ANON_MESSAGE_COUNT) ?? '0', 10))
  }, [])

  useEffect(() => {
    if (!streamError) return
    if (streamError === 'ANON_LIMIT_REACHED') {
      setAnonCount(ANON_CONFIG.FREE_MESSAGE_LIMIT)
      toast.error('Sign up to continue chatting!', {
        action: { label: 'Sign up', onClick: () => router.push(ROUTES.REGISTER) },
        duration: 8000,
      })
    } else {
      toast.error(streamError)
    }
  }, [streamError, router])

  const isAnonLimitReached = !isLoggedIn && anonCount >= ANON_CONFIG.FREE_MESSAGE_LIMIT
  const canSend = (text.trim().length > 0 || images.length > 0) && !isStreaming && !isAnonLimitReached

  async function handleSend() {
    if (!canSend) return

    if (pendingDoc) {
      setUploadingDoc(true)
      try {
        await documentsApi.upload(chatId, pendingDoc.file)
        setPendingDoc(null)
        toast.success(`Document "${pendingDoc.name}" attached`)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Document upload failed')
        setUploadingDoc(false)
        return
      }
      setUploadingDoc(false)
    }

    const sentImages = images
    setText('')
    setImages([])
    await onSend(text.trim(), sentImages)
    setAnonCount(parseInt(localStorage.getItem(STORAGE_KEYS.ANON_MESSAGE_COUNT) ?? '0', 10))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    Array.from(e.clipboardData.items).forEach((item) => {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) addImageFile(file)
      }
    })
  }, [])

  function addImageFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => setImages((prev) => [...prev, e.target?.result as string])
    reader.readAsDataURL(file)
  }

  function handleImageInput(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).forEach(addImageFile)
    e.target.value = ''
  }

  function handleDocumentInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setPendingDoc({ file, name: file.name })
    e.target.value = ''
  }

  return (
    <div className="px-4 pb-4 pt-2">
      {isAnonLimitReached && (
        <div className="mx-auto mb-3 max-w-3xl flex items-center justify-between rounded-xl bg-muted px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">
            You&apos;ve used all {ANON_CONFIG.FREE_MESSAGE_LIMIT} free messages.
          </span>
          <Button size="sm" onClick={() => router.push(ROUTES.REGISTER)} className="gap-1.5">
            <LogIn className="size-3.5" />
            Sign up free
          </Button>
        </div>
      )}

      <div className="mx-auto max-w-3xl">
        <div className={cn(
          'rounded-2xl border border-input bg-background shadow-sm transition-all duration-200',
          'focus-within:border-ring/60 focus-within:shadow-md',
          isAnonLimitReached && 'opacity-60 pointer-events-none',
        )}>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pt-3">
              {images.map((src, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Preview ${i + 1}`} className="size-16 rounded-xl object-cover border" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -right-1 -top-1 rounded-full bg-background border shadow-sm p-0.5 hover:bg-muted"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {pendingDoc && (
            <div className="px-4 pt-3">
              <DocumentTag filename={pendingDoc.name} onRemove={() => setPendingDoc(null)} />
            </div>
          )}

          <TextareaAutosize
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={isAnonLimitReached ? 'Sign up to continue…' : 'Ask anything'}
            minRows={1}
            maxRows={8}
            disabled={isStreaming || isAnonLimitReached}
            className="w-full resize-none bg-transparent px-4 py-3.5 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
          />

          <div className="flex items-center justify-between px-3 pb-3 pt-0">
            <div className="flex items-center gap-0.5">
              <AttachButton onClick={() => imageInputRef.current?.click()} title="Attach" icon={<Plus className="size-4" />} />
              <AttachButton onClick={() => fileInputRef.current?.click()} title="Attach document" disabled={uploadingDoc} icon={<Paperclip className="size-4" />} />
              <AttachButton onClick={() => imageInputRef.current?.click()} title="Attach image" icon={<ImageIcon className="size-4" />} />
            </div>
            <SendButton active={canSend || isStreaming} streaming={isStreaming} onClick={handleSend} />
          </div>
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground">
          AI can make mistakes. Check important information.
        </p>
      </div>

      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageInput} />
      <input ref={fileInputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={handleDocumentInput} />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AttachButton({ onClick, title, icon, disabled = false }: {
  onClick: () => void
  title: string
  icon: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {icon}
    </button>
  )
}

function SendButton({ active, streaming, onClick }: {
  active: boolean
  streaming: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!active}
      className={cn(
        'flex size-8 items-center justify-center rounded-full transition-all duration-150',
        active
          ? 'bg-foreground text-background hover:opacity-80 active:scale-95'
          : 'bg-muted text-muted-foreground cursor-not-allowed'
      )}
    >
      {streaming ? <Square className="size-3 fill-current" /> : <ArrowUp className="size-4 stroke-[2.5]" />}
    </button>
  )
}
