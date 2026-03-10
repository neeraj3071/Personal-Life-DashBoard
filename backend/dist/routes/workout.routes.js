"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const workout_controller_1 = __importDefault(require("../controllers/workout.controller"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
router.get('/', workout_controller_1.default.getWorkouts.bind(workout_controller_1.default));
router.post('/', workout_controller_1.default.createWorkout.bind(workout_controller_1.default));
exports.default = router;
