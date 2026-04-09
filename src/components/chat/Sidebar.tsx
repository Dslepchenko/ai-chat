'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { MessageSquarePlus, Trash2, LogOut, LogIn, Moon, Sun, Menu, X, Bot } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useChats, useCreateChat, useDeleteChat } from '@/hooks/useChats'
import { useRealtimeChats } from '@/hooks/useRealtime'
import { authApi } from '@/lib/api/client'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS, QUERY_CONFIG, API_ROUTES, ROUTES } from '@/lib/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function useUser() {
  return useQuery({
    queryKey: QUERY_KEYS.USER,
    queryFn: () => fetch(API_ROUTES.AUTH_ME).then((r) => (r.ok ? r.json() : null)),
    retry: false,
    staleTime: QUERY_CONFIG.USER_STALE_TIME_MS,
  })
}

export function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const { data: user } = useUser()
  const { data: chats = [], isLoading } = useChats()
  const createChat = useCreateChat()
  const deleteChat = useDeleteChat()

  useRealtimeChats(user?.id ?? null)

  async function handleNewChat() {
    try {
      const chat = await createChat.mutateAsync(undefined)
      router.push(ROUTES.chat(chat.id))
      setOpen(false)
    } catch {
      toast.error('Failed to create chat')
    }
  }

  async function handleDeleteChat(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await deleteChat.mutateAsync(id)
      if (pathname === ROUTES.chat(id)) router.push(ROUTES.HOME)
    } catch {
      toast.error('Failed to delete chat')
    }
  }

  async function handleLogout() {
    try {
      await authApi.logout()
      queryClient.clear()
      router.push(ROUTES.LOGIN)
    } catch {
      toast.error('Logout failed')
    }
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-3 pb-2">
        <div className="flex items-center gap-2">
          <Bot className="size-5 text-primary" />
          <span className="font-semibold text-sm">AI Chat</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </Button>
          <Button
            className="lg:hidden"
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(false)}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="px-3 pb-2">
        <Button
          className="w-full justify-start gap-2"
          variant="outline"
          onClick={handleNewChat}
          disabled={createChat.isPending}
        >
          <MessageSquarePlus className="size-4" />
          New Chat
        </Button>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-2 py-2">
        {isLoading ? (
          <div className="space-y-1 px-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : chats.length === 0 ? (
          <p className="px-3 py-4 text-center text-xs text-muted-foreground">
            No chats yet. Start one above!
          </p>
        ) : (
          <div className="space-y-0.5">
            {chats.map((chat) => {
              const isActive = pathname === ROUTES.chat(chat.id)
              return (
                <Link
                  key={chat.id}
                  href={ROUTES.chat(chat.id)}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted',
                    isActive && 'bg-muted font-medium'
                  )}
                >
                  <span className="truncate flex-1 min-w-0">{chat.title}</span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteChat(e, chat.id)}
                    className="ml-1 shrink-0 rounded-md p-1 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </Link>
              )
            })}
          </div>
        )}
      </ScrollArea>

      <Separator />

      <div className="p-3 pt-2">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 text-sm" size="sm">
                <div className="size-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <span className="truncate">{user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="outline" className="w-full justify-start gap-2" size="sm" asChild>
            <Link href={ROUTES.LOGIN}>
              <LogIn className="size-4" />
              Sign in
            </Link>
          </Button>
        )}
      </div>
    </div>
  )

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-3 top-3 z-50 lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="size-4" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-sidebar">
        {sidebarContent}
      </aside>

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r bg-sidebar transition-transform duration-200 lg:hidden',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {sidebarContent}
      </aside>
    </>
  )
}
