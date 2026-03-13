"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseService = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
class ExpenseService {
    async getExpenses(userId, startDate, endDate) {
        return await prisma_1.default.expense.findMany({
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
    async createExpense(userId, amount, category, date, description) {
        return await prisma_1.default.expense.create({
            data: {
                userId,
                amount,
                category,
                date,
                description
            }
        });
    }
    async getTotalByCategory(userId, startDate, endDate) {
        const expenses = await this.getExpenses(userId, startDate, endDate);
        const totals = {};
        expenses.forEach((expense) => {
            const rawCategory = (expense.category || 'Other').trim();
            const normalizedCategory = rawCategory.toLowerCase();
            const displayCategory = rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1).toLowerCase();
            const amount = Number.isFinite(expense.amount) ? expense.amount : 0;
            if (!totals[normalizedCategory]) {
                totals[normalizedCategory] = {
                    category: displayCategory,
                    total: 0
                };
            }
            totals[normalizedCategory].total += amount;
        });
        return Object.values(totals).sort((left, right) => right.total - left.total);
    }
}
exports.ExpenseService = ExpenseService;
exports.default = new ExpenseService();
