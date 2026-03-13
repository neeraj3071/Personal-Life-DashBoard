import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import dashboardController from '../controllers/dashboard.controller'

const router = Router()

router.use(authMiddleware)

router.get('/stats', dashboardController.getStats.bind(dashboardController))
router.get('/insights', dashboardController.getInsights.bind(dashboardController))
router.get('/settings', dashboardController.getSettings.bind(dashboardController))
router.put('/settings', dashboardController.updateSettings.bind(dashboardController))
router.get('/performance', dashboardController.getPerformance.bind(dashboardController))
router.get('/timeline', dashboardController.getTimeline.bind(dashboardController))

export default router
