'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageContainer from '@/components/PageContainer'
import TiltCard from '@/components/TiltCard'
import { apiClient } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'
import type { SleepLog } from '@/types'
import { Moon, RefreshCw } from 'lucide-react'

interface SleepFormState {
  date: string
  sleepTime: string
  wakeTime: string
  quality: string
  notes: string
}

const initialForm: SleepFormState = {
  date: new Date().toISOString().split('T')[0],
  sleepTime: '23:00',
  wakeTime: '07:00',
  quality: '4',
  notes: ''
}

const buildISODateTime = (date: string, time: string) => new Date(`${date}T${time}:00`).toISOString()

export default function SleepPage() {
  const [form, setForm] = useState<SleepFormState>(initialForm)
  const [logs, setLogs] = useState<SleepLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const averageQuality = useMemo(() => {
    if (!logs.length) {
      return null
    }
    const total = logs.reduce((sum, log) => sum + log.quality, 0)
    return (total / logs.length).toFixed(1)
  }, [logs])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await apiClient.getSleepLogs()
      setLogs(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sleep logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchLogs()
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      await apiClient.createSleepLog({
        date: form.date,
        sleepTime: buildISODateTime(form.date, form.sleepTime),
        wakeTime: buildISODateTime(form.date, form.wakeTime),
        quality: Number(form.quality),
        notes: form.notes.trim() || undefined
      })

      setForm((prev) => ({ ...prev, notes: '' }))
      await fetchLogs()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save sleep log')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer
      title="Sleep Tracking"
      subtitle="Log bedtime quality and wake patterns"
      actions={
        <Button
          variant="outline"
          className="data-pill border-slate-300/50 bg-white/60 text-slate-800"
          onClick={() => void fetchLogs()}
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
              <Moon className="h-5 w-5" />
            </div>
            <h2 className="headline-display text-xl font-semibold text-slate-900">Add Sleep Log</h2>
            <p className="mt-1 text-sm text-slate-600">Keep entries daily for better trend quality.</p>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              {error ? (
                <div className="rounded-xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

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

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Sleep Time</span>
                  <Input
                    type="time"
                    value={form.sleepTime}
                    onChange={(event) => setForm((prev) => ({ ...prev, sleepTime: event.target.value }))}
                    className="h-11 rounded-xl border-slate-300/60 bg-white/70"
                    required
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Wake Time</span>
                  <Input
                    type="time"
                    value={form.wakeTime}
                    onChange={(event) => setForm((prev) => ({ ...prev, wakeTime: event.target.value }))}
                    className="h-11 rounded-xl border-slate-300/60 bg-white/70"
                    required
                  />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Quality (1-5)</span>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  value={form.quality}
                  onChange={(event) => setForm((prev) => ({ ...prev, quality: event.target.value }))}
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
                  placeholder="How was your rest?"
                />
              </label>

              <Button type="submit" disabled={saving} className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                {saving ? 'Saving...' : 'Save Sleep Log'}
              </Button>
            </form>
          </div>
        </TiltCard>

        <TiltCard className="glass-panel rounded-3xl p-6">
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="headline-display text-xl font-semibold text-slate-900">Recent Sleep Logs</h2>
              <div className="data-pill rounded-full px-3 py-1.5 text-xs font-semibold text-slate-700">
                Avg Quality: {averageQuality ?? '--'}
              </div>
            </div>

            {loading ? (
              <p className="mt-5 text-sm text-slate-600">Loading logs...</p>
            ) : logs.length === 0 ? (
              <p className="mt-5 rounded-xl bg-white/55 px-4 py-3 text-sm text-slate-600">
                No sleep logs yet. Add your first entry.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/70 bg-white/55">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100/80 text-left text-xs uppercase tracking-[0.12em] text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Sleep</th>
                      <th className="px-4 py-3">Wake</th>
                      <th className="px-4 py-3">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice(0, 12).map((log) => (
                      <tr key={log.id} className="border-t border-slate-200/60 text-slate-700">
                        <td className="px-4 py-3">{formatDate(log.date)}</td>
                        <td className="px-4 py-3">{new Date(log.sleepTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4 py-3">{new Date(log.wakeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4 py-3">{log.quality}/5</td>
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
