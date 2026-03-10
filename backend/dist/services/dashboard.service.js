"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const date_fns_1 = require("date-fns");
class DashboardService {
    async getDashboardStats(userId) {
        const today = new Date();
        const todayStart = (0, date_fns_1.startOfDay)(today);
        const todayEnd = (0, date_fns_1.endOfDay)(today);
        const weekStart = (0, date_fns_1.startOfWeek)(today);
        const weekEnd = (0, date_fns_1.endOfWeek)(today);
        // Get today's sleep
        const todaySleep = await prisma_1.default.sleepLog.findFirst({
            where: {
                userId,
                date: todayStart
            }
        });
        const sleepDuration = todaySleep
            ? (new Date(todaySleep.wakeTime).getTime() - new Date(todaySleep.sleepTime).getTime()) /
                (1000 * 60 * 60)
            : null;
        // Get this week's workouts
        const weeklyWorkouts = await prisma_1.default.workoutLog.count({
            where: {
                userId,
                date: {
                    gte: weekStart,
                    lte: weekEnd
                }
            }
        });
        // Calculate habit completion rate
        const habits = await prisma_1.default.habit.findMany({
            where: { userId },
            include: {
                logs: {
                    where: {
                        date: {
                            gte: weekStart,
                            lte: weekEnd
                        }
                    }
                }
            }
        });
        const totalPossibleCompletions = habits.length * 7;
        const completedLogs = habits.reduce((sum, habit) => sum + habit.logs.filter((log) => log.completed).length, 0);
        const habitCompletion = totalPossibleCompletions > 0
            ? Math.round((completedLogs / totalPossibleCompletions) * 100)
            : 0;
        // Get today's mood
        const todayMood = await prisma_1.default.moodLog.findFirst({
            where: {
                userId,
                date: todayStart
            }
        });
        // Get average mood this week
        const weekMoods = await prisma_1.default.moodLog.findMany({
            where: {
                userId,
                date: {
                    gte: weekStart,
                    lte: weekEnd
                }
            }
        });
        const avgMood = weekMoods.length > 0
            ? weekMoods.reduce((sum, log) => sum + log.mood, 0) / weekMoods.length
            : null;
        // Get today's spending
        const todayExpenses = await prisma_1.default.expense.findMany({
            where: {
                userId,
                date: todayStart
            }
        });
        const todaySpending = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        // Calculate productivity score (based on habits + workouts)
        const productivityScore = Math.round((habitCompletion + (weeklyWorkouts / 7) * 100) / 2);
        return {
            todaySleep: sleepDuration ? Math.round(sleepDuration * 10) / 10 : null,
            weeklyWorkouts,
            habitCompletion,
            todayMood: todayMood?.mood || null,
            avgWeeklyMood: avgMood ? Math.round(avgMood * 10) / 10 : null,
            todaySpending: Math.round(todaySpending * 100) / 100,
            weeklyProductivity: productivityScore
        };
    }
    async getInsights(userId) {
        // Get data from last 30 days
        const thirtyDaysAgo = (0, date_fns_1.subDays)(new Date(), 30);
        const sleepLogs = await prisma_1.default.sleepLog.findMany({
            where: {
                userId,
                date: { gte: thirtyDaysAgo }
            }
        });
        const workoutLogs = await prisma_1.default.workoutLog.findMany({
            where: {
                userId,
                date: { gte: thirtyDaysAgo }
            }
        });
        const moodLogs = await prisma_1.default.moodLog.findMany({
            where: {
                userId,
                date: { gte: thirtyDaysAgo }
            }
        });
        const insights = [];
        // Insight: Sleep on workout days
        const workoutDates = new Set(workoutLogs.map((w) => w.date.toISOString().split('T')[0]));
        const sleepWithWorkout = sleepLogs.filter((s) => workoutDates.has(s.date.toISOString().split('T')[0]));
        const sleepWithoutWorkout = sleepLogs.filter((s) => !workoutDates.has(s.date.toISOString().split('T')[0]));
        if (sleepWithWorkout.length > 3 && sleepWithoutWorkout.length > 3) {
            const avgSleepWithWorkout = sleepWithWorkout.reduce((sum, s) => sum + s.quality, 0) / sleepWithWorkout.length;
            const avgSleepWithoutWorkout = sleepWithoutWorkout.reduce((sum, s) => sum + s.quality, 0) / sleepWithoutWorkout.length;
            if (avgSleepWithWorkout > avgSleepWithoutWorkout + 0.5) {
                insights.push('💪 You sleep better on days you work out!');
            }
        }
        // Insight: Low sleep affects mood
        if (sleepLogs.length > 5 && moodLogs.length > 5) {
            const avgSleepQuality = sleepLogs.reduce((sum, s) => sum + s.quality, 0) / sleepLogs.length;
            const lowSleepDays = sleepLogs.filter((s) => s.quality < avgSleepQuality - 1);
            if (lowSleepDays.length > 0) {
                insights.push('😴 Your mood tends to drop when sleep quality is low');
            }
        }
        // Insight: Workout streak
        if (workoutLogs.length >= 3) {
            const last7Days = (0, date_fns_1.subDays)(new Date(), 7);
            const recentWorkouts = workoutLogs.filter((w) => w.date >= last7Days);
            if (recentWorkouts.length >= 3) {
                insights.push(`🔥 Great job! You've worked out ${recentWorkouts.length} times this week!`);
            }
        }
        return insights;
    }
}
exports.DashboardService = DashboardService;
exports.default = new DashboardService();
