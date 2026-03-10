import prisma from '../utils/prisma'

export class SleepService {
  async getSleepLogs(userId: string, startDate?: Date, endDate?: Date) {
    return await prisma.sleepLog.findMany({
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

  async createSleepLog(
    userId: string,
    sleepTime: Date,
    wakeTime: Date,
    quality: number,
    date: Date,
    notes?: string
  ) {
    return await prisma.sleepLog.upsert({
      where: {
        userId_date: {
          userId,
          date
        }
      },
      update: {
        sleepTime,
        wakeTime,
        quality,
        notes
      },
      create: {
        userId,
        sleepTime,
        wakeTime,
        quality,
        date,
        notes
      }
    })
  }
}

export default new SleepService()
