'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageContainer from '@/components/PageContainer'
import TiltCard from '@/components/TiltCard'
import { apiClient } from '@/lib/api-client'
import { WORKOUT_TYPES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { WorkoutLog } from '@/types'
import { Dumbbell, RefreshCw } from 'lucide-react'

interface WorkoutFormState {
  type: string
  duration: string
  date: string
  calories: string
  notes: string
}

const initialForm: WorkoutFormState = {
  type: WORKOUT_TYPES[0],
  duration: '30',
  date: new Date().toISOString().split('T')[0],
  calories: '',
  notes: ''
}

export default function WorkoutPage() {
  const [form, setForm] = useState<WorkoutFormState>(initialForm)
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchWorkouts = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiClient.getWorkouts()
      setWorkouts(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load workouts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchWorkouts()
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      await apiClient.createWorkout({
        type: form.type,
        duration: Number(form.duration),
        date: form.date,
        calories: form.calories ? Number(form.calories) : undefined,
        notes: form.notes.trim() || undefined
      })

      setForm((prev) => ({ ...prev, notes: '', calories: '' }))
      await fetchWorkouts()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save workout')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer
      title="Workout Tracking"
      subtitle="Capture sessions and measure training consistency"
      actions={
        <Button
          variant="outline"
          className="data-pill border-slate-300/50 bg-white/60 text-slate-800"
          onClick={() => void fetchWorkouts()}
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
              <Dumbbell className="h-5 w-5" />
            </div>
            <h2 className="headline-display text-xl font-semibold text-slate-900">Log Workout</h2>
            <p className="mt-1 text-sm text-slate-600">Track exercise volume and progression.</p>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              {error ? (
                <div className="rounded-xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Workout Type</span>
                <select
                  value={form.type}
                  onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-slate-300/60 bg-white/70 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {WORKOUT_TYPES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Duration (minutes)</span>
                  <Input
                    type="number"
                    min={1}
                    value={form.duration}
                    onChange={(event) => setForm((prev) => ({ ...prev, duration: event.target.value }))}
                    className="h-11 rounded-xl border-slate-300/60 bg-white/70"
                    required
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Date</span>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                    className="h-11 rounded-xl border-slate-300/60 bg-white/70"
                    required
                  />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Calories (optional)</span>
                <Input
                  type="number"
                  min={0}
                  value={form.calories}
                  onChange={(event) => setForm((prev) => ({ ...prev, calories: event.target.value }))}
                  className="h-11 rounded-xl border-slate-300/60 bg-white/70"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Notes</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  className="min-h-24 w-full rounded-xl border border-slate-300/60 bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="How did the session feel?"
                />
              </label>

              <Button type="submit" disabled={saving} className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                {saving ? 'Saving...' : 'Save Workout'}
              </Button>
            </form>
          </div>
        </TiltCard>

        <TiltCard className="glass-panel rounded-3xl p-6">
          <div className="relative z-10">
            <h2 className="headline-display text-xl font-semibold text-slate-900">Recent Workouts</h2>

            {loading ? (
              <p className="mt-5 text-sm text-slate-600">Loading workouts...</p>
            ) : workouts.length === 0 ? (
              <p className="mt-5 rounded-xl bg-white/55 px-4 py-3 text-sm text-slate-600">
                No workouts logged yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/70 bg-white/55">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100/80 text-left text-xs uppercase tracking-[0.12em] text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Calories</th>
                      <th className="px-4 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workouts.slice(0, 14).map((workout) => (
                      <tr key={workout.id} className="border-t border-slate-200/60 text-slate-700">
                        <td className="px-4 py-3">{workout.type}</td>
                        <td className="px-4 py-3">{workout.duration} min</td>
                        <td className="px-4 py-3">{workout.calories ?? '--'}</td>
                        <td className="px-4 py-3">{formatDate(workout.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TiltCard>
      </div>
    </PageContainer>
  )
}
