import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import expenseService from '../services/expense.service'
import { z } from 'zod'

const createExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().optional()
})

export class ExpenseController {
  async getExpenses(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query
      const expenses = await expenseService.getExpenses(
        req.userId!,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      )
      res.json({ success: true, data: expenses })
    } catch (error) {
      next(error)
    }
  }

  async createExpense(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { amount, category, date, description } = createExpenseSchema.parse(req.body)
      const expense = await expenseService.createExpense(
        req.userId!,
        amount,
        category,
        new Date(date),
        description
      )
      res.status(201).json({ success: true, data: expense })
    } catch (error) {
      next(error)
    }
  }

  async getCategoryTotals(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query
      const totals = await expenseService.getTotalByCategory(
        req.userId!,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      )
      res.json({ success: true, data: totals })
    } catch (error) {
      next(error)
    }
  }
}

export default new ExpenseController()
