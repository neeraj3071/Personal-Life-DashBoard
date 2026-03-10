"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const mood_controller_1 = __importDefault(require("../controllers/mood.controller"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/', mood_controller_1.default.getMoodLogs.bind(mood_controller_1.default));
router.post('/', mood_controller_1.default.createMoodLog.bind(mood_controller_1.default));
exports.default = router;
