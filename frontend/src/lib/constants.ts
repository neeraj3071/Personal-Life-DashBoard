const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_URL

if (process.env.NODE_ENV === 'production' && !configuredApiBaseUrl) {
  throw new Error('NEXT_PUBLIC_API_URL must be set for production deployments')
}

export const API_BASE_URL = configuredApiBaseUrl || 'http://localhost:3001/api'

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  SLEEP: '/sleep',
  WORKOUT: '/workout',
  HABITS: '/habits',
  MOOD: '/mood',
  FINANCE: '/finance'
}

export const MOOD_SCALE = [
  { value: 1, label: 'Very Bad', emoji: '😢', color: 'text-red-500' },
  { value: 2, label: 'Bad', emoji: '😕', color: 'text-orange-500' },
  { value: 3, label: 'Neutral', emoji: '😐', color: 'text-yellow-500' },
  { value: 4, label: 'Good', emoji: '🙂', color: 'text-green-500' },
  { value: 5, label: 'Great', emoji: '😄', color: 'text-emerald-500' }
]

export const EXPENSE_CATEGORIES = [
  'Food',
  'Rent',
  'Transportation',
  'Shopping',
  'Subscriptions',
  'Healthcare',
  'Entertainment',
  'Other'
]

export const WORKOUT_TYPES = [
  'Cardio',
  'Strength',
  'Yoga',
  'Sports',
  'Walking',
  'Running',
  'Cycling',
  'Swimming',
  'Other'
]

export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4'
}
