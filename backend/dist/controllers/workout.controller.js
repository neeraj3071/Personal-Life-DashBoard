"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkoutController = void 0;
const workout_service_1 = __importDefault(require("../services/workout.service"));
const zod_1 = require("zod");
const createWorkoutSchema = zod_1.z.object({
    type: zod_1.z.string().min(1, 'Type is required'),
    duration: zod_1.z.number().min(1, 'Duration must be at least 1 minute'),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    calories: zod_1.z.number().optional(),
    notes: zod_1.z.string().optional()
});
class WorkoutController {
    async getWorkouts(req, res, next) {
        try {
            const { startDate, endDate } = req.query;
            const workouts = await workout_service_1.default.getWorkouts(req.userId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
            res.json({ success: true, data: workouts });
        }
        catch (error) {
            next(error);
        }
    }
    async createWorkout(req, res, next) {
        try {
            const { type, duration, date, calories, notes } = createWorkoutSchema.parse(req.body);
            const workout = await workout_service_1.default.createWorkout(req.userId, type, duration, new Date(date), calories, notes);
            res.status(201).json({ success: true, data: workout });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.WorkoutController = WorkoutController;
exports.default = new WorkoutController();
