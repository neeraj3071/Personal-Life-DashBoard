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

export interface CategoryTotal {
  category: string
  total: number
}

export interface ChartData {
  name: string
  value: number
  date?: string
}
