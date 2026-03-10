'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import ProtectedRoute from '@/components/ProtectedRoute'
import { apiClient } from '@/lib/api-client'
import { useAuth } from '@/contexts/AuthContext'
import { formatCurrency } from '@/lib/utils'

interface DashboardStats {
  todaySleep: number | null
  weeklyWorkouts: number
  habitCompletion: number
  todayMood: number | null
  avgWeeklyMood: number | null
  todaySpending: number
  weeklyProductivity: number
}

function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user, logout } = useAuth()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [statsResponse, insightsResponse] = await Promise.all([
        apiClient.getDashboardStats(),
        apiClient.getDashboardStats().then(() => 
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/insights`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }).then(r => r.json())
        )
      ])
      
      setStats(statsResponse.data)
      setInsights(insightsResponse.data || [])
    } catch (err: any) {
      setError('Failed to load dashboard data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Life Dashboard 📊</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
          </div>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sleep Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">😴 Sleep</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.todaySleep ? `${stats.todaySleep} hrs` : 'No data'}
              </div>
              <p className="text-sm text-gray-500 mt-2">Last night</p>
            </CardContent>
          </Card>

          {/* Workout Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💪 Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.weeklyWorkouts || 0} / 7</div>
              <p className="text-sm text-gray-500 mt-2">This week</p>
            </CardContent>
          </Card>

          {/* Habits Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">✅ Habits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.habitCompletion || 0}%</div>
              <p className="text-sm text-gray-500 mt-2">Completion rate</p>
            </CardContent>
          </Card>

          {/* Mood Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">😊 Mood</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.avgWeeklyMood ? `${stats.avgWeeklyMood} / 5` : 'No data'}
              </div>
              <p className="text-sm text-gray-500 mt-2">Average this week</p>
            </CardContent>
          </Card>

          {/* Finance Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💰 Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(stats?.todaySpending || 0)}
              </div>
              <p className="text-sm text-gray-500 mt-2">Today</p>
            </CardContent>
          </Card>

          {/* Productivity Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🎯 Productivity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.weeklyProductivity || 0}%</div>
              <p className="text-sm text-gray-500 mt-2">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Insights Section */}
        {insights.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-2xl font-semibold">💡 Insights</h2>
            {insights.map((insight, index) => (
              <div key={index} className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        )}

        {insights.length === 0 && (
          <div className="mt-8 p-6 bg-gray-100 rounded-lg border border-gray-200">
            <p className="text-gray-600 text-center">
              Start logging your data to get personalized insights! 📈
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
