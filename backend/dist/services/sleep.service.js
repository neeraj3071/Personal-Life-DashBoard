"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SleepService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
class SleepService {
    async getSleepLogs(userId, startDate, endDate) {
        return await prisma_1.default.sleepLog.findMany({
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
    async createSleepLog(userId, sleepTime, wakeTime, quality, date, notes) {
        return await prisma_1.default.sleepLog.upsert({
            where: {
                userId_date: {
                    userId,
                    date
                }
            },
            update: {
                sleepTime,
                wakeTime,
                quality,
                notes
            },
            create: {
                userId,
                sleepTime,
                wakeTime,
                quality,
                date,
                notes
            }
        });
    }
}
exports.SleepService = SleepService;
exports.default = new SleepService();
