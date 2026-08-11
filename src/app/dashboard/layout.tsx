'use client'
// src/app/dashboard/layout.tsx

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { BarChart3, FolderOpen, FileText, LogOut, User, ChevronRight, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard/cases',         label: 'Casos',   icon: FolderOpen },
  { href: '/dashboard/laudos',        label: 'Laudos',  icon: FileText },
  { href: '/dashboard/perfil',        label: 'Perfil',  icon: User },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [user, loading, router])

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">

      {/* Sidebar */}
      <aside className="w-64 bg-brand-700 flex flex-col">

        {/* Logo */}
        <div className="p-6 border-b border-brand-600">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Wealth Analytica</p>
              <p className="text-brand-200 text-xs">Banking Intelligence</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const Icon    = item.icon
            const active  = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand-500 text-white'
                    : 'text-brand-100 hover:bg-brand-600 hover:text-white'
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* Admin */}
        {user.perfil === 'SUPER_ADMIN' && (
          <div className="px-4 pb-2">
            <Link
              href="/dashboard/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-amber-300 hover:bg-brand-600 hover:text-white transition-colors"
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          </div>
        )}

        {/* Usuário */}
        <div className="p-4 border-t border-brand-600">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.nome}</p>
              <p className="text-brand-200 text-xs truncate">{user.plano}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-brand-200 hover:text-white text-xs transition-colors w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
