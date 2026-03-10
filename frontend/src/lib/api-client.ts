import axios, { AxiosInstance, AxiosError } from 'axios'
import { API_BASE_URL } from './constants'

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
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.clearToken()
          window.location.href = '/auth/login'
        }
        return Promise.reject(error)
      }
    )
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
  async register(name: string, email: string, password: string) {
    const response = await this.client.post('/auth/register', { name, email, password })
    return response.data
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password })
    if (response.data.token) {
      this.setToken(response.data.token)
    }
    return response.data
  }

  // Habits
  async getHabits() {
    const response = await this.client.get('/habits')
    return response.data
  }

  async createHabit(data: { name: string; description?: string }) {
    const response = await this.client.post('/habits', data)
    return response.data
  }

  async logHabit(habitId: string, date: string, completed: boolean) {
    const response = await this.client.post('/habits/log', { habitId, date, completed })
    return response.data
  }

  async getHabitLogs(habitId: string, startDate?: string, endDate?: string) {
    const response = await this.client.get(`/habits/${habitId}/logs`, {
      params: { startDate, endDate }
    })
    return response.data
  }

  // Sleep
  async getSleepLogs(startDate?: string, endDate?: string) {
    const response = await this.client.get('/sleep', {
      params: { startDate, endDate }
    })
    return response.data
  }

  async createSleepLog(data: {
    sleepTime: string
    wakeTime: string
    quality: number
    notes?: string
    date: string
  }) {
    const response = await this.client.post('/sleep', data)
    return response.data
  }

  // Workouts
  async getWorkouts(startDate?: string, endDate?: string) {
    const response = await this.client.get('/workouts', {
      params: { startDate, endDate }
    })
    return response.data
  }

  async createWorkout(data: {
    type: string
    duration: number
    calories?: number
    notes?: string
    date: string
  }) {
    const response = await this.client.post('/workouts', data)
    return response.data
  }

  // Mood
  async getMoodLogs(startDate?: string, endDate?: string) {
    const response = await this.client.get('/mood', {
      params: { startDate, endDate }
    })
    return response.data
  }

  async createMoodLog(data: {
    mood: number
    notes?: string
    date: string
  }) {
    const response = await this.client.post('/mood', data)
    return response.data
  }

  // Finance
  async getExpenses(startDate?: string, endDate?: string) {
    const response = await this.client.get('/expenses', {
      params: { startDate, endDate }
    })
    return response.data
  }

  async createExpense(data: {
    amount: number
    category: string
    description?: string
    date: string
  }) {
    const response = await this.client.post('/expenses', data)
    return response.data
  }

  // Dashboard
  async getDashboardStats() {
    const response = await this.client.get('/dashboard/stats')
    return response.data
  }
}

export const apiClient = new ApiClient()
