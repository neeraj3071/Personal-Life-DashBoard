"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../utils/prisma"));
const email_service_1 = __importDefault(require("./email.service"));
const DEFAULT_CRON_LIST = ['0 9 * * *', '0 14 * * *', '0 20 * * *'];
const DEFAULT_TOPICS = ['exercise', 'mood', 'habits'];
const topicLabel = {
    exercise: 'exercise',
    mood: 'mood',
    habits: 'habits',
    sleep: 'sleep',
    expenses: 'expenses'
};
const isReminderTopic = (value) => {
    return value === 'exercise' || value === 'mood' || value === 'habits' || value === 'sleep' || value === 'expenses';
};
class ReminderService {
    getAppBaseUrl() {
        return process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    }
    parseCronList() {
        const raw = process.env.REMINDER_CRON_LIST;
        if (!raw) {
            return process.env.REMINDER_CRON ? [process.env.REMINDER_CRON] : DEFAULT_CRON_LIST;
        }
        const parsed = raw
            .split(';')
            .map((item) => item.trim())
            .filter(Boolean);
        return parsed.length > 0 ? parsed : DEFAULT_CRON_LIST;
    }
    parseTopics() {
        const raw = process.env.REMINDER_TOPICS;
        if (!raw) {
            return DEFAULT_TOPICS;
        }
        const parsed = raw
            .split(',')
            .map((item) => item.trim().toLowerCase())
            .filter(isReminderTopic);
        return parsed.length > 0 ? parsed : DEFAULT_TOPICS;
    }
    getFocusPrompt(topic) {
        switch (topic) {
            case 'exercise':
                return 'Small step today, strong body tomorrow. Log your workout and keep moving.';
            case 'mood':
                return 'Pause, breathe, and check in with yourself. Log your mood and protect your peace.';
            case 'habits':
                return 'Consistency beats intensity. Mark one habit complete right now and build your streak.';
            case 'sleep':
                return 'Rest is your superpower. Plan a good sleep window and log it tonight.';
            case 'expenses':
                return 'Small money choices shape big goals. Log today’s spending and stay in control.';
            default:
                return 'You are one check-in away from progress. Open Daily Orbit and take action now.';
        }
    }
    getEmailTemplate(name, topic) {
        const focusPrompt = this.getFocusPrompt(topic);
        const subject = `Daily Orbit reminder: log your ${topicLabel[topic]}`;
        const dashboardUrl = `${this.getAppBaseUrl().replace(/\/$/, '')}/dashboard`;
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
        ].join('\n');
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
    `;
        return { subject, html, text };
    }
    getReminderConfig() {
        return {
            enabled: process.env.REMINDER_ENABLED === 'true',
            cronList: this.parseCronList(),
            topics: this.parseTopics(),
            timezone: process.env.REMINDER_TIMEZONE || 'UTC',
            gmailConfigured: email_service_1.default.isConfigured()
        };
    }
    async sendReminderToUser(userId, topic = 'habits') {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true }
        });
        if (!user) {
            return { userId, email: '', sent: false, error: 'User not found' };
        }
        try {
            const template = this.getEmailTemplate(user.name, topic);
            await email_service_1.default.sendEmail({
                to: user.email,
                subject: template.subject,
                html: template.html,
                text: template.text
            });
            return { userId: user.id, email: user.email, sent: true };
        }
        catch (error) {
            return {
                userId: user.id,
                email: user.email,
                sent: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async sendDailyRemindersToAll(topic = 'habits') {
        const users = await prisma_1.default.user.findMany({
            select: { id: true }
        });
        const results = [];
        for (const user of users) {
            const result = await this.sendReminderToUser(user.id, topic);
            results.push(result);
        }
        const sent = results.filter((item) => item.sent).length;
        const failed = results.length - sent;
        return {
            processed: results.length,
            sent,
            failed,
            topic,
            results
        };
    }
}
exports.default = new ReminderService();
