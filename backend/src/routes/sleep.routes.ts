import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import sleepController from '../controllers/sleep.controller'

const router = Router()

router.use(authMiddleware)

router.get('/', sleepController.getSleepLogs.bind(sleepController))
router.post('/', sleepController.createSleepLog.bind(sleepController))

export default router
