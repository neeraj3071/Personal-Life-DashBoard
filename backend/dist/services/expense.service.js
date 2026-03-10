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
            totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
        });
        return Object.entries(totals).map(([category, amount]) => ({
            category,
            amount
        }));
    }
}
exports.ExpenseService = ExpenseService;
exports.default = new ExpenseService();
