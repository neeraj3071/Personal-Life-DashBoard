"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpenseController = void 0;
const expense_service_1 = __importDefault(require("../services/expense.service"));
const zod_1 = require("zod");
const createExpenseSchema = zod_1.z.object({
    amount: zod_1.z.number().positive('Amount must be positive'),
    category: zod_1.z.string().min(1, 'Category is required'),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    description: zod_1.z.string().optional()
});
class ExpenseController {
    async getExpenses(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const expenses = await expense_service_1.default.getExpenses(req.userId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            res.json({ success: true, data: expenses });
        }
        catch (error) {
            next(error);
        }
    }
    async createExpense(req, res, next) {
        try {
            const { amount, category, date, description } = createExpenseSchema.parse(req.body);
            const expense = await expense_service_1.default.createExpense(req.userId, amount, category, new Date(date), description);
            res.status(201).json({ success: true, data: expense });
        }
        catch (error) {
            next(error);
        }
    }
    async getCategoryTotals(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const totals = await expense_service_1.default.getTotalByCategory(req.userId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            res.json({ success: true, data: totals });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ExpenseController = ExpenseController;
exports.default = new ExpenseController();
