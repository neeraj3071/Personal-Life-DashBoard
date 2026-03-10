"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const expense_controller_1 = __importDefault(require("../controllers/expense.controller"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/', expense_controller_1.default.getExpenses.bind(expense_controller_1.default));
router.post('/', expense_controller_1.default.createExpense.bind(expense_controller_1.default));
router.get('/category-totals', expense_controller_1.default.getCategoryTotals.bind(expense_controller_1.default));
exports.default = router;
