'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TextareaAutosize from 'react-textarea-autosize'
import { ArrowUp, Paperclip, Plus, ImageIcon, X } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useCreateChat } from '@/hooks/useChats'
import { QUERY_KEYS, QUERY_CONFIG, API_ROUTES, ROUTES, STORAGE_KEYS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function HomeView() {
  const router = useRouter()
  const createChat = useCreateChat()
  const [text, setText] = useState('')
  const [images, setImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const { data: user } = useQuery({
    queryKey: QUERY_KEYS.USER,
    queryFn: () => fetch(API_ROUTES.AUTH_ME).then((r) => (r.ok ? r.json() : null)),
    retry: false,
    staleTime: QUERY_CONFIG.USER_STALE_TIME_MS,
  })

  const canSend = text.trim().length > 0 || images.length > 0

  async function handleSend() {
    if (!canSend || createChat.isPending) return

    if (!user) {
      router.push(ROUTES.LOGIN)
      return
    }

    try {
      const chat = await createChat.mutateAsync(undefined)
      sessionStorage.setItem(
        STORAGE_KEYS.PENDING_MESSAGE,
        JSON.stringify({ content: text.trim(), images })
      )
      router.push(ROUTES.chat(chat.id))
    } catch {
      toast.error('Failed to create chat')
    }
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
    reader.onload = (e) => {
      setImages((prev) => [...prev, e.target?.result as string])
    }
    reader.readAsDataURL(file)
  }

  function handleImageInput(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).forEach(addImageFile)
    e.target.value = ''
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">
        What are you working on?
      </h1>

      <div className="w-full max-w-2xl">
        <div className={cn(
          'rounded-2xl border border-input bg-background shadow-sm transition-all duration-200',
          'focus-within:border-ring/60 focus-within:shadow-md',
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

          <TextareaAutosize
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Ask anything"
            minRows={1}
            maxRows={6}
            autoFocus
            className="w-full resize-none bg-transparent px-4 py-3.5 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none"
          />

          <div className="flex items-center justify-between px-3 pb-3 pt-0">
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                title="Attach"
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Plus className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach document"
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Paperclip className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                title="Attach image"
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ImageIcon className="size-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleSend}
              disabled={!canSend || createChat.isPending}
              className={cn(
                'flex size-8 items-center justify-center rounded-full transition-all duration-150',
                canSend && !createChat.isPending
                  ? 'bg-foreground text-background hover:opacity-80 active:scale-95'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              <ArrowUp className="size-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageInput} />
      <input ref={fileInputRef} type="file" accept=".pdf,.txt" className="hidden" onChange={() => {}} />
    </div>
  )
}
