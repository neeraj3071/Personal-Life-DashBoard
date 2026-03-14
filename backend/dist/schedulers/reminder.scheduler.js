"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopReminderScheduler = exports.startReminderScheduler = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const reminder_service_1 = __importDefault(require("../services/reminder.service"));
let reminderTasks = [];
const parseCronList = () => {
    const raw = process.env.REMINDER_CRON_LIST;
    if (!raw) {
        return process.env.REMINDER_CRON ? [process.env.REMINDER_CRON] : ['0 9 * * *', '0 14 * * *', '0 20 * * *'];
    }
    const parsed = raw
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean);
    return parsed.length > 0 ? parsed : ['0 9 * * *', '0 14 * * *', '0 20 * * *'];
};
const parseTopics = () => {
    const raw = process.env.REMINDER_TOPICS;
    const allowedTopics = ['exercise', 'mood', 'habits', 'sleep', 'expenses'];
    if (!raw) {
        return ['exercise', 'mood', 'habits'];
    }
    const parsed = raw
        .split(',')
        .map((item) => item.trim().toLowerCase())
        .filter((item) => allowedTopics.includes(item));
    return parsed.length > 0 ? parsed : ['exercise', 'mood', 'habits'];
};
const startReminderScheduler = () => {
    const enabled = process.env.REMINDER_ENABLED === 'true';
    if (!enabled) {
        console.log('[Reminder] Scheduler is disabled (set REMINDER_ENABLED=true to enable).');
        return;
    }
    const cronList = parseCronList();
    const topics = parseTopics();
    const timezone = process.env.REMINDER_TIMEZONE || 'UTC';
    reminderTasks = [];
    cronList.forEach((cronExpression, index) => {
        if (!node_cron_1.default.validate(cronExpression)) {
            console.error(`[Reminder] Invalid REMINDER_CRON expression: ${cronExpression}`);
            return;
        }
        const topic = topics[index % topics.length];
        const task = node_cron_1.default.schedule(cronExpression, async () => {
            console.log(`[Reminder] Running reminder job for topic "${topic}"...`);
            const result = await reminder_service_1.default.sendDailyRemindersToAll(topic);
            console.log(`[Reminder] Reminder job complete (${topic}). Sent: ${result.sent}/${result.processed}, Failed: ${result.failed}`);
        }, {
            timezone
        });
        reminderTasks.push(task);
    });
    if (reminderTasks.length === 0) {
        console.error('[Reminder] Scheduler did not start because no valid cron expressions were found.');
        return;
    }
    console.log(`[Reminder] Scheduler started with ${reminderTasks.length} job(s). Cron list: "${cronList.join('; ')}", Topics: "${topics.join(', ')}", Timezone: "${timezone}"`);
};
exports.startReminderScheduler = startReminderScheduler;
const stopReminderScheduler = () => {
    if (reminderTasks.length > 0) {
        reminderTasks.forEach((task) => task.stop());
        reminderTasks = [];
        console.log('[Reminder] Scheduler stopped.');
    }
};
exports.stopReminderScheduler = stopReminderScheduler;
