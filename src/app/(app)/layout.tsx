import { Sidebar } from '@/components/chat/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  )
}
