"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const reminder_service_1 = __importDefault(require("../services/reminder.service"));
const error_middleware_1 = require("../middleware/error.middleware");
const isReminderTopic = (value) => {
    return value === 'exercise' || value === 'mood' || value === 'habits' || value === 'sleep' || value === 'expenses';
};
class ReminderController {
    async getStatus(req, res, next) {
        try {
            const config = reminder_service_1.default.getReminderConfig();
            res.json({ success: true, data: config });
        }
        catch (error) {
            next(error);
        }
    }
    async sendTestReminder(req, res, next) {
        try {
            if (!req.userId) {
                throw new error_middleware_1.AppError('Unauthorized', 401);
            }
            const topicParam = typeof req.query.topic === 'string' ? req.query.topic : undefined;
            const topic = isReminderTopic(topicParam) ? topicParam : 'habits';
            const result = await reminder_service_1.default.sendReminderToUser(req.userId, topic);
            if (!result.sent) {
                throw new error_middleware_1.AppError(result.error || 'Failed to send reminder email', 500);
            }
            res.json({
                success: true,
                data: {
                    message: 'Test reminder sent successfully',
                    email: result.email,
                    topic
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    async sendNow(req, res, next) {
        try {
            const adminKey = process.env.REMINDER_ADMIN_KEY;
            const keyFromHeader = req.headers['x-reminder-admin-key'];
            const topicParam = typeof req.query.topic === 'string' ? req.query.topic : undefined;
            const topic = isReminderTopic(topicParam) ? topicParam : 'habits';
            if (!adminKey || keyFromHeader !== adminKey) {
                throw new error_middleware_1.AppError('Forbidden: invalid reminder admin key', 403);
            }
            const result = await reminder_service_1.default.sendDailyRemindersToAll(topic);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.default = new ReminderController();
