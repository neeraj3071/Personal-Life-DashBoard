"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkoutService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
class WorkoutService {
    async getWorkouts(userId, startDate, endDate) {
        return await prisma_1.default.workoutLog.findMany({
            where: {
                userId,
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
    async createWorkout(userId, type, duration, date, calories, notes) {
        return await prisma_1.default.workoutLog.create({
            data: {
                userId,
                type,
                duration,
                date,
                calories,
                notes
            }
        });
    }
}
exports.WorkoutService = WorkoutService;
exports.default = new WorkoutService();
