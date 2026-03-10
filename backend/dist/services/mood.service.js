"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoodService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
class MoodService {
    async getMoodLogs(userId, startDate, endDate) {
        return await prisma_1.default.moodLog.findMany({
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
    async createMoodLog(userId, mood, date, notes) {
        return await prisma_1.default.moodLog.upsert({
            where: {
                userId_date: {
                    userId,
                    date
                }
            },
            update: {
                mood,
                notes
            },
            create: {
                userId,
                mood,
                date,
                notes
            }
        });
    }
}
exports.MoodService = MoodService;
exports.default = new MoodService();
