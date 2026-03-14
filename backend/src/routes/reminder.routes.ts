import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import reminderController from '../controllers/reminder.controller'

const router = Router()

router.get('/status', authMiddleware, reminderController.getStatus.bind(reminderController))
router.post('/test', authMiddleware, reminderController.sendTestReminder.bind(reminderController))
router.post('/send-now', reminderController.sendNow.bind(reminderController))

export default router
