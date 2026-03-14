import { AnalyticsSettings, Expense, MoodLog, Prisma, SleepLog, WorkoutLog } from '@prisma/client'
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfDay,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfDay,
  startOfWeek,
  subDays,
  subWeeks
} from 'date-fns'
import prisma from '../utils/prisma'
import predictionService from './prediction.service'

type TimelineRange = 'day' | 'week'
type CorrelationImpact = 'positive' | 'negative' | 'neutral'
type InsightConfidence = 'low' | 'medium' | 'high'
type MissionStatus = 'completed' | 'on-track' | 'at-risk' | 'behind'
type MissionDirection = 'at-least' | 'at-most'
type NudgePriority = 'low' | 'medium' | 'high'
type TimelineEventType = 'sleep' | 'workout' | 'habit' | 'mood' | 'expense'

interface GoalTargets {
  sleepHours: number
  workoutSessions: number
  workoutMinutes: number
  weeklySpending: number
  habitCompletion: number
  mood: number
}

interface DailyAggregate {
  date: Date
  dateKey: string
  sleepHours: number | null
  sleepQuality: number | null
  workoutMinutes: number
  mood: number | null
  spending: number
  completedHabits: number
  totalHabits: number
  hasActivity: boolean
}

interface LifeScoreComponent {
  key: 'sleep' | 'workout' | 'habit' | 'mood' | 'spending'
  label: string
  score: number
  value: number | null
  target: number
  unit: string
  weight: number
}

interface LifeScoreSummary {
  date: string
  score: number
  grade: string
  components: LifeScoreComponent[]
}

interface CorrelationInsight {
  id: string
  title: string
  summary: string
  impact: CorrelationImpact
  confidence: InsightConfidence
  metrics: {
    moodDelta?: number
    spendingDeltaPercent?: number
    lifeScoreDelta?: number
  }
}

interface MissionProgress {
  id: string
  title: string
  description: string
  direction: MissionDirection
  current: number
  target: number
  unit: string
  progressPercent: number
  status: MissionStatus
  rewardXp: number
}

interface GoalPlannerSummary {
  weekStart: string
  weekEnd: string
  targets: GoalTargets
  missions: MissionProgress[]
  streakRewards: {
    streakWeeks: number
    xpBonus: number
    shieldBonus: number
  }
}

interface BadgeSummary {
  id: string
  name: string
  description: string
  earned: boolean
}

interface GamificationSummary {
  totalXp: number
  level: number
  nextLevelXp: number
  levelProgressPercent: number
  streakDays: number
  streakShields: number
  badges: BadgeSummary[]
}

interface SmartNudge {
  id: string
  title: string
  message: string
  priority: NudgePriority
  recommendedWindow: string
  triggerReason: string
}

interface ForecastSummary {
  readinessScore: number
  confidence: InsightConfidence
  trendDelta: number
  narrative: string
  strengths: string[]
  risks: string[]
  actions: string[]
  provider: 'rules' | 'gemini'
  model: string | null
  scoreHistory: Array<{
    date: string
    score: number
  }>
}

interface AnalyticsSettingsSummary extends GoalTargets {
  predictionProvider: 'rules' | 'gemini'
  predictionModel: string | null
}

interface TimelineEvent {
  id: string
  timestamp: string
  date: string
  type: TimelineEventType
  title: string
  description: string
  scoreImpact: number
}

interface TimelineDaySummary {
  date: string
  label: string
  lifeScore: number
  eventCount: number
}

interface TimelineReplay {
  range: TimelineRange
  periodStart: string
  periodEnd: string
  selectedDate: string
  daySummaries: TimelineDaySummary[]
  events: TimelineEvent[]
}

interface DashboardPerformance {
  generatedAt: string
  lifeScore: LifeScoreSummary
  correlations: CorrelationInsight[]
  goals: GoalPlannerSummary
  gamification: GamificationSummary
  nudges: SmartNudge[]
  forecast: ForecastSummary
}

type HabitLogWithHabit = Prisma.HabitLogGetPayload<{
  include: { habit: { select: { name: true } } }
}>

interface AggregateBundle {
  aggregates: DailyAggregate[]
  habitCount: number
  raw: {
    sleepLogs: SleepLog[]
    workoutLogs: WorkoutLog[]
    moodLogs: MoodLog[]
    expenses: Expense[]
    habitLogs: HabitLogWithHabit[]
  }
}

interface WeekMetrics {
  avgSleep: number | null
  workoutSessions: number
  spending: number
  habitCompletion: number
  avgMood: number | null
  completedHabitLogs: number
}

const WEEK_STARTS_ON = 1 as const

const DEFAULT_WEEKLY_TARGETS: GoalTargets = {
  sleepHours: 7,
  workoutSessions: 4,
  workoutMinutes: 45,
  weeklySpending: 250,
  habitCompletion: 80,
  mood: 4
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

const toDateKey = (date: Date): string => date.toISOString().slice(0, 10)

const average = (values: number[]): number | null => {
  if (values.length === 0) {
    return null
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

const round1 = (value: number): number => Math.round(value * 10) / 10

const formatTargetLabel = (value: number): string => {
  if (Number.isInteger(value)) {
    return String(value)
  }

  return String(round1(value))
}

export class DashboardService {
  private mapSettingsToTargets(settings: AnalyticsSettings | null | undefined): GoalTargets {
    return {
      sleepHours: settings?.sleepHours ?? DEFAULT_WEEKLY_TARGETS.sleepHours,
      workoutSessions: settings?.workoutSessions ?? DEFAULT_WEEKLY_TARGETS.workoutSessions,
      workoutMinutes: settings?.workoutMinutes ?? DEFAULT_WEEKLY_TARGETS.workoutMinutes,
      weeklySpending: settings?.weeklySpending ?? DEFAULT_WEEKLY_TARGETS.weeklySpending,
      habitCompletion: settings?.habitCompletion ?? DEFAULT_WEEKLY_TARGETS.habitCompletion,
      mood: settings?.mood ?? DEFAULT_WEEKLY_TARGETS.mood
    }
  }

  private async getOrCreateSettingsRecord(userId: string): Promise<AnalyticsSettings> {
    return prisma.analyticsSettings.upsert({
      where: { userId },
      create: {
        userId,
        predictionModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash'
      },
      update: {}
    })
  }

  async getSettings(userId: string): Promise<AnalyticsSettingsSummary> {
    const settings = await this.getOrCreateSettingsRecord(userId)
    const targets = this.mapSettingsToTargets(settings)

    return {
      ...targets,
      predictionProvider: process.env.GEMINI_API_KEY ? 'gemini' : 'rules',
      predictionModel: settings.predictionModel ?? process.env.GEMINI_MODEL ?? null
    }
  }

  async updateSettings(userId: string, input: GoalTargets): Promise<AnalyticsSettingsSummary> {
    const settings = await prisma.analyticsSettings.upsert({
      where: { userId },
      update: {
        sleepHours: input.sleepHours,
        workoutSessions: input.workoutSessions,
        workoutMinutes: input.workoutMinutes,
        weeklySpending: input.weeklySpending,
        habitCompletion: input.habitCompletion,
        mood: input.mood,
        predictionModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash'
      },
      create: {
        userId,
        sleepHours: input.sleepHours,
        workoutSessions: input.workoutSessions,
        workoutMinutes: input.workoutMinutes,
        weeklySpending: input.weeklySpending,
        habitCompletion: input.habitCompletion,
        mood: input.mood,
        predictionModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash'
      }
    })

    return {
      ...this.mapSettingsToTargets(settings),
      predictionProvider: process.env.GEMINI_API_KEY ? 'gemini' : 'rules',
      predictionModel: settings.predictionModel ?? process.env.GEMINI_MODEL ?? null
    }
  }

  private createEmptyAggregate(date: Date, habitCount: number): DailyAggregate {
    return {
      date,
      dateKey: toDateKey(date),
      sleepHours: null,
      sleepQuality: null,
      workoutMinutes: 0,
      mood: null,
      spending: 0,
      completedHabits: 0,
      totalHabits: habitCount,
      hasActivity: false
    }
  }

  private async buildDailyAggregates(userId: string, startDate: Date, endDate: Date): Promise<AggregateBundle> {
    const rangeStart = startOfDay(startDate)
    const rangeEnd = endOfDay(endDate)

    const [sleepLogs, workoutLogs, moodLogs, expenses, habitLogs, habitCount] = await Promise.all([
      prisma.sleepLog.findMany({
        where: {
          userId,
          date: { gte: rangeStart, lte: rangeEnd }
        },
        orderBy: { date: 'asc' }
      }),
      prisma.workoutLog.findMany({
        where: {
          userId,
          date: { gte: rangeStart, lte: rangeEnd }
        },
        orderBy: { date: 'asc' }
      }),
      prisma.moodLog.findMany({
        where: {
          userId,
          date: { gte: rangeStart, lte: rangeEnd }
        },
        orderBy: { date: 'asc' }
      }),
      prisma.expense.findMany({
        where: {
          userId,
          date: { gte: rangeStart, lte: rangeEnd }
        },
        orderBy: { date: 'asc' }
      }),
      prisma.habitLog.findMany({
        where: {
          date: { gte: rangeStart, lte: rangeEnd },
          habit: { userId }
        },
        include: {
          habit: {
            select: {
              name: true
            }
          }
        },
        orderBy: { date: 'asc' }
      }),
      prisma.habit.count({ where: { userId } })
    ])

    const dayMap = new Map<string, DailyAggregate>()
    for (const day of eachDayOfInterval({ start: rangeStart, end: rangeEnd })) {
      const aggregate = this.createEmptyAggregate(day, habitCount)
      dayMap.set(aggregate.dateKey, aggregate)
    }

    for (const sleepLog of sleepLogs) {
      const key = toDateKey(sleepLog.date)
      const aggregate = dayMap.get(key)
      if (!aggregate) {
        continue
      }

      let durationHours =
        (new Date(sleepLog.wakeTime).getTime() - new Date(sleepLog.sleepTime).getTime()) / (1000 * 60 * 60)

      if (durationHours < 0) {
        durationHours += 24
      }

      durationHours = clamp(durationHours, 0, 24)

      aggregate.sleepHours = round1(durationHours)
      aggregate.sleepQuality = sleepLog.quality
      aggregate.hasActivity = true
    }

    for (const workoutLog of workoutLogs) {
      const key = toDateKey(workoutLog.date)
      const aggregate = dayMap.get(key)
      if (!aggregate) {
        continue
      }

      aggregate.workoutMinutes += workoutLog.duration
      aggregate.hasActivity = true
    }

    for (const moodLog of moodLogs) {
      const key = toDateKey(moodLog.date)
      const aggregate = dayMap.get(key)
      if (!aggregate) {
        continue
      }

      aggregate.mood = moodLog.mood
      aggregate.hasActivity = true
    }

    for (const expense of expenses) {
      const key = toDateKey(expense.date)
      const aggregate = dayMap.get(key)
      if (!aggregate) {
        continue
      }

      aggregate.spending += expense.amount
      aggregate.hasActivity = true
    }

    for (const habitLog of habitLogs) {
      const key = toDateKey(habitLog.date)
      const aggregate = dayMap.get(key)
      if (!aggregate) {
        continue
      }

      if (habitLog.completed) {
        aggregate.completedHabits += 1
      }
      aggregate.hasActivity = true
    }

    return {
      aggregates: Array.from(dayMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime()),
      habitCount,
      raw: {
        sleepLogs,
        workoutLogs,
        moodLogs,
        expenses,
        habitLogs
      }
    }
  }

  private calculateDailyLifeScore(aggregate: DailyAggregate, targets: GoalTargets): LifeScoreSummary {
    const sleepScore = aggregate.sleepHours === null
      ? 50
      : aggregate.sleepHours >= targets.sleepHours
      ? clamp(80 + (aggregate.sleepHours - targets.sleepHours) * 8, 80, 100)
      : clamp((aggregate.sleepHours / targets.sleepHours) * 80, 0, 80)

    const workoutScore = aggregate.workoutMinutes === 0
      ? 35
      : clamp((aggregate.workoutMinutes / targets.workoutMinutes) * 100, 35, 100)

    const habitCompletionPercent = aggregate.totalHabits > 0
      ? (aggregate.completedHabits / aggregate.totalHabits) * 100
      : 70
    const habitScore = clamp(habitCompletionPercent, 0, 100)

    const moodScore = aggregate.mood === null ? 50 : clamp((aggregate.mood / 5) * 100, 0, 100)

    const dailyBudget = targets.weeklySpending / 7
    const spendingRatio = dailyBudget > 0 ? aggregate.spending / dailyBudget : 1
    const spendingScore = spendingRatio <= 1
      ? clamp(100 - spendingRatio * 25, 75, 100)
      : clamp(75 - (spendingRatio - 1) * 75, 0, 75)

    const components: LifeScoreComponent[] = [
      {
        key: 'sleep',
        label: 'Sleep',
        score: Math.round(sleepScore),
        value: aggregate.sleepHours,
        target: targets.sleepHours,
        unit: 'hours',
        weight: 0.25
      },
      {
        key: 'workout',
        label: 'Workout',
        score: Math.round(workoutScore),
        value: aggregate.workoutMinutes,
        target: targets.workoutMinutes,
        unit: 'minutes',
        weight: 0.2
      },
      {
        key: 'habit',
        label: 'Habits',
        score: Math.round(habitScore),
        value: habitCompletionPercent,
        target: targets.habitCompletion,
        unit: '%',
        weight: 0.25
      },
      {
        key: 'mood',
        label: 'Mood',
        score: Math.round(moodScore),
        value: aggregate.mood,
        target: targets.mood,
        unit: '/5',
        weight: 0.2
      },
      {
        key: 'spending',
        label: 'Spending Discipline',
        score: Math.round(spendingScore),
        value: round1(aggregate.spending),
        target: round1(dailyBudget),
        unit: 'USD/day',
        weight: 0.1
      }
    ]

    const score = Math.round(
      components.reduce((sum, component) => sum + component.score * component.weight, 0)
    )

    const grade = score >= 90
      ? 'A+'
      : score >= 80
      ? 'A'
      : score >= 70
      ? 'B'
      : score >= 60
      ? 'C'
      : score >= 50
      ? 'D'
      : 'F'

    return {
      date: aggregate.dateKey,
      score,
      grade,
      components
    }
  }

  private calculateWeekMetrics(
    aggregates: DailyAggregate[],
    raw: AggregateBundle['raw'],
    habitCount: number,
    startDate: Date,
    endDate: Date,
    totalDays: number
  ): WeekMetrics {
    const sleepValues = aggregates
      .map((aggregate) => aggregate.sleepHours)
      .filter((value): value is number => value !== null)

    const moodValues = aggregates
      .map((aggregate) => aggregate.mood)
      .filter((value): value is number => value !== null)

    const spending = raw.expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const completedHabitLogs = raw.habitLogs.filter((log) => {
      const inRange = log.date >= startDate && log.date <= endDate
      return inRange && log.completed
    }).length

    const workoutSessions = raw.workoutLogs.filter((log) => log.date >= startDate && log.date <= endDate).length
    const possibleHabitLogs = habitCount > 0 ? habitCount * totalDays : 0
    const habitCompletion = possibleHabitLogs > 0 ? (completedHabitLogs / possibleHabitLogs) * 100 : 0

    return {
      avgSleep: average(sleepValues),
      workoutSessions,
      spending: round1(spending),
      habitCompletion: round1(habitCompletion),
      avgMood: average(moodValues),
      completedHabitLogs
    }
  }

  private getAtLeastStatus(current: number, target: number): MissionStatus {
    if (target <= 0) {
      return 'completed'
    }

    const ratio = current / target
    if (ratio >= 1) return 'completed'
    if (ratio >= 0.75) return 'on-track'
    if (ratio >= 0.5) return 'at-risk'
    return 'behind'
  }

  private getAtMostStatus(current: number, target: number, elapsedDays: number): MissionStatus {
    if (target <= 0) {
      return 'completed'
    }

    if (elapsedDays >= 7) {
      return current <= target ? 'completed' : 'behind'
    }

    const expectedSpend = target * (elapsedDays / 7)
    if (current <= expectedSpend) return 'on-track'
    if (current <= target) return 'at-risk'
    return 'behind'
  }

  private buildMission(
    id: string,
    title: string,
    description: string,
    direction: MissionDirection,
    current: number,
    target: number,
    unit: string,
    rewardXp: number,
    elapsedDays: number
  ): MissionProgress {
    const progressPercent = direction === 'at-least'
      ? clamp((current / Math.max(target, 1)) * 100, 0, 100)
      : clamp(((target - current) / Math.max(target, 1)) * 100, 0, 100)

    const status = direction === 'at-least'
      ? this.getAtLeastStatus(current, target)
      : this.getAtMostStatus(current, target, elapsedDays)

    return {
      id,
      title,
      description,
      direction,
      current: round1(current),
      target,
      unit,
      progressPercent: round1(progressPercent),
      status,
      rewardXp
    }
  }

  private getConfidenceBySampleSize(sampleSize: number): InsightConfidence {
    if (sampleSize >= 16) return 'high'
    if (sampleSize >= 8) return 'medium'
    return 'low'
  }

  private buildCorrelationInsights(
    aggregates: DailyAggregate[],
    targets: GoalTargets
  ): CorrelationInsight[] {
    const insights: CorrelationInsight[] = []

    const lowSleepThreshold = Math.max(5.5, round1(targets.sleepHours - 0.5))
    const activeWorkoutThreshold = Math.max(20, Math.round(targets.workoutMinutes * 0.67))

    const lowSleepDays = aggregates.filter((aggregate) => aggregate.sleepHours !== null && aggregate.sleepHours < lowSleepThreshold)
    const healthySleepDays = aggregates.filter((aggregate) => aggregate.sleepHours !== null && aggregate.sleepHours >= targets.sleepHours)

    if (lowSleepDays.length >= 2 && healthySleepDays.length >= 2) {
      const lowSleepMood = average(lowSleepDays
        .map((aggregate) => aggregate.mood)
        .filter((value): value is number => value !== null))
      const healthySleepMood = average(healthySleepDays
        .map((aggregate) => aggregate.mood)
        .filter((value): value is number => value !== null))

      const lowSleepSpend = average(lowSleepDays.map((aggregate) => aggregate.spending)) ?? 0
      const healthySleepSpend = average(healthySleepDays.map((aggregate) => aggregate.spending)) ?? 0

      if (lowSleepMood !== null && healthySleepMood !== null) {
        const moodDrop = round1(healthySleepMood - lowSleepMood)
        const spendingDeltaPercent = healthySleepSpend > 0
          ? round1(((lowSleepSpend - healthySleepSpend) / healthySleepSpend) * 100)
          : 0

        const impact: CorrelationImpact = moodDrop > 0 || spendingDeltaPercent > 0 ? 'negative' : 'neutral'
        const spendingText = spendingDeltaPercent >= 0
          ? `rises ${Math.abs(spendingDeltaPercent)}%`
          : `drops ${Math.abs(spendingDeltaPercent)}%`

        insights.push({
          id: 'sleep-mood-spending',
          title: 'Sleep vs Mood & Spending',
          summary: `On low-sleep days, mood drops ${Math.abs(moodDrop)} points and spending ${spendingText}.`,
          impact,
          confidence: this.getConfidenceBySampleSize(lowSleepDays.length + healthySleepDays.length),
          metrics: {
            moodDelta: moodDrop,
            spendingDeltaPercent
          }
        })
      }
    }

    const activeWorkoutDays = aggregates.filter((aggregate) => aggregate.workoutMinutes >= activeWorkoutThreshold && aggregate.mood !== null)
    const inactiveWorkoutDays = aggregates.filter((aggregate) => aggregate.workoutMinutes === 0 && aggregate.mood !== null)

    if (activeWorkoutDays.length >= 2 && inactiveWorkoutDays.length >= 2) {
      const activeMood = average(activeWorkoutDays.map((aggregate) => aggregate.mood as number)) ?? 0
      const inactiveMood = average(inactiveWorkoutDays.map((aggregate) => aggregate.mood as number)) ?? 0
      const moodLift = round1(activeMood - inactiveMood)

      const activeScore = average(activeWorkoutDays.map((aggregate) => this.calculateDailyLifeScore(aggregate, targets).score)) ?? 0
      const inactiveScore = average(inactiveWorkoutDays.map((aggregate) => this.calculateDailyLifeScore(aggregate, targets).score)) ?? 0
      const lifeScoreDelta = round1(activeScore - inactiveScore)

      insights.push({
        id: 'workout-readiness',
        title: 'Workout Impact',
        summary: `Days with ${activeWorkoutThreshold}+ minutes of training show mood lift of ${moodLift} and life score gain of ${lifeScoreDelta}.`,
        impact: moodLift >= 0 ? 'positive' : 'negative',
        confidence: this.getConfidenceBySampleSize(activeWorkoutDays.length + inactiveWorkoutDays.length),
        metrics: {
          moodDelta: moodLift,
          lifeScoreDelta
        }
      })
    }

    const highHabitDays = aggregates.filter((aggregate) => {
      if (aggregate.totalHabits === 0) return false
      return (aggregate.completedHabits / aggregate.totalHabits) * 100 >= 70
    })
    const lowHabitDays = aggregates.filter((aggregate) => {
      if (aggregate.totalHabits === 0) return false
      return (aggregate.completedHabits / aggregate.totalHabits) * 100 <= 40
    })

    if (highHabitDays.length >= 2 && lowHabitDays.length >= 2) {
      const highHabitSpend = average(highHabitDays.map((aggregate) => aggregate.spending)) ?? 0
      const lowHabitSpend = average(lowHabitDays.map((aggregate) => aggregate.spending)) ?? 0
      const spendingDeltaPercent = highHabitSpend > 0
        ? round1(((lowHabitSpend - highHabitSpend) / highHabitSpend) * 100)
        : 0

      insights.push({
        id: 'habit-spending-discipline',
        title: 'Habit Consistency Signal',
        summary: `When habit completion is low, spending is ${Math.abs(spendingDeltaPercent)}% ${spendingDeltaPercent >= 0 ? 'higher' : 'lower'}.`,
        impact: spendingDeltaPercent >= 0 ? 'negative' : 'positive',
        confidence: this.getConfidenceBySampleSize(highHabitDays.length + lowHabitDays.length),
        metrics: {
          spendingDeltaPercent
        }
      })
    }

    if (insights.length === 0) {
      insights.push({
        id: 'insufficient-data',
        title: 'Correlation Engine Warming Up',
        summary: 'Log at least 7-10 days across sleep, workouts, mood, habits, and spending to unlock deeper correlations.',
        impact: 'neutral',
        confidence: 'low',
        metrics: {}
      })
    }

    return insights
  }

  private calculateConsistencyStreak(aggregates: DailyAggregate[]): number {
    let streak = 0
    for (let index = aggregates.length - 1; index >= 0; index -= 1) {
      if (!aggregates[index].hasActivity) {
        break
      }
      streak += 1
    }
    return streak
  }

  private calculateWeeklyMissionStreak(
    aggregates: DailyAggregate[],
    raw: AggregateBundle['raw'],
    habitCount: number,
    targets: GoalTargets,
    currentWeekStart: Date
  ): number {
    let streakWeeks = 0

    for (let offset = 1; offset <= 8; offset += 1) {
      const weekStart = startOfWeek(subWeeks(currentWeekStart, offset), { weekStartsOn: WEEK_STARTS_ON })
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: WEEK_STARTS_ON })

      const weekAggregates = aggregates.filter((aggregate) => aggregate.date >= weekStart && aggregate.date <= weekEnd)
      if (weekAggregates.length < 7) {
        break
      }

      const weekRaw = {
        workoutLogs: raw.workoutLogs.filter((log) => log.date >= weekStart && log.date <= weekEnd),
        expenses: raw.expenses.filter((expense) => expense.date >= weekStart && expense.date <= weekEnd),
        habitLogs: raw.habitLogs.filter((log) => log.date >= weekStart && log.date <= weekEnd)
      }

      const sleepValues = weekAggregates
        .map((aggregate) => aggregate.sleepHours)
        .filter((value): value is number => value !== null)
      const avgSleep = average(sleepValues)

      const completedHabitLogs = weekRaw.habitLogs.filter((log) => log.completed).length
      const possibleHabitLogs = habitCount > 0 ? habitCount * 7 : 0
      const habitCompletion = possibleHabitLogs > 0 ? (completedHabitLogs / possibleHabitLogs) * 100 : 0

      const weekPasses =
        (avgSleep ?? 0) >= targets.sleepHours &&
        weekRaw.workoutLogs.length >= targets.workoutSessions &&
        weekRaw.expenses.reduce((sum, expense) => sum + expense.amount, 0) <= targets.weeklySpending &&
        habitCompletion >= targets.habitCompletion

      if (!weekPasses) {
        break
      }

      streakWeeks += 1
    }

    return streakWeeks
  }

  private buildSmartNudges(
    weekMetrics: WeekMetrics,
    targets: GoalTargets,
    elapsedDays: number,
    todayAggregate: DailyAggregate,
    hasYesterdaySleep: boolean
  ): SmartNudge[] {
    const nudges: SmartNudge[] = []
    const remainingDays = Math.max(0, 7 - elapsedDays)

    if (!hasYesterdaySleep) {
      nudges.push({
        id: 'log-last-night-sleep',
        title: 'Capture Last Night Sleep',
        message: 'Add yesterday sleep details now to keep life score and forecast accurate.',
        priority: 'high',
        recommendedWindow: '08:00 - 10:00',
        triggerReason: 'Missing sleep entry for previous day'
      })
    }

    if (weekMetrics.workoutSessions < targets.workoutSessions && remainingDays <= 3) {
      const needed = targets.workoutSessions - weekMetrics.workoutSessions
      nudges.push({
        id: 'workout-catch-up',
        title: 'Workout Catch-Up Window',
        message: `Plan ${needed} focused workout session${needed > 1 ? 's' : ''} in the remaining week to hit your target.`,
        priority: 'high',
        recommendedWindow: '18:00 - 20:00',
        triggerReason: 'Workout target at risk'
      })
    }

    if (weekMetrics.spending > targets.weeklySpending * 0.8) {
      nudges.push({
        id: 'spend-guard',
        title: 'Budget Guard Active',
        message: 'Spending is above 80% of weekly limit. Favor low-cost choices for the rest of this week.',
        priority: 'medium',
        recommendedWindow: 'Before lunch and dinner',
        triggerReason: 'Spending trend approaching weekly cap'
      })
    }

    if (weekMetrics.habitCompletion < targets.habitCompletion) {
      nudges.push({
        id: 'habit-reset',
        title: 'Habit Recovery Sprint',
        message: 'Stack one easy habit completion now to restore consistency momentum.',
        priority: 'medium',
        recommendedWindow: '20:30 - 21:30',
        triggerReason: 'Habit completion below weekly target'
      })
    }

    if ((weekMetrics.avgMood ?? todayAggregate.mood ?? 3) < 3.5) {
      nudges.push({
        id: 'mood-reset',
        title: 'Mood Stabilization Prompt',
        message: 'Take a 10-minute reset: hydration, short walk, and quick breathing cycle.',
        priority: 'medium',
        recommendedWindow: '15:00 - 17:00',
        triggerReason: 'Mood trend below target zone'
      })
    }

    if (nudges.length === 0) {
      nudges.push({
        id: 'maintain-momentum',
        title: 'Momentum Maintained',
        message: 'Current trends are strong. Keep routine timing consistent to protect score gains.',
        priority: 'low',
        recommendedWindow: 'Maintain current schedule',
        triggerReason: 'All core signals stable'
      })
    }

    return nudges.slice(0, 5)
  }

  private buildRuleBasedForecast(
    aggregates: DailyAggregate[],
    targets: GoalTargets
  ): ForecastSummary {
    const scoreHistory = aggregates.map((aggregate) => {
      const score = this.calculateDailyLifeScore(aggregate, targets).score
      return {
        date: aggregate.dateKey,
        score
      }
    })

    const scores = scoreHistory.map((item) => item.score)
    const recentWindow = scores.slice(-3)
    const baselineWindow = scores.slice(0, Math.max(1, scores.length - 3))
    const recentAverage = average(recentWindow) ?? 50
    const baselineAverage = average(baselineWindow) ?? recentAverage
    const trendDelta = round1(recentAverage - baselineAverage)

    const readinessScore = Math.round(clamp(recentAverage + trendDelta * 0.45, 0, 100))

    const activeDays = aggregates.filter((aggregate) => aggregate.hasActivity).length
    const confidence: InsightConfidence = activeDays >= 6 ? 'high' : activeDays >= 4 ? 'medium' : 'low'

    const componentAverages = {
      sleep: average(
        aggregates
          .map((aggregate) => this.calculateDailyLifeScore(aggregate, targets).components.find((component) => component.key === 'sleep')?.score ?? 0)
      ) ?? 0,
      workout: average(
        aggregates
          .map((aggregate) => this.calculateDailyLifeScore(aggregate, targets).components.find((component) => component.key === 'workout')?.score ?? 0)
      ) ?? 0,
      habit: average(
        aggregates
          .map((aggregate) => this.calculateDailyLifeScore(aggregate, targets).components.find((component) => component.key === 'habit')?.score ?? 0)
      ) ?? 0,
      mood: average(
        aggregates
          .map((aggregate) => this.calculateDailyLifeScore(aggregate, targets).components.find((component) => component.key === 'mood')?.score ?? 0)
      ) ?? 0,
      spending: average(
        aggregates
          .map((aggregate) => this.calculateDailyLifeScore(aggregate, targets).components.find((component) => component.key === 'spending')?.score ?? 0)
      ) ?? 0
    }

    const strengths = Object.entries(componentAverages)
      .filter(([, score]) => score >= 70)
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => `${key.charAt(0).toUpperCase()}${key.slice(1)} consistency strong`)
      .slice(0, 3)

    const risks = Object.entries(componentAverages)
      .filter(([, score]) => score < 50)
      .sort((a, b) => a[1] - b[1])
      .map(([key]) => `${key.charAt(0).toUpperCase()}${key.slice(1)} is dragging readiness`)
      .slice(0, 3)

    const actions = Object.entries(componentAverages)
      .filter(([, score]) => score < 60)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([key]) => {
        switch (key) {
          case 'sleep':
            return 'Protect a consistent sleep window tonight to recover readiness.'
          case 'workout':
            return 'Add a short workout or brisk walk to lift tomorrow readiness.'
          case 'habit':
            return 'Complete one easy habit before the day ends to restore momentum.'
          case 'mood':
            return 'Schedule a low-friction reset block to stabilize mood.'
          case 'spending':
            return 'Keep spending light for the rest of the day to reduce friction.'
          default:
            return 'Repeat the routines behind your recent best days.'
        }
      })

    const narrative = readinessScore >= 80
      ? 'Tomorrow readiness is strong. Keep the same sleep and workout rhythm.'
      : readinessScore >= 65
      ? 'Tomorrow readiness is stable. One focused habit + sleep quality can push it higher.'
      : 'Tomorrow readiness is at risk. Prioritize recovery, low spending stress, and one completed mission tonight.'

    return {
      readinessScore,
      confidence,
      trendDelta,
      narrative,
      strengths,
      risks,
      actions: actions.length > 0 ? actions : ['Repeat the routines behind your recent best days.'],
      provider: 'rules',
      model: null,
      scoreHistory
    }
  }

  private async buildForecast(
    aggregates: DailyAggregate[],
    targets: GoalTargets,
    options: {
      correlations: CorrelationInsight[]
      streakDays: number
    }
  ): Promise<ForecastSummary> {
    const baseForecast = this.buildRuleBasedForecast(aggregates, targets)

    const recentSummary = {
      avgSleep: average(
        aggregates
          .map((aggregate) => aggregate.sleepHours)
          .filter((value): value is number => value !== null)
      ),
      avgMood: average(
        aggregates
          .map((aggregate) => aggregate.mood)
          .filter((value): value is number => value !== null)
      ),
      avgSpending: round1(average(aggregates.map((aggregate) => aggregate.spending)) ?? 0),
      avgWorkoutMinutes: round1(average(aggregates.map((aggregate) => aggregate.workoutMinutes)) ?? 0),
      avgHabitCompletion: round1(
        average(
          aggregates.map((aggregate) => {
            if (aggregate.totalHabits === 0) {
              return 0
            }

            return (aggregate.completedHabits / aggregate.totalHabits) * 100
          })
        ) ?? 0
      ),
      activeDays: aggregates.filter((aggregate) => aggregate.hasActivity).length
    }

    const enhancedForecast = await predictionService.generateForecast({
      targets,
      baseForecast,
      recentSummary,
      correlations: options.correlations.map((correlation) => ({
        title: correlation.title,
        summary: correlation.summary,
        impact: correlation.impact
      })),
      streakDays: options.streakDays
    })

    if (!enhancedForecast) {
      return baseForecast
    }

    return {
      ...baseForecast,
      readinessScore: enhancedForecast.readinessScore,
      confidence: enhancedForecast.confidence,
      narrative: enhancedForecast.narrative,
      strengths: enhancedForecast.strengths,
      risks: enhancedForecast.risks,
      actions: enhancedForecast.actions,
      provider: 'gemini',
      model: enhancedForecast.model
    }
  }

  private buildTimelineEvents(
    raw: AggregateBundle['raw'],
    targets: GoalTargets
  ): TimelineEvent[] {
    const events: TimelineEvent[] = []

    for (const sleepLog of raw.sleepLogs) {
      let sleepHours = (sleepLog.wakeTime.getTime() - sleepLog.sleepTime.getTime()) / (1000 * 60 * 60)
      if (sleepHours < 0) {
        sleepHours += 24
      }
      sleepHours = clamp(sleepHours, 0, 24)
      const scoreImpact = Math.round((sleepLog.quality - 3) * 8 + (sleepHours - targets.sleepHours) * 3)

      events.push({
        id: `sleep-${sleepLog.id}`,
        timestamp: sleepLog.wakeTime.toISOString(),
        date: toDateKey(sleepLog.date),
        type: 'sleep',
        title: 'Sleep Logged',
        description: `${round1(sleepHours)}h sleep, quality ${sleepLog.quality}/5`,
        scoreImpact
      })
    }

    for (const workoutLog of raw.workoutLogs) {
      const timestamp = startOfDay(workoutLog.date)
      timestamp.setHours(12, 0, 0, 0)
      const scoreImpact = Math.round(clamp(workoutLog.duration / 6, 2, 16))

      events.push({
        id: `workout-${workoutLog.id}`,
        timestamp: timestamp.toISOString(),
        date: toDateKey(workoutLog.date),
        type: 'workout',
        title: `${workoutLog.type} Workout`,
        description: `${workoutLog.duration} min${workoutLog.calories ? ` • ${workoutLog.calories} kcal` : ''}`,
        scoreImpact
      })
    }

    for (const habitLog of raw.habitLogs) {
      const timestamp = startOfDay(habitLog.date)
      timestamp.setHours(19, 0, 0, 0)

      events.push({
        id: `habit-${habitLog.id}`,
        timestamp: timestamp.toISOString(),
        date: toDateKey(habitLog.date),
        type: 'habit',
        title: habitLog.completed ? `Habit Complete: ${habitLog.habit.name}` : `Habit Missed: ${habitLog.habit.name}`,
        description: habitLog.completed ? 'Consistency credit earned' : 'Consistency shield used',
        scoreImpact: habitLog.completed ? 8 : -6
      })
    }

    for (const moodLog of raw.moodLogs) {
      const timestamp = startOfDay(moodLog.date)
      timestamp.setHours(21, 0, 0, 0)
      const scoreImpact = Math.round((moodLog.mood - 3) * 7)

      events.push({
        id: `mood-${moodLog.id}`,
        timestamp: timestamp.toISOString(),
        date: toDateKey(moodLog.date),
        type: 'mood',
        title: 'Mood Check-in',
        description: `Mood ${moodLog.mood}/5${moodLog.notes ? ` • ${moodLog.notes}` : ''}`,
        scoreImpact
      })
    }

    for (const expense of raw.expenses) {
      const timestamp = startOfDay(expense.date)
      timestamp.setHours(14, 0, 0, 0)
      const dailyBudget = targets.weeklySpending / 7
      const scoreImpact = expense.amount <= dailyBudget
        ? 2
        : -Math.round(clamp((expense.amount / dailyBudget) * 4, 3, 16))

      events.push({
        id: `expense-${expense.id}`,
        timestamp: timestamp.toISOString(),
        date: toDateKey(expense.date),
        type: 'expense',
        title: `Expense: ${expense.category}`,
        description: `$${round1(expense.amount)}${expense.description ? ` • ${expense.description}` : ''}`,
        scoreImpact
      })
    }

    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  async getDashboardStats(userId: string) {
    const today = startOfDay(new Date())
    const weekStart = startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON })
    const weekEnd = endOfWeek(today, { weekStartsOn: WEEK_STARTS_ON })
    const settings = await this.getOrCreateSettingsRecord(userId)
    const targets = this.mapSettingsToTargets(settings)

    const bundle = await this.buildDailyAggregates(userId, weekStart, weekEnd)
    const todayKey = toDateKey(today)
    const todayAggregate =
      bundle.aggregates.find((aggregate) => aggregate.dateKey === todayKey) ?? this.createEmptyAggregate(today, bundle.habitCount)

    const weekMetrics = this.calculateWeekMetrics(
      bundle.aggregates,
      bundle.raw,
      bundle.habitCount,
      weekStart,
      weekEnd,
      7
    )

    const productivityScore = Math.round(
      (weekMetrics.habitCompletion + clamp((weekMetrics.workoutSessions / 7) * 100, 0, 100)) / 2
    )

    return {
      todaySleep: todayAggregate.sleepHours,
      weeklyWorkouts: weekMetrics.workoutSessions,
      habitCompletion: Math.round(weekMetrics.habitCompletion),
      todayMood: todayAggregate.mood,
      avgWeeklyMood: weekMetrics.avgMood ? round1(weekMetrics.avgMood) : null,
      todaySpending: round1(todayAggregate.spending),
      weeklyProductivity: productivityScore
    }
  }

  async getInsights(userId: string) {
    const performance = await this.getPerformance(userId)
    return performance.correlations.map((insight) => insight.summary)
  }

  async getPerformance(userId: string): Promise<DashboardPerformance> {
    const today = startOfDay(new Date())
    const todayKey = toDateKey(today)
    const weekStart = startOfWeek(today, { weekStartsOn: WEEK_STARTS_ON })
    const weekEnd = endOfWeek(today, { weekStartsOn: WEEK_STARTS_ON })
    const settings = await this.getOrCreateSettingsRecord(userId)
    const targets = this.mapSettingsToTargets(settings)

    const rangeStart = startOfDay(subDays(today, 60))
    const bundle = await this.buildDailyAggregates(userId, rangeStart, weekEnd)

    const last30Start = startOfDay(subDays(today, 29))
    const last7Start = startOfDay(subDays(today, 6))

    const weekAggregates = bundle.aggregates.filter((aggregate) => aggregate.date >= weekStart && aggregate.date <= weekEnd)
    const last30Aggregates = bundle.aggregates.filter((aggregate) => aggregate.date >= last30Start && aggregate.date <= today)
    const last7Aggregates = bundle.aggregates.filter((aggregate) => aggregate.date >= last7Start && aggregate.date <= today)

    const todayAggregate =
      bundle.aggregates.find((aggregate) => aggregate.dateKey === todayKey) ?? this.createEmptyAggregate(today, bundle.habitCount)

    const lifeScore = this.calculateDailyLifeScore(todayAggregate, targets)
    const correlations = this.buildCorrelationInsights(last30Aggregates, targets)

    const elapsedDays = Math.min(7, differenceInCalendarDays(today, weekStart) + 1)

    const weekMetrics = this.calculateWeekMetrics(
      weekAggregates,
      bundle.raw,
      bundle.habitCount,
      weekStart,
      weekEnd,
      elapsedDays
    )

    const missions: MissionProgress[] = [
      this.buildMission(
        'sleep-target',
        `Sleep ${formatTargetLabel(targets.sleepHours)}h+ Average`,
        'Maintain your sleep recovery target all week.',
        'at-least',
        weekMetrics.avgSleep ?? 0,
        targets.sleepHours,
        'hrs avg',
        120,
        elapsedDays
      ),
      this.buildMission(
        'workout-target',
        `${formatTargetLabel(targets.workoutSessions)} Workouts / Week`,
        'Hit minimum training frequency this week.',
        'at-least',
        weekMetrics.workoutSessions,
        targets.workoutSessions,
        'sessions',
        140,
        elapsedDays
      ),
      this.buildMission(
        'spending-target',
        'Spend Under Weekly Cap',
        'Stay below your defined weekly spending budget.',
        'at-most',
        weekMetrics.spending,
        targets.weeklySpending,
        'USD',
        100,
        elapsedDays
      ),
      this.buildMission(
        'habit-target',
        `Habit Completion ${formatTargetLabel(targets.habitCompletion)}%+`,
        'Keep completion consistency across active habits.',
        'at-least',
        weekMetrics.habitCompletion,
        targets.habitCompletion,
        '%',
        130,
        elapsedDays
      ),
      this.buildMission(
        'mood-target',
        `Average Mood ${formatTargetLabel(targets.mood)}+`,
        'Protect emotional baseline with active recovery.',
        'at-least',
        weekMetrics.avgMood ?? 0,
        targets.mood,
        '/5',
        110,
        elapsedDays
      )
    ]

    const weeklyStreak = this.calculateWeeklyMissionStreak(
      bundle.aggregates,
      bundle.raw,
      bundle.habitCount,
      targets,
      weekStart
    )

    const streakRewards = {
      streakWeeks: weeklyStreak,
      xpBonus: weeklyStreak * 50,
      shieldBonus: Math.floor(weeklyStreak / 2)
    }

    const goals: GoalPlannerSummary = {
      weekStart: toDateKey(weekStart),
      weekEnd: toDateKey(weekEnd),
      targets,
      missions,
      streakRewards
    }

    const streakDays = this.calculateConsistencyStreak(last30Aggregates)

    const [sleepCount, workoutCount, completedHabitCount, moodCount, expenseCount] = await Promise.all([
      prisma.sleepLog.count({ where: { userId } }),
      prisma.workoutLog.count({ where: { userId } }),
      prisma.habitLog.count({
        where: {
          completed: true,
          habit: { userId }
        }
      }),
      prisma.moodLog.count({ where: { userId } }),
      prisma.expense.count({ where: { userId } })
    ])

    const missionXp = missions.reduce((sum, mission) => {
      if (mission.status === 'completed') {
        return sum + mission.rewardXp
      }
      if (mission.status === 'on-track') {
        return sum + Math.round(mission.rewardXp * 0.5)
      }
      return sum
    }, 0)

    const totalXp =
      sleepCount * 15 +
      workoutCount * 20 +
      completedHabitCount * 10 +
      moodCount * 8 +
      expenseCount * 5 +
      missionXp +
      streakDays * 5 +
      streakRewards.xpBonus

    const level = Math.floor(Math.sqrt(totalXp / 120)) + 1
    const currentLevelFloor = 120 * Math.pow(level - 1, 2)
    const nextLevelXp = 120 * Math.pow(level, 2)
    const levelProgressPercent = Math.round(
      clamp(((totalXp - currentLevelFloor) / Math.max(nextLevelXp - currentLevelFloor, 1)) * 100, 0, 100)
    )

    const badges: BadgeSummary[] = [
      {
        id: 'sleep-sentinel',
        name: 'Sleep Sentinel',
        description: `Weekly average sleep reached ${formatTargetLabel(targets.sleepHours)}h+`,
        earned: (weekMetrics.avgSleep ?? 0) >= targets.sleepHours
      },
      {
        id: 'workout-warrior',
        name: 'Workout Warrior',
        description: `Completed ${formatTargetLabel(targets.workoutSessions)} workouts this week`,
        earned: weekMetrics.workoutSessions >= targets.workoutSessions
      },
      {
        id: 'habit-hero',
        name: 'Habit Hero',
        description: `Reached ${formatTargetLabel(targets.habitCompletion)}% habit completion this week`,
        earned: weekMetrics.habitCompletion >= targets.habitCompletion
      },
      {
        id: 'budget-keeper',
        name: 'Budget Keeper',
        description: 'Stayed under weekly spend target',
        earned: weekMetrics.spending <= targets.weeklySpending
      },
      {
        id: 'streak-shield',
        name: 'Streak Shield',
        description: 'Maintained 7+ day activity streak',
        earned: streakDays >= 7
      }
    ]

    const gamification: GamificationSummary = {
      totalXp,
      level,
      nextLevelXp,
      levelProgressPercent,
      streakDays,
      streakShields: Math.floor(streakDays / 7) + streakRewards.shieldBonus,
      badges
    }

    const yesterday = subDays(today, 1)
    const hasYesterdaySleep = bundle.raw.sleepLogs.some((log) => toDateKey(log.date) === toDateKey(yesterday))

    const nudges = this.buildSmartNudges(
      weekMetrics,
      targets,
      elapsedDays,
      todayAggregate,
      hasYesterdaySleep
    )

    const forecast = await this.buildForecast(last7Aggregates, targets, {
      correlations,
      streakDays
    })

    return {
      generatedAt: new Date().toISOString(),
      lifeScore,
      correlations,
      goals,
      gamification,
      nudges,
      forecast
    }
  }

  async getTimeline(userId: string, range: TimelineRange = 'week', dateInput?: string): Promise<TimelineReplay> {
    const parsedDate = dateInput ? parseISO(dateInput) : new Date()
    const referenceDate = isValid(parsedDate) ? parsedDate : new Date()
    const settings = await this.getOrCreateSettingsRecord(userId)
    const targets = this.mapSettingsToTargets(settings)

    const periodStart = range === 'day'
      ? startOfDay(referenceDate)
      : startOfWeek(referenceDate, { weekStartsOn: WEEK_STARTS_ON })
    const periodEnd = range === 'day'
      ? endOfDay(referenceDate)
      : endOfWeek(referenceDate, { weekStartsOn: WEEK_STARTS_ON })

    const bundle = await this.buildDailyAggregates(userId, periodStart, periodEnd)
  const events = this.buildTimelineEvents(bundle.raw, targets)

    const eventCountByDate = new Map<string, number>()
    for (const event of events) {
      const count = eventCountByDate.get(event.date) ?? 0
      eventCountByDate.set(event.date, count + 1)
    }

    const daySummaries: TimelineDaySummary[] = bundle.aggregates.map((aggregate) => {
      const lifeScore = this.calculateDailyLifeScore(aggregate, targets)
      return {
        date: aggregate.dateKey,
        label: format(aggregate.date, 'EEE dd'),
        lifeScore: lifeScore.score,
        eventCount: eventCountByDate.get(aggregate.dateKey) ?? 0
      }
    })

    const selectedDateKey = toDateKey(referenceDate)
    const selectedDate = daySummaries.some((day) => day.date === selectedDateKey)
      ? selectedDateKey
      : daySummaries[daySummaries.length - 1]?.date ?? selectedDateKey

    return {
      range,
      periodStart: toDateKey(periodStart),
      periodEnd: toDateKey(periodEnd),
      selectedDate,
      daySummaries,
      events
    }
  }
}

export default new DashboardService()
