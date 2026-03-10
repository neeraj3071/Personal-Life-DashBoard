import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import dashboardService from '../services/dashboard.service'

export class DashboardController {
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await dashboardService.getDashboardStats(req.userId!)
      res.json({ success: true, data: stats })
    } catch (error) {
      next(error)
    }
  }

  async getInsights(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const insights = await dashboardService.getInsights(req.userId!)
      res.json({ success: true, data: insights })
    } catch (error) {
      next(error)
    }
  }
}

export default new DashboardController()
