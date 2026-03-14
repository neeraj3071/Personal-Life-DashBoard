'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ProtectedRoute from '@/components/ProtectedRoute'
import TiltCard from '@/components/TiltCard'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'
import type {
  AnalyticsSettings,
  CorrelationImpact,
  DashboardPerformance,
  DashboardStats,
  MissionStatus,
  NudgePriority,
  TimelineEvent,
  TimelineRange,
  TimelineReplay
} from '@/types'
import AppShell from '@/components/AppShell'
import {
  Brain,
  CalendarRange,
  Moon,
  Dumbbell,
  CheckCircle2,
  Gauge,
  LineChart,
  Smile,
  Wallet,
  RefreshCw,
  Rocket,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trophy,
  Zap
} from 'lucide-react'

interface StatCard {
  title: string
  value: string
  helper: string
  icon: React.ComponentType<{ className?: string }>
}

type AnalyticsSettingsForm = Omit<AnalyticsSettings, 'predictionProvider' | 'predictionModel'>

const defaultSettingsForm: AnalyticsSettingsForm = {
  sleepHours: 7,
  workoutSessions: 4,
  workoutMinutes: 45,
  weeklySpending: 250,
  habitCompletion: 80,
  mood: 4
}

const missionStatusClass: Record<MissionStatus, string> = {
  completed: 'text-emerald-700 bg-emerald-100/70',
  'on-track': 'text-cyan-700 bg-cyan-100/70',
  'at-risk': 'text-amber-700 bg-amber-100/70',
  behind: 'text-rose-700 bg-rose-100/70'
}

const impactClass: Record<CorrelationImpact, string> = {
  positive: 'text-emerald-700 bg-emerald-100/70',
  negative: 'text-rose-700 bg-rose-100/70',
  neutral: 'text-slate-700 bg-slate-200/70'
}

const nudgePriorityClass: Record<NudgePriority, string> = {
  low: 'text-slate-700 bg-slate-200/70',
  medium: 'text-amber-700 bg-amber-100/70',
  high: 'text-rose-700 bg-rose-100/70'
}

const confidenceClass = {
  high: 'text-emerald-700 bg-emerald-100/70',
  medium: 'text-amber-700 bg-amber-100/70',
  low: 'text-slate-700 bg-slate-200/70'
} as const

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [settings, setSettings] = useState<AnalyticsSettings | null>(null)
  const [settingsForm, setSettingsForm] = useState<AnalyticsSettingsForm>(defaultSettingsForm)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [insights, setInsights] = useState<string[]>([])
  const [performance, setPerformance] = useState<DashboardPerformance | null>(null)
  const [timeline, setTimeline] = useState<TimelineReplay | null>(null)
  const [timelineRange, setTimelineRange] = useState<TimelineRange>('week')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [timelineLoading, setTimelineLoading] = useState(false)
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

  const fetchTimeline = useCallback(async (range: TimelineRange) => {
    try {
      setTimelineLoading(true)
      const timelineData = await apiClient.getDashboardTimeline({ range })
      setTimeline(timelineData)
      setTimelineRange(range)
      setSelectedDate((currentDate) => {
        if (timelineData.daySummaries.some((day) => day.date === currentDate)) {
          return currentDate
        }
        return timelineData.selectedDate
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load timeline data'
      setError(message)
    } finally {
      setTimelineLoading(false)
    }
  }, [])

  const fetchDashboardData = useCallback(async (range: TimelineRange) => {
    try {
      setLoading(true)
      setError('')

      const [dashboardStats, dashboardInsights, dashboardPerformance, dashboardTimeline, dashboardSettings] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getDashboardInsights(),
        apiClient.getDashboardPerformance(),
        apiClient.getDashboardTimeline({ range }),
        apiClient.getDashboardSettings()
      ])

      setStats(dashboardStats)
      setInsights(dashboardInsights)
      setPerformance(dashboardPerformance)
      setTimeline(dashboardTimeline)
      setSettings(dashboardSettings)
      setSettingsForm({
        sleepHours: dashboardSettings.sleepHours,
        workoutSessions: dashboardSettings.workoutSessions,
        workoutMinutes: dashboardSettings.workoutMinutes,
        weeklySpending: dashboardSettings.weeklySpending,
        habitCompletion: dashboardSettings.habitCompletion,
        mood: dashboardSettings.mood
      })
      setTimelineRange(range)
      setSelectedDate(dashboardTimeline.selectedDate)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard data'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchDashboardData('week')
  }, [fetchDashboardData])

  const selectedTimelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!timeline || !selectedDate) {
      return []
    }
    return timeline.events.filter((event) => event.date === selectedDate)
  }, [timeline, selectedDate])

  const visibleInsights = useMemo(() => {
    const topCorrelations = performance?.correlations.map((insight) => insight.summary) ?? []
    return [...topCorrelations, ...insights].slice(0, 6)
  }, [performance, insights])

  const maxForecastScore = useMemo(() => {
    const scores = performance?.forecast.scoreHistory ?? []
    const max = scores.reduce((currentMax, entry) => Math.max(currentMax, entry.score), 1)
    return Math.max(max, 1)
  }, [performance])

  const updateSettingsField = <Key extends keyof AnalyticsSettingsForm>(key: Key, value: AnalyticsSettingsForm[Key]) => {
    setSettingsForm((current) => ({
      ...current,
      [key]: value
    }))
  }

  const saveSettings = async () => {
    try {
      setSettingsSaving(true)
      setError('')

      const updatedSettings = await apiClient.updateDashboardSettings(settingsForm)
      setSettings(updatedSettings)
      setSettingsForm({
        sleepHours: updatedSettings.sleepHours,
        workoutSessions: updatedSettings.workoutSessions,
        workoutMinutes: updatedSettings.workoutMinutes,
        weeklySpending: updatedSettings.weeklySpending,
        habitCompletion: updatedSettings.habitCompletion,
        mood: updatedSettings.mood
      })

      await fetchDashboardData(timelineRange)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save dashboard settings'
      setError(message)
    } finally {
      setSettingsSaving(false)
    }
  }

  if (loading) {
    return (
      <AppShell title="Dashboard" subtitle="Your live performance summary">
        <TiltCard className="glass-panel rounded-3xl px-8 py-10 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-slate-700" />
          <p className="mt-4 text-sm font-semibold tracking-[0.12em] text-slate-600">SYNCING LIFE SIGNALS</p>
        </TiltCard>
      </AppShell>
    )
  }

  if (!stats || !performance || !timeline || !settings) {
    return (
      <AppShell
        title={`Welcome back, ${user?.name ?? 'there'}`}
        subtitle="Your live performance summary"
      >
        <TiltCard className="glass-panel rounded-3xl border border-red-200/60 px-6 py-6 text-red-700">
          <p className="font-semibold">Dashboard data is unavailable right now.</p>
          <p className="mt-1 text-sm">{error || 'Unable to load analytics modules. Please refresh.'}</p>
          <Button
            variant="outline"
            className="mt-4 border-red-300/70 bg-white/60 text-red-700"
            onClick={() => void fetchDashboardData(timelineRange)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </TiltCard>
      </AppShell>
    )
  }

  return (
    <AppShell
      title={`Welcome back, ${user?.name ?? 'there'}`}
      subtitle="Your live performance summary"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="data-pill border-slate-300/50 bg-white/50 text-slate-800"
            onClick={() => void fetchDashboardData(timelineRange)}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      }
    >
      {error ? (
        <TiltCard className="glass-panel mb-7 rounded-3xl border border-red-200/60 px-6 py-5 text-red-700">
          <p className="font-semibold">Unable to load dashboard data.</p>
          <p className="mt-1 text-sm">{error}</p>
        </TiltCard>
      ) : null}

      <section className="mb-8">
        <TiltCard className="glass-panel rounded-3xl p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-slate-700" />
                <h2 className="headline-display text-xl font-semibold text-slate-900">Target Controls</h2>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Personalize score, missions, nudges, and prediction analytics with your own target limits.
              </p>
            </div>

          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-semibold">Sleep Target (hours)</span>
              <Input
                type="number"
                min={4}
                max={12}
                step="0.5"
                value={settingsForm.sleepHours}
                onChange={(event) => updateSettingsField('sleepHours', Number(event.target.value))}
                className="border-slate-300/50 bg-white/70"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-semibold">Workout Sessions / Week</span>
              <Input
                type="number"
                min={0}
                max={14}
                value={settingsForm.workoutSessions}
                onChange={(event) => updateSettingsField('workoutSessions', Number(event.target.value))}
                className="border-slate-300/50 bg-white/70"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-semibold">Workout Minutes / Day</span>
              <Input
                type="number"
                min={10}
                max={180}
                value={settingsForm.workoutMinutes}
                onChange={(event) => updateSettingsField('workoutMinutes', Number(event.target.value))}
                className="border-slate-300/50 bg-white/70"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-semibold">Weekly Spending Cap</span>
              <Input
                type="number"
                min={0}
                step="1"
                value={settingsForm.weeklySpending}
                onChange={(event) => updateSettingsField('weeklySpending', Number(event.target.value))}
                className="border-slate-300/50 bg-white/70"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-semibold">Habit Completion Target (%)</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={settingsForm.habitCompletion}
                onChange={(event) => updateSettingsField('habitCompletion', Number(event.target.value))}
                className="border-slate-300/50 bg-white/70"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span className="font-semibold">Mood Target (/5)</span>
              <Input
                type="number"
                min={1}
                max={5}
                value={settingsForm.mood}
                onChange={(event) => updateSettingsField('mood', Number(event.target.value))}
                className="border-slate-300/50 bg-white/70"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="border-slate-300/50 bg-white/70 text-slate-800"
              onClick={() => void saveSettings()}
              disabled={settingsSaving}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${settingsSaving ? 'animate-spin' : ''}`} />
              {settingsSaving ? 'Saving…' : 'Save Targets'}
            </Button>
            <p className="text-xs text-slate-500">
              Saving refreshes the life score, missions, nudges, badges, and prediction inputs immediately.
            </p>
          </div>
        </TiltCard>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TiltCard className="glass-panel h-full rounded-3xl p-6">
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-slate-700" />
            <h2 className="headline-display text-xl font-semibold text-slate-900">Life Score Engine</h2>
          </div>

          <div className="mt-5 flex items-end gap-5">
            <div>
              <p className="headline-display text-5xl font-bold text-slate-900">
                {performance.lifeScore.grade === '—' ? '—' : performance.lifeScore.score}
              </p>
              <p className="text-sm text-slate-600">
                {performance.lifeScore.grade === '—' ? 'No data logged today' : `Grade ${performance.lifeScore.grade}`}
              </p>
            </div>
            <div className="data-pill rounded-2xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700">
              Updated {new Date(performance.generatedAt).toLocaleTimeString()}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {performance.lifeScore.components.map((component) => (
              <div key={component.key}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold uppercase tracking-[0.1em]">{component.label}</span>
                  <span>
                    {component.value !== null && component.value !== 0 ? `${component.score}/100` : '—'} • {component.value ?? '—'} {component.value !== null ? component.unit : ''}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/70">
                  <div className="h-full rounded-full bg-slate-900" style={{ width: `${component.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </TiltCard>

        <TiltCard className="glass-panel h-full rounded-3xl p-6">
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5 text-slate-700" />
            <h2 className="headline-display text-xl font-semibold text-slate-900">Tomorrow Forecast</h2>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="headline-display text-4xl font-bold text-slate-900">
              {performance.forecast.readinessScore}
            </span>
            <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-800 bg-white/70">
              Readiness Score
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${confidenceClass[performance.forecast.confidence]}`}>
              {performance.forecast.confidence} confidence
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-800">
              Trend {performance.forecast.trendDelta >= 0 ? '+' : ''}{performance.forecast.trendDelta}
            </span>
          </div>

          <p className="mt-4 rounded-2xl bg-white/60 px-4 py-3 text-sm text-slate-700">
            {performance.forecast.narrative}
          </p>

          <div className="mt-4">
            <p className="mb-2 text-sm font-semibold text-slate-800">Next Best Actions</p>
            <div className="space-y-2">
              {performance.forecast.actions.map((action) => (
                <div key={action} className="rounded-2xl bg-white/60 px-4 py-3 text-sm text-slate-700">
                  {action}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="mb-1 font-semibold text-slate-800">Strengths</p>
              {performance.forecast.strengths.length > 0 ? (
                <ul className="space-y-1 text-slate-600">
                  {performance.forecast.strengths.map((strength) => (
                    <li key={strength}>• {strength}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">Add more logs to reveal strengths.</p>
              )}
            </div>
            <div>
              <p className="mb-1 font-semibold text-slate-800">Risks</p>
              {performance.forecast.risks.length > 0 ? (
                <ul className="space-y-1 text-slate-600">
                  {performance.forecast.risks.map((risk) => (
                    <li key={risk}>• {risk}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">No major risks detected.</p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Score History</p>
            <div className="flex items-end gap-1 rounded-2xl bg-white/55 p-3">
              {performance.forecast.scoreHistory.slice(-10).map((entry) => (
                <div key={entry.date} className="group flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-slate-900/80"
                    style={{ height: `${Math.max(8, Math.round((entry.score / maxForecastScore) * 64))}px` }}
                  />
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-700">
                    {entry.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TiltCard>
      </section>

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

      <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="stagger-rise glass-panel rounded-3xl p-6" style={{ animationDelay: '420ms' }}>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-slate-700" />
            <h2 className="headline-display text-xl font-semibold text-slate-900">Correlation Radar</h2>
          </div>

          {performance.correlations.length > 0 ? (
            <div className="mt-4 space-y-3">
              {performance.correlations.map((correlation) => (
                <div key={correlation.id} className="rounded-2xl bg-white/60 px-4 py-4 text-sm text-slate-700">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{correlation.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${impactClass[correlation.impact]}`}>
                      {correlation.impact}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${confidenceClass[correlation.confidence]}`}>
                      {correlation.confidence}
                    </span>
                  </div>
                  <p>{correlation.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-white/45 px-4 py-3 text-sm text-slate-600">
              Add more logs to unlock richer insight correlations.
            </p>
          )}
        </div>

        <div className="stagger-rise glass-panel rounded-3xl p-6" style={{ animationDelay: '480ms' }}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-slate-700" />
            <h2 className="headline-display text-xl font-semibold text-slate-900">Insight Stream</h2>
          </div>

          {visibleInsights.length > 0 ? (
            <div className="mt-4 space-y-3">
              {visibleInsights.map((insight, index) => (
                <div key={`${insight}-${index}`} className="data-pill rounded-2xl px-4 py-3 text-sm text-slate-700">
                  {insight}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl bg-white/45 px-4 py-3 text-sm text-slate-600">
              Log activity for a few days to activate your AI insights stream.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <TiltCard className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-slate-700" />
            <h2 className="headline-display text-xl font-semibold text-slate-900">Mission Planner</h2>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Week {performance.goals.weekStart} → {performance.goals.weekEnd}
          </p>

          <div className="mt-4 space-y-3">
            {performance.goals.missions.map((mission) => (
              <div key={mission.id} className="rounded-2xl bg-white/60 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{mission.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${missionStatusClass[mission.status]}`}>
                    {mission.status}
                  </span>
                </div>

                <p className="text-sm text-slate-600">{mission.description}</p>

                <div className="mt-3 h-2 rounded-full bg-white/70">
                  <div className="h-full rounded-full bg-slate-900" style={{ width: `${mission.progressPercent}%` }} />
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                  <span>
                    {mission.current} / {mission.target} {mission.unit}
                  </span>
                  <span>Reward {mission.rewardXp} XP</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/60 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Streak Weeks</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{performance.goals.streakRewards.streakWeeks}</p>
            </div>
            <div className="rounded-2xl bg-white/60 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">XP Bonus</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{performance.goals.streakRewards.xpBonus}</p>
            </div>
            <div className="rounded-2xl bg-white/60 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Shield Bonus</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{performance.goals.streakRewards.shieldBonus}</p>
            </div>
          </div>
        </TiltCard>

        <TiltCard className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-slate-700" />
            <h2 className="headline-display text-xl font-semibold text-slate-900">Gamification Hub</h2>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Total XP</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{performance.gamification.totalXp}</p>
            </div>
            <div className="rounded-2xl bg-white/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Level</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{performance.gamification.level}</p>
            </div>
            <div className="rounded-2xl bg-white/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Streak Days</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{performance.gamification.streakDays}</p>
            </div>
            <div className="rounded-2xl bg-white/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Shields</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{performance.gamification.streakShields}</p>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
              <span>Level Progress</span>
              <span>{performance.gamification.levelProgressPercent}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/70">
              <div
                className="h-full rounded-full bg-slate-900"
                style={{ width: `${performance.gamification.levelProgressPercent}%` }}
              />
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold text-slate-800">Badges</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {performance.gamification.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-2xl px-3 py-3 text-sm ${badge.earned ? 'bg-emerald-100/70 text-emerald-800' : 'bg-white/60 text-slate-600'}`}
                >
                  <p className="font-semibold">{badge.name}</p>
                  <p className="mt-1 text-xs">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        </TiltCard>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-5 xl:grid-cols-2">
        <TiltCard className="glass-panel rounded-3xl p-6">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-slate-700" />
            <h2 className="headline-display text-xl font-semibold text-slate-900">Smart Nudges</h2>
          </div>

          <div className="mt-4 space-y-3">
            {performance.nudges.map((nudge) => (
              <div key={nudge.id} className="rounded-2xl bg-white/60 px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-900">{nudge.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${nudgePriorityClass[nudge.priority]}`}>
                    {nudge.priority}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{nudge.message}</p>
                <p className="mt-2 text-xs text-slate-600">
                  Best window: {nudge.recommendedWindow} • Trigger: {nudge.triggerReason}
                </p>
              </div>
            ))}
          </div>
        </TiltCard>

        <TiltCard className="glass-panel rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-slate-700" />
              <h2 className="headline-display text-xl font-semibold text-slate-900">Timeline Replay</h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className={`h-8 rounded-full px-3 text-xs ${timelineRange === 'day' ? 'bg-slate-900 text-white' : 'bg-white/60 text-slate-700'}`}
                onClick={() => {
                  if (timelineRange !== 'day') {
                    void fetchTimeline('day')
                  }
                }}
              >
                Day
              </Button>
              <Button
                variant="outline"
                className={`h-8 rounded-full px-3 text-xs ${timelineRange === 'week' ? 'bg-slate-900 text-white' : 'bg-white/60 text-slate-700'}`}
                onClick={() => {
                  if (timelineRange !== 'week') {
                    void fetchTimeline('week')
                  }
                }}
              >
                Week
              </Button>
            </div>
          </div>

          {timelineLoading ? (
            <p className="mt-4 text-sm text-slate-600">Loading timeline…</p>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {timeline.daySummaries.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDate(day.date)}
                    className={`rounded-2xl px-3 py-2 text-left text-xs ${selectedDate === day.date ? 'bg-slate-900 text-white' : 'bg-white/60 text-slate-700'}`}
                  >
                    <p className="font-semibold">{day.label}</p>
                    <p>Score {day.lifeScore}</p>
                    <p>{day.eventCount} events</p>
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-2">
                {selectedTimelineEvents.length > 0 ? (
                  selectedTimelineEvents.map((event) => (
                    <div key={event.id} className="rounded-2xl bg-white/60 px-4 py-3 text-sm text-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-900">{event.title}</p>
                        <span className={`text-xs font-semibold ${event.scoreImpact >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {event.scoreImpact >= 0 ? '+' : ''}{event.scoreImpact}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{event.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-white/55 px-4 py-3 text-sm text-slate-600">
                    No events for {selectedDate || timeline.selectedDate}. Log activity to build your replay trail.
                  </p>
                )}
              </div>
            </>
          )}
        </TiltCard>
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
