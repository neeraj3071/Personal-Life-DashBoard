"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const dashboard_service_1 = __importDefault(require("../services/dashboard.service"));
class DashboardController {
    async getStats(req, res, next) {
        try {
            const stats = await dashboard_service_1.default.getDashboardStats(req.userId);
            res.json({ success: true, data: stats });
        }
        catch (error) {
            next(error);
        }
    }
    async getInsights(req, res, next) {
        try {
            const insights = await dashboard_service_1.default.getInsights(req.userId);
            res.json({ success: true, data: insights });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.DashboardController = DashboardController;
exports.default = new DashboardController();
