'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageContainer from '@/components/PageContainer'
import TiltCard from '@/components/TiltCard'
import { apiClient } from '@/lib/api-client'
import { formatDate, getLocalDateInputValue } from '@/lib/utils'
import type { Habit, HabitLog } from '@/types'
import { CheckSquare, RefreshCw, Trash2 } from 'lucide-react'

interface HabitFormState {
  name: string
  description: string
}

type HabitDailyStatus = 'completed' | 'missed' | 'not-logged'

const initialForm: HabitFormState = {
  name: '',
  description: ''
}

export default function HabitsPage() {
  const [form, setForm] = useState<HabitFormState>(initialForm)
  const [logDate, setLogDate] = useState(getLocalDateInputValue())
  const [habits, setHabits] = useState<Habit[]>([])
  const [selectedHabitId, setSelectedHabitId] = useState<string>('')
  const [logs, setLogs] = useState<HabitLog[]>([])
  const [dailyStatusByHabit, setDailyStatusByHabit] = useState<Record<string, HabitDailyStatus>>({})
  const [loggingHabitId, setLoggingHabitId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchHabits = useCallback(async (preferredHabitId?: string) => {
    try {
      setLoading(true)
      setError('')
      const data = await apiClient.getHabits()
      setHabits(data)

      if (data.length > 0) {
        const activeHabitId = preferredHabitId && data.some((habit) => habit.id === preferredHabitId)
          ? preferredHabitId
          : data[0].id

        setSelectedHabitId(activeHabitId)
        const habitLogs = await apiClient.getHabitLogs(activeHabitId)
        setLogs(habitLogs)
      } else {
        setSelectedHabitId('')
        setLogs([])
        setDailyStatusByHabit({})
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load habits')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshDailyStatuses = useCallback(async (habitList: Habit[], date: string) => {
    if (habitList.length === 0) {
      setDailyStatusByHabit({})
      return
    }

    const statusEntries = await Promise.all(
      habitList.map(async (habit): Promise<[string, HabitDailyStatus]> => {
        const dayLogs = await apiClient.getHabitLogs(habit.id, date, date)
        const dayLog = dayLogs[0]

        if (!dayLog) {
          return [habit.id, 'not-logged']
        }

        return [habit.id, dayLog.completed ? 'completed' : 'missed']
      })
    )

    setDailyStatusByHabit(Object.fromEntries(statusEntries))
  }, [])

  useEffect(() => {
    void fetchHabits()
  }, [fetchHabits])

  useEffect(() => {
    if (habits.length === 0) {
      setDailyStatusByHabit({})
      return
    }

    void refreshDailyStatuses(habits, logDate).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Failed to refresh habit statuses')
    })
  }, [habits, logDate, refreshDailyStatuses])

  const refreshLogsForHabit = async (habitId: string) => {
    if (!habitId) {
      setLogs([])
      return
    }
    const habitLogs = await apiClient.getHabitLogs(habitId)
    setLogs(habitLogs)
  }

  const handleCreateHabit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      await apiClient.createHabit({
        name: form.name.trim(),
        description: form.description.trim() || undefined
      })
      setForm(initialForm)
      await fetchHabits(selectedHabitId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to create habit')
    } finally {
      setSaving(false)
    }
  }

  const handleLogHabit = async (habitId: string, completed: boolean) => {
    setError('')
    setLoggingHabitId(habitId)
    try {
      await apiClient.logHabit(habitId, logDate, completed)
      if (selectedHabitId !== habitId) {
        setSelectedHabitId(habitId)
      }

      await Promise.all([
        refreshLogsForHabit(habitId),
        refreshDailyStatuses(habits, logDate)
      ])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to log habit')
    } finally {
      setLoggingHabitId(null)
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    setError('')
    try {
      await apiClient.deleteHabit(habitId)
      const preferredHabitId = selectedHabitId === habitId ? undefined : selectedHabitId
      await fetchHabits(preferredHabitId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete habit')
    }
  }

  const handleSelectHabit = async (habitId: string) => {
    setSelectedHabitId(habitId)
    setError('')
    try {
      await refreshLogsForHabit(habitId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load habit logs')
    }
  }

  return (
    <PageContainer
      title="Habit Tracking"
      subtitle="Create habits and mark completion daily"
      actions={
        <Button
          variant="outline"
          className="data-pill border-slate-300/50 bg-white/60 text-slate-800"
          onClick={() => void fetchHabits()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_1.4fr]">
        <TiltCard className="glass-panel rounded-3xl p-6">
          <div className="relative z-10">
            <div className="mb-4 inline-flex rounded-2xl bg-slate-900 p-2.5 text-cyan-200">
              <CheckSquare className="h-5 w-5" />
            </div>
            <h2 className="headline-display text-xl font-semibold text-slate-900">Create Habit</h2>
            <p className="mt-1 text-sm text-slate-600">Define habits you want to stay consistent with.</p>

            <form className="mt-5 space-y-4" onSubmit={handleCreateHabit}>
              {error ? (
                <div className="rounded-xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Name</span>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="h-11 rounded-xl border-slate-300/60 bg-white/70"
                  placeholder="Morning Run"
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="min-h-24 w-full rounded-xl border border-slate-300/60 bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="30 min jog and stretching"
                />
              </label>

              <Button type="submit" disabled={saving} className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                {saving ? 'Creating...' : 'Create Habit'}
              </Button>
            </form>
          </div>
        </TiltCard>

        <div className="space-y-5">
          <TiltCard className="glass-panel rounded-3xl p-6">
            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="headline-display text-xl font-semibold text-slate-900">Your Habits</h2>
                <Input
                  type="date"
                  value={logDate}
                  onChange={(event) => setLogDate(event.target.value)}
                  className="h-10 w-44 rounded-xl border-slate-300/60 bg-white/70"
                />
              </div>

              {loading ? (
                <p className="mt-4 text-sm text-slate-600">Loading habits...</p>
              ) : habits.length === 0 ? (
                <p className="mt-4 rounded-xl bg-white/55 px-4 py-3 text-sm text-slate-600">No habits yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {habits.map((habit) => {
                    const status = dailyStatusByHabit[habit.id] ?? 'not-logged'
                    const statusLabel = status === 'completed' ? 'Completed' : status === 'missed' ? 'Missed' : 'Not logged'
                    const statusClassName = status === 'completed'
                      ? 'bg-emerald-100/80 text-emerald-700'
                      : status === 'missed'
                        ? 'bg-rose-100/80 text-rose-700'
                        : 'bg-slate-100/80 text-slate-600'

                    return (
                    <div
                      key={habit.id}
                      className={`rounded-2xl border px-4 py-3 ${
                        selectedHabitId === habit.id
                          ? 'border-slate-900/50 bg-slate-900/8'
                          : 'border-slate-200/70 bg-white/55'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <button
                          type="button"
                          className="text-left"
                          onClick={() => void handleSelectHabit(habit.id)}
                        >
                          <p className="text-sm font-semibold text-slate-900">{habit.name}</p>
                          {habit.description ? (
                            <p className="mt-1 text-sm text-slate-600">{habit.description}</p>
                          ) : null}
                          <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName}`}>
                            {statusLabel} • {logDate}
                          </span>
                        </button>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="h-8 rounded-lg bg-emerald-600 px-3 text-white hover:bg-emerald-500"
                            disabled={loggingHabitId !== null}
                            onClick={() => void handleLogHabit(habit.id, true)}
                          >
                            Done
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-lg border-slate-300 bg-white/70 px-3"
                            disabled={loggingHabitId !== null}
                            onClick={() => void handleLogHabit(habit.id, false)}
                          >
                            Missed
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="outline"
                            className="border-red-200 bg-red-50/60 text-red-600"
                            disabled={loggingHabitId !== null}
                            onClick={() => void handleDeleteHabit(habit.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </div>
          </TiltCard>

          <TiltCard className="glass-panel rounded-3xl p-6">
            <div className="relative z-10">
              <h2 className="headline-display text-xl font-semibold text-slate-900">Habit Logs</h2>

              {selectedHabitId === '' ? (
                <p className="mt-4 rounded-xl bg-white/55 px-4 py-3 text-sm text-slate-600">
                  Select a habit to view logs.
                </p>
              ) : logs.length === 0 ? (
                <p className="mt-4 rounded-xl bg-white/55 px-4 py-3 text-sm text-slate-600">
                  No logs available for this habit yet.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/70 bg-white/55">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100/80 text-left text-xs uppercase tracking-[0.12em] text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(0, 14).map((log) => (
                        <tr key={log.id} className="border-t border-slate-200/60 text-slate-700">
                          <td className="px-4 py-3">{formatDate(log.date)}</td>
                          <td className="px-4 py-3">{log.completed ? 'Completed' : 'Missed'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TiltCard>
        </div>
      </div>
    </PageContainer>
  )
}
