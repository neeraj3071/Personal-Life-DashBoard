"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SleepController = void 0;
const sleep_service_1 = __importDefault(require("../services/sleep.service"));
const zod_1 = require("zod");
const createSleepLogSchema = zod_1.z.object({
    sleepTime: zod_1.z.string().datetime(),
    wakeTime: zod_1.z.string().datetime(),
    quality: zod_1.z.number().min(1).max(5),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: zod_1.z.string().optional()
});
class SleepController {
    async getSleepLogs(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const logs = await sleep_service_1.default.getSleepLogs(req.userId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            res.json({ success: true, data: logs });
        }
        catch (error) {
            next(error);
        }
    }
    async createSleepLog(req, res, next) {
        try {
            const { sleepTime, wakeTime, quality, date, notes } = createSleepLogSchema.parse(req.body);
            const log = await sleep_service_1.default.createSleepLog(req.userId, new Date(sleepTime), new Date(wakeTime), quality, new Date(date), notes);
            res.status(201).json({ success: true, data: log });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SleepController = SleepController;
exports.default = new SleepController();
