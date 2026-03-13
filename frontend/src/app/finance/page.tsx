'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import PageContainer from '@/components/PageContainer'
import TiltCard from '@/components/TiltCard'
import { apiClient } from '@/lib/api-client'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { formatCurrency, formatDate, getLocalDateInputValue } from '@/lib/utils'
import type { CategoryTotal, Expense } from '@/types'
import { RefreshCw, Wallet } from 'lucide-react'

interface ExpenseFormState {
  amount: string
  category: string
  date: string
  description: string
}

const initialForm: ExpenseFormState = {
  amount: '',
  category: EXPENSE_CATEGORIES[0],
  date: getLocalDateInputValue(),
  description: ''
}

export default function FinancePage() {
  const [form, setForm] = useState<ExpenseFormState>(initialForm)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [totals, setTotals] = useState<CategoryTotal[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchFinanceData = async () => {
    try {
      setLoading(true)
      setError('')

      const [expenseData, totalsData] = await Promise.all([
        apiClient.getExpenses(),
        apiClient.getCategoryTotals()
      ])

      setExpenses(expenseData)
      setTotals(totalsData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load finance data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchFinanceData()
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      await apiClient.createExpense({
        amount: Number(form.amount),
        category: form.category,
        date: form.date,
        description: form.description.trim() || undefined
      })

      setForm((prev) => ({ ...prev, amount: '', description: '' }))
      await fetchFinanceData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save expense')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer
      title="Finance Tracking"
      subtitle="Log expenses and monitor category distribution"
      actions={
        <Button
          variant="outline"
          className="data-pill border-slate-300/50 bg-white/60 text-slate-800"
          onClick={() => void fetchFinanceData()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[1.05fr_1.35fr]">
        <div className="space-y-5">
          <TiltCard className="glass-panel rounded-3xl p-6">
            <div className="relative z-10">
              <div className="mb-4 inline-flex rounded-2xl bg-slate-900 p-2.5 text-cyan-200">
                <Wallet className="h-5 w-5" />
              </div>
              <h2 className="headline-display text-xl font-semibold text-slate-900">Add Expense</h2>
              <p className="mt-1 text-sm text-slate-600">Keep your spending signal current.</p>

              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                {error ? (
                  <div className="rounded-xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Amount</span>
                  <Input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={form.amount}
                    onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                    className="h-11 rounded-xl border-slate-300/60 bg-white/70"
                    required
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Category</span>
                    <select
                      value={form.category}
                      onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-300/60 bg-white/70 px-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      {EXPENSE_CATEGORIES.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
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
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">Description</span>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                    className="min-h-24 w-full rounded-xl border border-slate-300/60 bg-white/70 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                    placeholder="Lunch, fuel, subscriptions..."
                  />
                </label>

                <Button type="submit" disabled={saving} className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                  {saving ? 'Saving...' : 'Save Expense'}
                </Button>
              </form>
            </div>
          </TiltCard>

          <TiltCard className="glass-panel rounded-3xl p-6">
            <div className="relative z-10">
              <h2 className="headline-display text-xl font-semibold text-slate-900">Category Totals</h2>

              {loading ? (
                <p className="mt-4 text-sm text-slate-600">Loading totals...</p>
              ) : totals.length === 0 ? (
                <p className="mt-4 rounded-xl bg-white/55 px-4 py-3 text-sm text-slate-600">No category totals yet.</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {totals.map((item) => (
                    <div key={item.category} className="data-pill flex items-center justify-between rounded-xl px-4 py-2.5 text-sm text-slate-700">
                      <span>{item.category}</span>
                      <span className="font-semibold">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TiltCard>
        </div>

        <TiltCard className="glass-panel rounded-3xl p-6">
          <div className="relative z-10">
            <h2 className="headline-display text-xl font-semibold text-slate-900">Recent Expenses</h2>

            {loading ? (
              <p className="mt-5 text-sm text-slate-600">Loading expenses...</p>
            ) : expenses.length === 0 ? (
              <p className="mt-5 rounded-xl bg-white/55 px-4 py-3 text-sm text-slate-600">No expenses logged yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/70 bg-white/55">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-100/80 text-left text-xs uppercase tracking-[0.12em] text-slate-600">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.slice(0, 16).map((expense) => (
                      <tr key={expense.id} className="border-t border-slate-200/60 text-slate-700">
                        <td className="px-4 py-3">{formatDate(expense.date)}</td>
                        <td className="px-4 py-3">{expense.category}</td>
                        <td className="px-4 py-3">{formatCurrency(expense.amount)}</td>
                        <td className="px-4 py-3">{expense.description || '--'}</td>
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
