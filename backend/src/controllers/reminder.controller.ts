import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import reminderService, { ReminderTopic } from '../services/reminder.service'
import { AppError } from '../middleware/error.middleware'

const isReminderTopic = (value: string | undefined): value is ReminderTopic => {
  return value === 'exercise' || value === 'mood' || value === 'habits' || value === 'sleep' || value === 'expenses'
}

class ReminderController {
  async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const config = reminderService.getReminderConfig()
      res.json({ success: true, data: config })
    } catch (error) {
      next(error)
    }
  }

  async sendTestReminder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError('Unauthorized', 401)
      }

      const topicParam = typeof req.query.topic === 'string' ? req.query.topic : undefined
      const topic = isReminderTopic(topicParam) ? topicParam : 'habits'

      const result = await reminderService.sendReminderToUser(req.userId, topic)

      if (!result.sent) {
        throw new AppError(result.error || 'Failed to send reminder email', 500)
      }

      res.json({
        success: true,
        data: {
          message: 'Test reminder sent successfully',
          email: result.email,
          topic
        }
      })
    } catch (error) {
      next(error)
    }
  }

  async sendNow(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const adminKey = process.env.REMINDER_ADMIN_KEY
      const keyFromHeader = req.headers['x-reminder-admin-key']

      const topicParam = typeof req.query.topic === 'string' ? req.query.topic : undefined
      const topic = isReminderTopic(topicParam) ? topicParam : 'habits'

      if (!adminKey || keyFromHeader !== adminKey) {
        throw new AppError('Forbidden: invalid reminder admin key', 403)
      }

      const result = await reminderService.sendDailyRemindersToAll(topic)
      res.json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }
}

export default new ReminderController()
