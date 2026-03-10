import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import workoutService from '../services/workout.service'
import { z } from 'zod'

const createWorkoutSchema = z.object({
  type: z.string().min(1, 'Type is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  calories: z.number().optional(),
  notes: z.string().optional()
})

export class WorkoutController {
  async getWorkouts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query
      const workouts = await workoutService.getWorkouts(
        req.userId!,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      )
      res.json({ success: true, data: workouts })
    } catch (error) {
      next(error)
    }
  }

  async createWorkout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { type, duration, date, calories, notes } = createWorkoutSchema.parse(req.body)
      const workout = await workoutService.createWorkout(
        req.userId!,
        type,
        duration,
        new Date(date),
        calories,
        notes
      )
      res.status(201).json({ success: true, data: workout })
    } catch (error) {
      next(error)
    }
  }
}

export default new WorkoutController()
