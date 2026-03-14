"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const reminder_controller_1 = __importDefault(require("../controllers/reminder.controller"));
const router = (0, express_1.Router)();
router.get('/status', auth_middleware_1.authMiddleware, reminder_controller_1.default.getStatus.bind(reminder_controller_1.default));
router.post('/test', auth_middleware_1.authMiddleware, reminder_controller_1.default.sendTestReminder.bind(reminder_controller_1.default));
router.post('/send-now', reminder_controller_1.default.sendNow.bind(reminder_controller_1.default));
exports.default = router;
