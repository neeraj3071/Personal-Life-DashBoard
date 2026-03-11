'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import TiltCard from '@/components/TiltCard'
import { ArrowRight, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="scene-shell min-h-screen">
      <div className="scene-aurora" />
      <div className="scene-grid" />
      <div className="orb orb--one" />
      <div className="orb orb--two" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
          <section className="stagger-rise hidden lg:block" style={{ animationDelay: '80ms' }}>
            <p className="data-pill inline-flex rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
              Secure Access
            </p>
            <h1 className="headline-display mt-6 text-5xl font-bold text-slate-900">
              Step Back Into
              <br />
              Your Signal Space
            </h1>
            <p className="subhead-display mt-5 max-w-md text-base leading-relaxed text-slate-700">
              Sign in to review your behavioral trends, financial rhythm, and health trajectory with
              one integrated dashboard.
            </p>
          </section>

          <div className="stagger-rise" style={{ animationDelay: '160ms' }}>
            <TiltCard className="glass-panel rounded-3xl p-7 sm:p-8">
              <div className="relative z-10">
                <h2 className="headline-display text-3xl font-semibold text-slate-900">Welcome back</h2>
                <p className="mt-2 text-sm text-slate-600">Log in to continue tracking your momentum.</p>

                <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                  {error ? (
                    <div className="rounded-xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  ) : null}

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
                        placeholder="Your password"
                        className="h-11 rounded-xl border-slate-300/60 bg-white/70 pl-10"
                      />
                    </div>
                  </label>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                    {!isLoading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
                  </Button>
                </form>

                <p className="mt-5 text-center text-sm text-slate-600">
                  New here?{' '}
                  <Link href="/auth/register" className="font-semibold text-slate-900 underline-offset-4 hover:underline">
                    Create account
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
