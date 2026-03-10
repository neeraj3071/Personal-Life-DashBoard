import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import moodController from '../controllers/mood.controller'

const router = Router()

router.use(authMiddleware)

router.get('/', moodController.getMoodLogs.bind(moodController))
router.post('/', moodController.createMoodLog.bind(moodController))

export default router
