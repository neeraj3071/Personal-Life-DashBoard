import express, { Application } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import dns from 'node:dns'
import authRoutes from './routes/auth.routes'
import habitRoutes from './routes/habit.routes'
import sleepRoutes from './routes/sleep.routes'
import workoutRoutes from './routes/workout.routes'
import moodRoutes from './routes/mood.routes'
import expenseRoutes from './routes/expense.routes'
import dashboardRoutes from './routes/dashboard.routes'
import reminderRoutes from './routes/reminder.routes'
import { errorHandler } from './middleware/error.middleware'
import { startReminderScheduler } from './schedulers/reminder.scheduler'

dotenv.config()

dns.setDefaultResultOrder('ipv4first')

const app: Application = express()
const PORT = process.env.PORT || 5000
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
const allowVercelPreviews = process.env.CORS_ALLOW_VERCEL_PREVIEWS === 'true'

const isAllowedOrigin = (origin: string): boolean => {
  if (allowedOrigins.includes(origin)) {
    return true
  }

  if (allowVercelPreviews && /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
    return true
  }

  return false
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true)
      return
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`))
  },
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Daily Orbit API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/habits', habitRoutes)
app.use('/api/sleep', sleepRoutes)
app.use('/api/workouts', workoutRoutes)
app.use('/api/mood', moodRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/reminders', reminderRoutes)

// Error handling middleware
app.use(errorHandler)

app.listen(PORT, () => {
  startReminderScheduler()
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
  console.log(`📊 Daily Orbit API v1.0`)
})

export default app
