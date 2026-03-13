import prisma from '../utils/prisma'

export class ExpenseService {
  async getExpenses(userId: string, startDate?: Date, endDate?: Date) {
    return await prisma.expense.findMany({
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

  async createExpense(
    userId: string,
    amount: number,
    category: string,
    date: Date,
    description?: string
  ) {
    return await prisma.expense.create({
      data: {
        userId,
        amount,
        category,
        date,
        description
      }
    })
  }

  async getTotalByCategory(userId: string, startDate?: Date, endDate?: Date) {
    const expenses = await this.getExpenses(userId, startDate, endDate)

    const totals: Record<string, { category: string; total: number }> = {}

    expenses.forEach((expense) => {
      const rawCategory = (expense.category || 'Other').trim()
      const normalizedCategory = rawCategory.toLowerCase()
      const displayCategory = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase()
      const amount = Number.isFinite(expense.amount) ? expense.amount : 0

      if (!totals[normalizedCategory]) {
        totals[normalizedCategory] = {
          category: displayCategory,
          total: 0
        }
      }

      totals[normalizedCategory].total += amount
    })

    return Object.values(totals).sort((left, right) => right.total - left.total)
  }
}

export default new ExpenseService()
