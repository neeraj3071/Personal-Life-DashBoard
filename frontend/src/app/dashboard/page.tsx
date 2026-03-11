'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import ProtectedRoute from '@/components/ProtectedRoute'
import TiltCard from '@/components/TiltCard'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import type { DashboardStats } from '@/types'
import AppShell from '@/components/AppShell'
import {
  Moon,
  Dumbbell,
  CheckCircle2,
  Smile,
  Wallet,
  Rocket,
  RefreshCw,
  Sparkles
} from 'lucide-react'

interface StatCard {
  title: string
  value: string
  helper: string
  icon: React.ComponentType<{ className?: string }>
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

  const statCards = useMemo<StatCard[]>(() => {
    if (!stats) {
      return []
    }

    return [
      {
        title: 'Sleep Duration',
        value: stats.todaySleep ? `${stats.todaySleep} hrs` : 'No data',
        helper: 'Last logged sleep session',
        icon: Moon
      },
      {
        title: 'Weekly Workouts',
        value: `${stats.weeklyWorkouts} / 7`,
        helper: 'Sessions completed this week',
        icon: Dumbbell
      },
      {
        title: 'Habit Completion',
        value: `${stats.habitCompletion}%`,
        helper: 'Consistency across active habits',
        icon: CheckCircle2
      },
      {
        title: 'Weekly Mood',
        value: stats.avgWeeklyMood ? `${stats.avgWeeklyMood} / 5` : 'No data',
        helper: stats.todayMood ? `Today: ${stats.todayMood} / 5` : 'Log mood to unlock trend',
        icon: Smile
      },
      {
        title: 'Today Spending',
        value: formatCurrency(stats.todaySpending),
        helper: 'Tracked expense total today',
        icon: Wallet
      },
      {
        title: 'Productivity Index',
        value: `${stats.weeklyProductivity}%`,
        helper: 'Computed from habits and workouts',
        icon: Rocket
      }
    ]
  }, [stats])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError('')

      const [dashboardStats, dashboardInsights] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getDashboardInsights()
      ])

      setStats(dashboardStats)
      setInsights(dashboardInsights)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell title="Dashboard" subtitle="Your live performance summary">
          <TiltCard className="glass-panel rounded-3xl px-8 py-10 text-center">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-slate-700" />
            <p className="mt-4 text-sm font-semibold tracking-[0.12em] text-slate-600">SYNCING LIFE SIGNALS</p>
          </TiltCard>
        </AppShell>
      </ProtectedRoute>
    )
  }

  return (
    <AppShell
      title={`Welcome back, ${user?.name ?? 'there'}`}
      subtitle="Your live performance summary"
      actions={
        <Button
          variant="outline"
          className="data-pill border-slate-300/50 bg-white/50 text-slate-800"
          onClick={() => void fetchDashboardData()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      {error ? (
        <TiltCard className="glass-panel mb-7 rounded-3xl border border-red-200/60 px-6 py-5 text-red-700">
          <p className="font-semibold">Unable to load dashboard data.</p>
          <p className="mt-1 text-sm">{error}</p>
        </TiltCard>
      ) : null}

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div key={card.title} className="stagger-rise" style={{ animationDelay: `${80 + index * 55}ms` }}>
              <TiltCard className="glass-panel h-full rounded-3xl p-6">
                <div className="relative z-10">
                  <div className="mb-4 inline-flex rounded-2xl bg-slate-900 p-2.5 text-cyan-200">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{card.title}</p>
                  <p className="headline-display mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
                  <p className="mt-3 text-sm text-slate-600">{card.helper}</p>
                </div>
              </TiltCard>
            </div>
          )
        })}
      </section>

      <section className="mt-8">
        <div className="stagger-rise glass-panel rounded-3xl p-6" style={{ animationDelay: '420ms' }}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-slate-700" />
            <h2 className="headline-display text-xl font-semibold text-slate-900">Insight Stream</h2>
          </div>

          {insights.length > 0 ? (
            <div className="mt-4 space-y-3">
              {insights.map((insight, index) => (
                <div
                  key={`${insight}-${index}`}
                  className="data-pill rounded-2xl px-4 py-3 text-sm text-slate-700"
                >
                  {insight}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-white/45 px-4 py-3 text-sm text-slate-600">
              Add more logs to unlock richer insight correlations.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
