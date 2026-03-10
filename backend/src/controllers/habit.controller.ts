import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import habitService from '../services/habit.service'
import { z } from 'zod'

const createHabitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional()
})

const logHabitSchema = z.object({
  habitId: z.string().uuid('Invalid habit ID'),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  completed: z.boolean()
})

export class HabitController {
  async getHabits(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const habits = await habitService.getHabits(req.userId!)
      res.json({ success: true, data: habits })
    } catch (error) {
      next(error)
    }
  }

  async createHabit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, description } = createHabitSchema.parse(req.body)
      const habit = await habitService.createHabit(req.userId!, name, description)
      res.status(201).json({ success: true, data: habit })
    } catch (error) {
      next(error)
    }
  }

  async logHabit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { habitId, date, completed } = logHabitSchema.parse(req.body)
      const log = await habitService.logHabit(habitId, req.userId!, new Date(date), completed)
      res.json({ success: true, data: log })
    } catch (error) {
      next(error)
    }
  }

  async getHabitLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const habitId = req.params.habitId as string
      const { startDate, endDate } = req.query
      
      const logs = await habitService.getHabitLogs(
        habitId,
        req.userId!,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      )
      
      res.json({ success: true, data: logs })
    } catch (error) {
      next(error)
    }
  }

  async deleteHabit(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const habitId = req.params.habitId as string
      const result = await habitService.deleteHabit(habitId, req.userId!)
      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }
}

export default new HabitController()
