import axios, { AxiosInstance, AxiosError } from 'axios'
import { API_BASE_URL } from './constants'
import type {
  AuthResponse,
  CategoryTotal,
  DashboardStats,
  Expense,
  Habit,
  HabitLog,
  MoodLog,
  SleepLog,
  WorkoutLog
} from '@/types'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  error?: string
}

interface ApiErrorPayload {
  success?: boolean
  error?: string
  message?: string
}

interface DateRangeParams {
  startDate?: string
  endDate?: string
}

interface HabitPayload {
  name: string
  description?: string
}

interface SleepPayload {
  sleepTime: string
  wakeTime: string
  quality: number
  notes?: string
  date: string
}

interface WorkoutPayload {
  type: string
  duration: number
  calories?: number
  notes?: string
  date: string
}

interface MoodPayload {
  mood: number
  notes?: string
  date: string
}

interface ExpensePayload {
  amount: number
  category: string
  description?: string
  date: string
}

interface DeleteResult {
  message: string
}

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Add auth token to requests
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Handle response errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiErrorPayload>) => {
        if (error.response?.status === 401) {
          this.clearToken()

          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth/')) {
            window.location.href = '/auth/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  private unwrap<T>(response: { data: ApiEnvelope<T> }): T {
    return response.data.data
  }

  private getErrorMessage(error: unknown): string {
    if (!error || typeof error !== 'object') {
      return 'Request failed'
    }

    const axiosError = error as AxiosError<ApiErrorPayload>
    return axiosError.response?.data?.error || axiosError.response?.data?.message || 'Request failed'
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  public setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
  }

  // Auth endpoints
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.client.post<ApiEnvelope<AuthResponse>>('/auth/register', {
        name,
        email,
        password
      })
      const data = this.unwrap(response)
      this.setToken(data.token)
      return data
    } catch (error) {
      throw new Error(this.getErrorMessage(error))
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await this.client.post<ApiEnvelope<AuthResponse>>('/auth/login', {
        email,
        password
      })
      const data = this.unwrap(response)
      this.setToken(data.token)
      return data
    } catch (error) {
      throw new Error(this.getErrorMessage(error))
    }
  }

  // Habits
  async getHabits(): Promise<Habit[]> {
    const response = await this.client.get<ApiEnvelope<Habit[]>>('/habits')
    return this.unwrap(response)
  }

  async createHabit(data: HabitPayload): Promise<Habit> {
    const response = await this.client.post<ApiEnvelope<Habit>>('/habits', data)
    return this.unwrap(response)
  }

  async logHabit(habitId: string, date: string, completed: boolean): Promise<HabitLog> {
    const response = await this.client.post<ApiEnvelope<HabitLog>>('/habits/log', {
      habitId,
      date,
      completed
    })
    return this.unwrap(response)
  }

  async getHabitLogs(habitId: string, startDate?: string, endDate?: string): Promise<HabitLog[]> {
    const response = await this.client.get(`/habits/${habitId}/logs`, {
      params: { startDate, endDate }
    })
    return this.unwrap(response)
  }

  // Sleep
  async getSleepLogs(params?: DateRangeParams): Promise<SleepLog[]> {
    const response = await this.client.get<ApiEnvelope<SleepLog[]>>('/sleep', {
      params
    })
    return this.unwrap(response)
  }

  async createSleepLog(data: SleepPayload): Promise<SleepLog> {
    const response = await this.client.post<ApiEnvelope<SleepLog>>('/sleep', data)
    return this.unwrap(response)
  }

  // Workouts
  async getWorkouts(params?: DateRangeParams): Promise<WorkoutLog[]> {
    const response = await this.client.get<ApiEnvelope<WorkoutLog[]>>('/workouts', {
      params
    })
    return this.unwrap(response)
  }

  async createWorkout(data: WorkoutPayload): Promise<WorkoutLog> {
    const response = await this.client.post<ApiEnvelope<WorkoutLog>>('/workouts', data)
    return this.unwrap(response)
  }

  // Mood
  async getMoodLogs(params?: DateRangeParams): Promise<MoodLog[]> {
    const response = await this.client.get<ApiEnvelope<MoodLog[]>>('/mood', {
      params
    })
    return this.unwrap(response)
  }

  async createMoodLog(data: MoodPayload): Promise<MoodLog> {
    const response = await this.client.post<ApiEnvelope<MoodLog>>('/mood', data)
    return this.unwrap(response)
  }

  // Finance
  async getExpenses(params?: DateRangeParams): Promise<Expense[]> {
    const response = await this.client.get<ApiEnvelope<Expense[]>>('/expenses', {
      params
    })
    return this.unwrap(response)
  }

  async createExpense(data: ExpensePayload): Promise<Expense> {
    const response = await this.client.post<ApiEnvelope<Expense>>('/expenses', data)
    return this.unwrap(response)
  }

  async getCategoryTotals(params?: DateRangeParams): Promise<CategoryTotal[]> {
    const response = await this.client.get<ApiEnvelope<CategoryTotal[]>>('/expenses/category-totals', {
      params
    })
    return this.unwrap(response)
  }

  async deleteHabit(habitId: string): Promise<DeleteResult> {
    const response = await this.client.delete<ApiEnvelope<DeleteResult>>(`/habits/${habitId}`)
    return this.unwrap(response)
  }

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.client.get<ApiEnvelope<DashboardStats>>('/dashboard/stats')
    return this.unwrap(response)
  }

  async getDashboardInsights(): Promise<string[]> {
    const response = await this.client.get<ApiEnvelope<string[]>>('/dashboard/insights')
    return this.unwrap(response)
  }
}

export const apiClient = new ApiClient()
