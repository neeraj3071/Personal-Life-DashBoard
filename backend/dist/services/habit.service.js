"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HabitService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const error_middleware_1 = require("../middleware/error.middleware");
class HabitService {
    async getHabits(userId) {
        return await prisma_1.default.habit.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async createHabit(userId, name, description) {
        return await prisma_1.default.habit.create({
            data: {
                userId,
                name,
                description
            }
        });
    }
    async logHabit(habitId, userId, date, completed) {
        // Verify habit belongs to user
        const habit = await prisma_1.default.habit.findFirst({
            where: { id: habitId, userId }
        });
        if (!habit) {
            throw new error_middleware_1.AppError('Habit not found', 404);
        }
        return await prisma_1.default.habitLog.upsert({
            where: {
                habitId_date: {
                    habitId,
                    date
                }
            },
            update: { completed },
            create: {
                habitId,
                date,
                completed
            }
        });
    }
    async getHabitLogs(habitId, userId, startDate, endDate) {
        // Verify habit belongs to user
        const habit = await prisma_1.default.habit.findFirst({
            where: { id: habitId, userId }
        });
        if (!habit) {
            throw new error_middleware_1.AppError('Habit not found', 404);
        }
        return await prisma_1.default.habitLog.findMany({
            where: {
                habitId,
                ...(startDate && endDate && {
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                })
            },
            orderBy: { date: 'desc' }
        });
    }
    async deleteHabit(habitId, userId) {
        const habit = await prisma_1.default.habit.findFirst({
            where: { id: habitId, userId }
        });
        if (!habit) {
            throw new error_middleware_1.AppError('Habit not found', 404);
        }
        await prisma_1.default.habit.delete({ where: { id: habitId } });
        return { message: 'Habit deleted successfully' };
    }
}
exports.HabitService = HabitService;
exports.default = new HabitService();
