"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = __importDefault(require("../services/dashboard.service"));
const zod_1 = require("zod");
const analyticsSettingsSchema = zod_1.z.object({
    sleepHours: zod_1.z.coerce.number().min(4).max(12),
    workoutSessions: zod_1.z.coerce.number().int().min(0).max(14),
    workoutMinutes: zod_1.z.coerce.number().int().min(10).max(180),
    weeklySpending: zod_1.z.coerce.number().min(0).max(100000),
    habitCompletion: zod_1.z.coerce.number().int().min(0).max(100),
    mood: zod_1.z.coerce.number().int().min(1).max(5)
});
const isTimelineRange = (value) => {
    return value === 'day' || value === 'week';
};
class DashboardController {
    async getStats(req, res, next) {
        try {
            const stats = await dashboard_service_1.default.getDashboardStats(req.userId);
            res.json({ success: true, data: stats });
        }
        catch (error) {
            next(error);
        }
    }
    async getInsights(req, res, next) {
        try {
            const insights = await dashboard_service_1.default.getInsights(req.userId);
            res.json({ success: true, data: insights });
        }
        catch (error) {
            next(error);
        }
    }
    async getSettings(req, res, next) {
        try {
            const settings = await dashboard_service_1.default.getSettings(req.userId);
            res.json({ success: true, data: settings });
        }
        catch (error) {
            next(error);
        }
    }
    async updateSettings(req, res, next) {
        try {
            const payload = analyticsSettingsSchema.parse(req.body);
            const settings = await dashboard_service_1.default.updateSettings(req.userId, payload);
            res.json({ success: true, data: settings });
        }
        catch (error) {
            next(error);
        }
    }
    async getPerformance(req, res, next) {
        try {
            const performance = await dashboard_service_1.default.getPerformance(req.userId);
            res.json({ success: true, data: performance });
        }
        catch (error) {
            next(error);
        }
    }
    async getTimeline(req, res, next) {
        try {
            const rangeParam = typeof req.query.range === 'string' ? req.query.range : undefined;
            const dateParam = typeof req.query.date === 'string' ? req.query.date : undefined;
            const range = isTimelineRange(rangeParam) ? rangeParam : 'week';
            const timeline = await dashboard_service_1.default.getTimeline(req.userId, range, dateParam);
            res.json({ success: true, data: timeline });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DashboardController = DashboardController;
exports.default = new DashboardController();
