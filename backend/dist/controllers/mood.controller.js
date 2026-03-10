"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoodController = void 0;
const mood_service_1 = __importDefault(require("../services/mood.service"));
const zod_1 = require("zod");
const createMoodLogSchema = zod_1.z.object({
    mood: zod_1.z.number().min(1).max(5),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: zod_1.z.string().optional()
});
class MoodController {
    async getMoodLogs(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const logs = await mood_service_1.default.getMoodLogs(req.userId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            res.json({ success: true, data: logs });
        }
        catch (error) {
            next(error);
        }
    }
    async createMoodLog(req, res, next) {
        try {
            const { mood, date, notes } = createMoodLogSchema.parse(req.body);
            const log = await mood_service_1.default.createMoodLog(req.userId, mood, new Date(date), notes);
            res.status(201).json({ success: true, data: log });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.MoodController = MoodController;
exports.default = new MoodController();
