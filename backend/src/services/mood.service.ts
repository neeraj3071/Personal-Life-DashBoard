import prisma from '../utils/prisma'

export class MoodService {
  async getMoodLogs(userId: string, startDate?: Date, endDate?: Date) {
    return await prisma.moodLog.findMany({
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

  async createMoodLog(userId: string, mood: number, date: Date, notes?: string) {
    return await prisma.moodLog.upsert({
      where: {
        userId_date: {
          userId,
          date
        }
      },
      update: {
        mood,
        notes
      },
      create: {
        userId,
        mood,
        date,
        notes
      }
    })
  }
}

export default new MoodService()
