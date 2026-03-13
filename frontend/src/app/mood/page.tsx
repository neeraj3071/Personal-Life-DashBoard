'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageContainer from '@/components/PageContainer'
import TiltCard from '@/components/TiltCard'
import { apiClient } from '@/lib/api-client'
import { MOOD_SCALE } from '@/lib/constants'
import { formatDate, getLocalDateInputValue } from '@/lib/utils'
import type { MoodLog } from '@/types'
import { RefreshCw, Smile } from 'lucide-react'

interface MoodFormState {
  mood: string
  date: string
  notes: string
}

const initialForm: MoodFormState = {
  mood: '4',
  date: getLocalDateInputValue(),
  notes: ''
}

const moodLabel = (value: number) => MOOD_SCALE.find((item) => item.value === value)?.label ?? 'Unknown'

export default function MoodPage() {
  const [form, setForm] = useState<MoodFormState>(initialForm)
  const [logs, setLogs] = useState<MoodLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchMoodLogs = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiClient.getMoodLogs()
      setLogs(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load mood logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchMoodLogs()
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      await apiClient.createMoodLog({
        mood: Number(form.mood),
        date: form.date,
        notes: form.notes.trim() || undefined
      })
      setForm((prev) => ({ ...prev, notes: '' }))
      await fetchMoodLogs()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save mood log')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer
      title="Mood Tracking"
      subtitle="Capture how you feel and review emotional patterns"
      actions={
        <Button
          variant="outline"
          className="data-pill border-slate-300/50 bg-white/60 text-slate-800"
          onClick={() => void fetchMoodLogs()}
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
              <Smile className="h-5 w-5" />
            </div>
            <h2 className="headline-display text-xl font-semibold text-slate-900">Log Mood</h2>
            <p className="mt-1 text-sm text-slate-600">Rate your mood daily to reveal trend lines.</p>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              {error ? (
                <div className="rounded-xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Mood (1-5)</span>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={form.mood}
                  onChange={(event) => setForm((prev) => ({ ...prev, mood: event.target.value }))}
                  className="h-11 rounded-xl border-slate-300/60 bg-white/70"
                  required
                />
                <p className="text-xs text-slate-500">{moodLabel(Number(form.mood))}</p>
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

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Notes</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  className="min-h-24 w-full rounded-xl border border-slate-300/60 bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="Anything affecting your mood today?"
                />
              </label>

              <Button type="submit" disabled={saving} className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                {saving ? 'Saving...' : 'Save Mood'}
              </Button>
            </form>
          </div>
        </TiltCard>

        <TiltCard className="glass-panel rounded-3xl p-6">
          <div className="relative z-10">
            <h2 className="headline-display text-xl font-semibold text-slate-900">Mood Timeline</h2>

            {loading ? (
              <p className="mt-5 text-sm text-slate-600">Loading mood logs...</p>
            ) : logs.length === 0 ? (
              <p className="mt-5 rounded-xl bg-white/55 px-4 py-3 text-sm text-slate-600">
                No mood logs yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/70 bg-white/55">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100/80 text-left text-xs uppercase tracking-[0.12em] text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Mood</th>
                      <th className="px-4 py-3">Label</th>
                      <th className="px-4 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 14).map((log) => (
                      <tr key={log.id} className="border-t border-slate-200/60 text-slate-700">
                        <td className="px-4 py-3">{formatDate(log.date)}</td>
                        <td className="px-4 py-3">{log.mood}/5</td>
                        <td className="px-4 py-3">{moodLabel(log.mood)}</td>
                        <td className="px-4 py-3">{log.notes || '--'}</td>
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
