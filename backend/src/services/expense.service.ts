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
    
    const totals: Record<string, number> = {}
    expenses.forEach((expense: any) => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amount
    })

    return Object.entries(totals).map(([category, amount]) => ({
      category,
      amount
    }))
  }
}

export default new ExpenseService()
