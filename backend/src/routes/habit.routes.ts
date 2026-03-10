import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import habitController from '../controllers/habit.controller'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

router.get('/', habitController.getHabits.bind(habitController))
router.post('/', habitController.createHabit.bind(habitController))
router.post('/log', habitController.logHabit.bind(habitController))
router.get('/:habitId/logs', habitController.getHabitLogs.bind(habitController))
router.delete('/:habitId', habitController.deleteHabit.bind(habitController))

export default router
