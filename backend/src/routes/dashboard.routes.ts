import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import dashboardController from '../controllers/dashboard.controller'

const router = Router()

router.use(authMiddleware)

router.get('/stats', dashboardController.getStats.bind(dashboardController))
router.get('/insights', dashboardController.getInsights.bind(dashboardController))

export default router
