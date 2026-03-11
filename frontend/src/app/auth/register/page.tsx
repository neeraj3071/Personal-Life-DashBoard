'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import TiltCard from '@/components/TiltCard'
import { ArrowRight, Lock, Mail, UserRound } from 'lucide-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      await register(name, email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="scene-shell min-h-screen">
      <div className="scene-aurora" />
      <div className="scene-grid" />
      <div className="orb orb--one" />
      <div className="orb orb--three" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
          <section className="stagger-rise hidden lg:block" style={{ animationDelay: '80ms' }}>
            <p className="data-pill inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Start Fresh
            </p>
            <h1 className="headline-display mt-6 text-5xl font-bold text-slate-900">
              Build Your
              <br />
              Life Command Center
            </h1>
            <p className="subhead-display mt-5 max-w-md text-base leading-relaxed text-slate-700">
              Create your account and begin capturing habits, health signals, and spending behavior in a
              single connected workspace.
            </p>
          </section>

          <div className="stagger-rise" style={{ animationDelay: '160ms' }}>
            <TiltCard className="glass-panel rounded-3xl p-7 sm:p-8">
              <div className="relative z-10">
                <h2 className="headline-display text-3xl font-semibold text-slate-900">Create account</h2>
                <p className="mt-2 text-sm text-slate-600">Setup takes less than a minute.</p>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                  {error ? (
                    <div className="rounded-xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}

                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Name</span>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="text"
                        required
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Neeraj Saini"
                        className="h-11 rounded-xl border-slate-300/60 bg-white/70 pl-10"
                      />
                    </div>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Email</span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="h-11 rounded-xl border-slate-300/60 bg-white/70 pl-10"
                      />
                    </div>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Password</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="At least 6 characters"
                        className="h-11 rounded-xl border-slate-300/60 bg-white/70 pl-10"
                      />
                    </div>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">Confirm Password</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Re-enter password"
                        className="h-11 rounded-xl border-slate-300/60 bg-white/70 pl-10"
                      />
                    </div>
                  </label>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="mt-2 h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                    {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                  </Button>
                </form>

                <p className="mt-5 text-center text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link href="/auth/login" className="font-semibold text-slate-900 underline-offset-4 hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </TiltCard>
          </div>
        </div>
      </main>
    </div>
  )
}
