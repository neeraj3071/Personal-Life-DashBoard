import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import sleepService from '../services/sleep.service'
import { z } from 'zod'

const createSleepLogSchema = z.object({
  sleepTime: z.string().datetime(),
  wakeTime: z.string().datetime(),
  quality: z.number().min(1).max(5),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional()
})

export class SleepController {
  async getSleepLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query
      const logs = await sleepService.getSleepLogs(
        req.userId!,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      )
      res.json({ success: true, data: logs })
    } catch (error) {
      next(error)
    }
  }

  async createSleepLog(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { sleepTime, wakeTime, quality, date, notes } = createSleepLogSchema.parse(req.body)
      const log = await sleepService.createSleepLog(
        req.userId!,
        new Date(sleepTime),
        new Date(wakeTime),
        quality,
        new Date(date),
        notes
      )
      res.status(201).json({ success: true, data: log })
    } catch (error) {
      next(error)
    }
  }
}

export default new SleepController()
