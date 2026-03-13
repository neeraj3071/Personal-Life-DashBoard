export interface User {
  id: string
  email: string
  name: string
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Habit {
  id: string
  userId: string
  name: string
  description?: string
  createdAt: string
}

export interface HabitLog {
  id: string
  habitId: string
  userId: string
  date: string
  completed: boolean
  createdAt: string
}

export interface SleepLog {
  id: string
  userId: string
  sleepTime: string
  wakeTime: string
  quality: number
  notes?: string
  date: string
}

export interface WorkoutLog {
  id: string
  userId: string
  type: string
  duration: number
  calories?: number
  notes?: string
  date: string
}

export interface MoodLog {
  id: string
  userId: string
  mood: number
  notes?: string
  date: string
}

export interface Expense {
  id: string
  userId: string
  amount: number
  category: string
  description?: string
  date: string
}

export interface DashboardStats {
  todaySleep: number | null
  weeklyWorkouts: number
  habitCompletion: number
  todayMood: number | null
  avgWeeklyMood: number | null
  todaySpending: number
  weeklyProductivity: number
}

export type CorrelationImpact = 'positive' | 'negative' | 'neutral'
export type InsightConfidence = 'low' | 'medium' | 'high'
export type MissionStatus = 'completed' | 'on-track' | 'at-risk' | 'behind'
export type MissionDirection = 'at-least' | 'at-most'
export type NudgePriority = 'low' | 'medium' | 'high'
export type TimelineRange = 'day' | 'week'
export type TimelineEventType = 'sleep' | 'workout' | 'habit' | 'mood' | 'expense'

export interface LifeScoreComponent {
  key: 'sleep' | 'workout' | 'habit' | 'mood' | 'spending'
  label: string
  score: number
  value: number | null
  target: number
  unit: string
  weight: number
}

export interface LifeScoreSummary {
  date: string
  score: number
  grade: string
  components: LifeScoreComponent[]
}

export interface CorrelationInsight {
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

export interface MissionProgress {
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

export interface GoalTargets {
  sleepHours: number
  workoutSessions: number
  workoutMinutes: number
  weeklySpending: number
  habitCompletion: number
  mood: number
}

export interface AnalyticsSettings extends GoalTargets {
  predictionProvider: 'rules' | 'gemini'
  predictionModel: string | null
}

export interface GoalPlannerSummary {
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

export interface BadgeSummary {
  id: string
  name: string
  description: string
  earned: boolean
}

export interface GamificationSummary {
  totalXp: number
  level: number
  nextLevelXp: number
  levelProgressPercent: number
  streakDays: number
  streakShields: number
  badges: BadgeSummary[]
}

export interface SmartNudge {
  id: string
  title: string
  message: string
  priority: NudgePriority
  recommendedWindow: string
  triggerReason: string
}

export interface ForecastSummary {
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

export interface DashboardPerformance {
  generatedAt: string
  lifeScore: LifeScoreSummary
  correlations: CorrelationInsight[]
  goals: GoalPlannerSummary
  gamification: GamificationSummary
  nudges: SmartNudge[]
  forecast: ForecastSummary
}

export interface TimelineEvent {
  id: string
  timestamp: string
  date: string
  type: TimelineEventType
  title: string
  description: string
  scoreImpact: number
}

export interface TimelineDaySummary {
  date: string
  label: string
  lifeScore: number
  eventCount: number
}

export interface TimelineReplay {
  range: TimelineRange
  periodStart: string
  periodEnd: string
  selectedDate: string
  daySummaries: TimelineDaySummary[]
  events: TimelineEvent[]
}

export interface CategoryTotal {
  category: string
  total: number
}

export interface ChartData {
  name: string
  value: number
  date?: string
}
