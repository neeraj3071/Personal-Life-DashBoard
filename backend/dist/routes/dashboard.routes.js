"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const dashboard_controller_1 = __importDefault(require("../controllers/dashboard.controller"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/stats', dashboard_controller_1.default.getStats.bind(dashboard_controller_1.default));
router.get('/insights', dashboard_controller_1.default.getInsights.bind(dashboard_controller_1.default));
router.get('/settings', dashboard_controller_1.default.getSettings.bind(dashboard_controller_1.default));
router.put('/settings', dashboard_controller_1.default.updateSettings.bind(dashboard_controller_1.default));
router.get('/performance', dashboard_controller_1.default.getPerformance.bind(dashboard_controller_1.default));
router.get('/timeline', dashboard_controller_1.default.getTimeline.bind(dashboard_controller_1.default));
exports.default = router;
