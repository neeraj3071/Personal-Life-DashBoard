"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const habit_controller_1 = __importDefault(require("../controllers/habit.controller"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
router.get('/', habit_controller_1.default.getHabits.bind(habit_controller_1.default));
router.post('/', habit_controller_1.default.createHabit.bind(habit_controller_1.default));
router.post('/log', habit_controller_1.default.logHabit.bind(habit_controller_1.default));
router.get('/:habitId/logs', habit_controller_1.default.getHabitLogs.bind(habit_controller_1.default));
router.delete('/:habitId', habit_controller_1.default.deleteHabit.bind(habit_controller_1.default));
exports.default = router;
