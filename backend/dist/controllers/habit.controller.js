"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitController = void 0;
const habit_service_1 = __importDefault(require("../services/habit.service"));
const zod_1 = require("zod");
const createHabitSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional()
});
const logHabitSchema = zod_1.z.object({
    habitId: zod_1.z.string().uuid('Invalid habit ID'),
    date: zod_1.z.string().datetime().or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    completed: zod_1.z.boolean()
});
class HabitController {
    async getHabits(req, res, next) {
        try {
            const habits = await habit_service_1.default.getHabits(req.userId);
            res.json({ success: true, data: habits });
        }
        catch (error) {
            next(error);
        }
    }
    async createHabit(req, res, next) {
        try {
            const { name, description } = createHabitSchema.parse(req.body);
            const habit = await habit_service_1.default.createHabit(req.userId, name, description);
            res.status(201).json({ success: true, data: habit });
        }
        catch (error) {
            next(error);
        }
    }
    async logHabit(req, res, next) {
        try {
            const { habitId, date, completed } = logHabitSchema.parse(req.body);
            const log = await habit_service_1.default.logHabit(habitId, req.userId, new Date(date), completed);
            res.json({ success: true, data: log });
        }
        catch (error) {
            next(error);
        }
    }
    async getHabitLogs(req, res, next) {
        try {
            const habitId = req.params.habitId;
            const { startDate, endDate } = req.query;
            const logs = await habit_service_1.default.getHabitLogs(habitId, req.userId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            res.json({ success: true, data: logs });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteHabit(req, res, next) {
        try {
            const habitId = req.params.habitId;
            const result = await habit_service_1.default.deleteHabit(habitId, req.userId);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.HabitController = HabitController;
exports.default = new HabitController();
