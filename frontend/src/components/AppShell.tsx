'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'
import {
  Activity,
  CheckSquare,
  Dumbbell,
  LayoutDashboard,
  Moon,
  Smile,
  Wallet
} from 'lucide-react'

interface AppShellProps {
  title: string
  subtitle: string
  children: React.ReactNode
  actions?: React.ReactNode
}

const navItems = [
  { href: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { href: ROUTES.SLEEP, label: 'Sleep', icon: Moon },
  { href: ROUTES.WORKOUT, label: 'Workout', icon: Dumbbell },
  { href: ROUTES.HABITS, label: 'Habits', icon: CheckSquare },
  { href: ROUTES.MOOD, label: 'Mood', icon: Smile },
  { href: ROUTES.FINANCE, label: 'Finance', icon: Wallet }
]

export default function AppShell({ title, subtitle, children, actions }: AppShellProps) {
  const pathname = usePathname()
  const { logout } = useAuth()

  return (
    <div className="scene-shell min-h-screen pb-14">
      <div className="scene-aurora" />
      <div className="scene-grid" />
      <div className="orb orb--one" />
      <div className="orb orb--two" />
      <div className="orb orb--three" />

      <main className="relative mx-auto w-full max-w-7xl px-5 pb-8 pt-8 md:px-8 md:pt-10">
        <header className="stagger-rise glass-panel rounded-3xl px-5 py-4 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <Activity className="h-3.5 w-3.5" />
                Personal Performance Console
              </p>
              <h1 className="headline-display mt-2 text-2xl font-bold text-slate-900 md:text-3xl">{title}</h1>
              <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {actions}
              <Button
                variant="outline"
                className="data-pill border-slate-300/50 bg-white/60 text-slate-800"
                onClick={logout}
              >
                Logout
              </Button>
            </div>
          </div>

          <nav className="mt-5 flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'data-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'text-slate-700 hover:-translate-y-0.5 hover:text-slate-900'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </header>

        <section className="mt-6">{children}</section>
      </main>
    </div>
  )
}
