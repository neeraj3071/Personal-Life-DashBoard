import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import dashboardService from '../services/dashboard.service'
import { z } from 'zod'

const analyticsSettingsSchema = z.object({
  sleepHours: z.coerce.number().min(4).max(12),
  workoutSessions: z.coerce.number().int().min(0).max(14),
  workoutMinutes: z.coerce.number().int().min(10).max(180),
  weeklySpending: z.coerce.number().min(0).max(100000),
  habitCompletion: z.coerce.number().int().min(0).max(100),
  mood: z.coerce.number().int().min(1).max(5)
})

const isTimelineRange = (value: string | undefined): value is 'day' | 'week' => {
  return value === 'day' || value === 'week'
}

export class DashboardController {
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getDashboardStats(req.userId!)
      res.json({ success: true, data: stats })
    } catch (error) {
      next(error)
    }
  }

  async getInsights(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const insights = await dashboardService.getInsights(req.userId!)
      res.json({ success: true, data: insights })
    } catch (error) {
      next(error)
    }
  }

  async getSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const settings = await dashboardService.getSettings(req.userId!)
      res.json({ success: true, data: settings })
    } catch (error) {
      next(error)
    }
  }

  async updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payload = analyticsSettingsSchema.parse(req.body)
      const settings = await dashboardService.updateSettings(req.userId!, payload)
      res.json({ success: true, data: settings })
    } catch (error) {
      next(error)
    }
  }

  async getPerformance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const performance = await dashboardService.getPerformance(req.userId!)
      res.json({ success: true, data: performance })
    } catch (error) {
      next(error)
    }
  }

  async getTimeline(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const rangeParam = typeof req.query.range === 'string' ? req.query.range : undefined
      const dateParam = typeof req.query.date === 'string' ? req.query.date : undefined
      const range = isTimelineRange(rangeParam) ? rangeParam : 'week'

      const timeline = await dashboardService.getTimeline(req.userId!, range, dateParam)
      res.json({ success: true, data: timeline })
    } catch (error) {
      next(error)
    }
  }
}

export default new DashboardController()
