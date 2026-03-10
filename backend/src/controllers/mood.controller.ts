import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import moodService from '../services/mood.service'
import { z } from 'zod'

const createMoodLogSchema = z.object({
  mood: z.number().min(1).max(5),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional()
})

export class MoodController {
  async getMoodLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query
      const logs = await moodService.getMoodLogs(
        req.userId!,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      )
      res.json({ success: true, data: logs })
    } catch (error) {
      next(error)
    }
  }

  async createMoodLog(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { mood, date, notes } = createMoodLogSchema.parse(req.body)
      const log = await moodService.createMoodLog(req.userId!, mood, new Date(date), notes)
      res.status(201).json({ success: true, data: log })
    } catch (error) {
      next(error)
    }
  }
}

export default new MoodController()
