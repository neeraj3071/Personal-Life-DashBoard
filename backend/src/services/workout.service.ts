import prisma from '../utils/prisma'

export class WorkoutService {
  async getWorkouts(userId: string, startDate?: Date, endDate?: Date) {
    return await prisma.workoutLog.findMany({
      where: {
        userId,
        ...(startDate && endDate && {
          date: {
            gte: startDate,
            lte: endDate
          }
        })
      },
      orderBy: { date: 'desc' }
    })
  }

  async createWorkout(
    userId: string,
    type: string,
    duration: number,
    date: Date,
    calories?: number,
    notes?: string
  ) {
    return await prisma.workoutLog.create({
      data: {
        userId,
        type,
        duration,
        date,
        calories,
        notes
      }
    })
  }
}

export default new WorkoutService()
