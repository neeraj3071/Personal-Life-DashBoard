import express, { Application } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import habitRoutes from './routes/habit.routes'
import sleepRoutes from './routes/sleep.routes'
import workoutRoutes from './routes/workout.routes'
import moodRoutes from './routes/mood.routes'
import expenseRoutes from './routes/expense.routes'
import dashboardRoutes from './routes/dashboard.routes'
import { errorHandler } from './middleware/error.middleware'

dotenv.config()

const app: Application = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Life Dashboard API is running' })
})

app.use('/api/auth', authRoutes)
app.use('/api/habits', habitRoutes)
app.use('/api/sleep', sleepRoutes)
app.use('/api/workouts', workoutRoutes)
app.use('/api/mood', moodRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Error handling middleware
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
  console.log(`📊 Life Dashboard API v1.0`)
})

export default app
