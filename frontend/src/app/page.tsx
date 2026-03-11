import Link from 'next/link'
import { ArrowRight, Activity, Brain, Wallet, Moon, Dumbbell, CheckSquare } from 'lucide-react'
import TiltCard from '@/components/TiltCard'

const modules = [
  {
    icon: Moon,
    title: 'Sleep Intelligence',
    value: '8h Focus Window',
    description: 'Map your sleep quality and wake patterns with contextual trends.'
  },
  {
    icon: Dumbbell,
    title: 'Training Pulse',
    value: 'Weekly Momentum',
    description: 'Measure consistency and intensity to build durable performance habits.'
  },
  {
    icon: CheckSquare,
    title: 'Habit Engine',
    value: 'Execution Score',
    description: 'Track habit completion as a measurable operating system for your day.'
  },
  {
    icon: Brain,
    title: 'Mood Mapping',
    value: 'Emotional Signal',
    description: 'Correlate mood shifts with behavior and recovery in one timeline.'
  },
  {
    icon: Wallet,
    title: 'Spending Radar',
    value: 'Daily Burn Rate',
    description: 'Watch where money leaks and where your budget strategy is winning.'
  },
  {
    icon: Activity,
    title: 'Insight Layer',
    value: 'Actionable Patterns',
    description: 'Convert raw logs into clear recommendations and momentum cues.'
  }
]

export default function HomePage() {
  return (
    <div className="scene-shell min-h-screen">
      <div className="scene-aurora" />
      <div className="scene-grid" />
      <div className="orb orb--one" />
      <div className="orb orb--two" />
      <div className="orb orb--three" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-14 pt-8 md:px-10 md:pt-12">
        <header className="stagger-rise flex items-center justify-between" style={{ animationDelay: '40ms' }}>
          <div className="glass-panel rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
            Life Dashboard
          </div>
          <Link
            href="/auth/login"
            className="data-pill rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:text-slate-900"
          >
            Sign In
          </Link>
        </header>

        <section className="mt-16 flex flex-1 flex-col justify-center">
          <div className="mx-auto max-w-4xl text-center">
            <p
              className="data-pill stagger-rise mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-700"
              style={{ animationDelay: '120ms' }}
            >
              Personal Performance Cockpit
            </p>
            <h1
              className="headline-display stagger-rise text-4xl font-bold text-slate-900 sm:text-5xl md:text-6xl"
              style={{ animationDelay: '180ms' }}
            >
              Turn Your Daily Life
              <br />
              Into a 3D Signal Map
            </h1>
            <p
              className="subhead-display stagger-rise mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-700 md:text-lg"
              style={{ animationDelay: '240ms' }}
            >
              A modern analytics workspace for sleep, habits, mood, workouts, and spending. Capture logs,
              visualize momentum, and act on patterns before they become problems.
            </p>

            <div
              className="stagger-rise mt-10 flex flex-wrap items-center justify-center gap-4"
              style={{ animationDelay: '300ms' }}
            >
              <Link
                href="/dashboard"
                className="glass-panel inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-1"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/register"
                className="data-pill inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-1 hover:text-slate-900"
              >
                Create Account
              </Link>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, index) => {
              const Icon = module.icon
              return (
                <div key={module.title} className="stagger-rise" style={{ animationDelay: `${340 + index * 70}ms` }}>
                  <TiltCard className="glass-panel h-full rounded-3xl p-6">
                    <div className="relative z-10">
                      <div className="mb-5 inline-flex rounded-2xl bg-slate-900/90 p-2.5 text-cyan-200">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="headline-display text-xl font-semibold text-slate-900">{module.title}</h2>
                      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.15em] text-slate-500">
                        {module.value}
                      </p>
                      <p className="mt-4 text-sm leading-relaxed text-slate-700">{module.description}</p>
                    </div>
                  </TiltCard>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
