import prisma from '../utils/prisma'
import { AppError } from '../middleware/error.middleware'

export class HabitService {
  async getHabits(userId: string) {
    return await prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async createHabit(userId: string, name: string, description?: string) {
    return await prisma.habit.create({
      data: {
        userId,
        name,
        description
      }
    })
  }

  async logHabit(habitId: string, userId: string, date: Date, completed: boolean) {
    // Verify habit belongs to user
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId }
    })

    if (!habit) {
      throw new AppError('Habit not found', 404)
    }

    return await prisma.habitLog.upsert({
      where: {
        habitId_date: {
          habitId,
          date
        }
      },
      update: { completed },
      create: {
        habitId,
        date,
        completed
      }
    })
  }

  async getHabitLogs(habitId: string, userId: string, startDate?: Date, endDate?: Date) {
    // Verify habit belongs to user
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId }
    })

    if (!habit) {
      throw new AppError('Habit not found', 404)
    }

    return await prisma.habitLog.findMany({
      where: {
        habitId,
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

  async deleteHabit(habitId: string, userId: string) {
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId }
    })

    if (!habit) {
      throw new AppError('Habit not found', 404)
    }

    await prisma.habit.delete({ where: { id: habitId } })
    return { message: 'Habit deleted successfully' }
  }
}

export default new HabitService()
