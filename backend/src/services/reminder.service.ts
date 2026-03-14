import prisma from '../utils/prisma'
import emailService from './email.service'

export type ReminderTopic = 'exercise' | 'mood' | 'habits' | 'sleep' | 'expenses'

interface ReminderResult {
  userId: string
  email: string
  sent: boolean
  error?: string
}

const DEFAULT_CRON_LIST = ['0 9 * * *', '0 14 * * *', '0 20 * * *']
const DEFAULT_TOPICS: ReminderTopic[] = ['exercise', 'mood', 'habits']

const topicLabel: Record<ReminderTopic, string> = {
  exercise: 'exercise',
  mood: 'mood',
  habits: 'habits',
  sleep: 'sleep',
  expenses: 'expenses'
}

const isReminderTopic = (value: string): value is ReminderTopic => {
  return value === 'exercise' || value === 'mood' || value === 'habits' || value === 'sleep' || value === 'expenses'
}

class ReminderService {
  private getAppBaseUrl(): string {
    return process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000'
  }

  private parseCronList(): string[] {
    const raw = process.env.REMINDER_CRON_LIST

    if (!raw) {
      return process.env.REMINDER_CRON ? [process.env.REMINDER_CRON] : DEFAULT_CRON_LIST
    }

    const parsed = raw
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)

    return parsed.length > 0 ? parsed : DEFAULT_CRON_LIST
  }

  private parseTopics(): ReminderTopic[] {
    const raw = process.env.REMINDER_TOPICS
    if (!raw) {
      return DEFAULT_TOPICS
    }

    const parsed = raw
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(isReminderTopic)

    return parsed.length > 0 ? parsed : DEFAULT_TOPICS
  }

  private getFocusPrompt(topic: ReminderTopic): string {
    switch (topic) {
      case 'exercise':
        return 'Small step today, strong body tomorrow. Log your workout and keep moving.'
      case 'mood':
        return 'Pause, breathe, and check in with yourself. Log your mood and protect your peace.'
      case 'habits':
        return 'Consistency beats intensity. Mark one habit complete right now and build your streak.'
      case 'sleep':
        return 'Rest is your superpower. Plan a good sleep window and log it tonight.'
      case 'expenses':
        return 'Small money choices shape big goals. Log today’s spending and stay in control.'
      default:
        return 'You are one check-in away from progress. Open Daily Orbit and take action now.'
    }
  }

  private getEmailTemplate(name: string, topic: ReminderTopic): { subject: string; html: string; text: string } {
    const focusPrompt = this.getFocusPrompt(topic)
    const subject = `Daily Orbit reminder: log your ${topicLabel[topic]}`
    const dashboardUrl = `${this.getAppBaseUrl().replace(/\/$/, '')}/dashboard`

    const text = [
      `Hi ${name},`,
      '',
      'Quick motivational nudge from Daily Orbit:',
      focusPrompt,
      '',
      'Remember to log your activity in Daily Orbit today.',
      '',
      'You have got this — one small check-in can change your day.',
      '',
      `Open your dashboard: ${dashboardUrl}`,
      '',
      '— Daily Orbit'
    ].join('\n')

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #111;">
        <h2 style="margin-bottom: 12px;">Hi ${name},</h2>
        <p style="margin-top: 0;">Quick motivational nudge from <strong>Daily Orbit</strong>:</p>
        <p style="margin-top: 0;"><strong>${focusPrompt}</strong></p>
        <p style="margin-top: 0;">Remember to log your activity in Daily Orbit today.</p>
        <p style="margin-top: 0;">You’ve got this — one small check-in can change your day.</p>
        <p style="margin-top: 20px;">
          <a href="${dashboardUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 8px;">
            Open Dashboard
          </a>
        </p>
        <p style="margin-top: 24px; font-size: 12px; color: #555;">— Daily Orbit</p>
      </div>
    `

    return { subject, html, text }
  }

  getReminderConfig() {
    return {
      enabled: process.env.REMINDER_ENABLED === 'true',
      cronList: this.parseCronList(),
      topics: this.parseTopics(),
      timezone: process.env.REMINDER_TIMEZONE || 'UTC',
      gmailConfigured: emailService.isConfigured()
    }
  }

  async sendReminderToUser(userId: string, topic: ReminderTopic = 'habits'): Promise<ReminderResult> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    })

    if (!user) {
      return { userId, email: '', sent: false, error: 'User not found' }
    }

    try {
      const template = this.getEmailTemplate(user.name, topic)

      await emailService.sendEmail({
        to: user.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      })

      return { userId: user.id, email: user.email, sent: true }
    } catch (error) {
      return {
        userId: user.id,
        email: user.email,
        sent: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async sendDailyRemindersToAll(topic: ReminderTopic = 'habits') {
    const users = await prisma.user.findMany({
      select: { id: true }
    })

    const results: ReminderResult[] = []

    for (const user of users) {
      const result = await this.sendReminderToUser(user.id, topic)
      results.push(result)
    }

    const sent = results.filter((item) => item.sent).length
    const failed = results.length - sent

    return {
      processed: results.length,
      sent,
      failed,
      topic,
      results
    }
  }
}

export default new ReminderService()
