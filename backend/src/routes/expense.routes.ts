import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import expenseController from '../controllers/expense.controller'

const router = Router()

router.use(authMiddleware)

router.get('/', expenseController.getExpenses.bind(expenseController))
router.post('/', expenseController.createExpense.bind(expenseController))
router.get('/category-totals', expenseController.getCategoryTotals.bind(expenseController))

export default router
