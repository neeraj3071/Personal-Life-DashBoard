"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const habit_routes_1 = __importDefault(require("./routes/habit.routes"));
const sleep_routes_1 = __importDefault(require("./routes/sleep.routes"));
const workout_routes_1 = __importDefault(require("./routes/workout.routes"));
const mood_routes_1 = __importDefault(require("./routes/mood.routes"));
const expense_routes_1 = __importDefault(require("./routes/expense.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
const error_middleware_1 = require("./middleware/error.middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Life Dashboard API is running' });
});
app.use('/api/auth', auth_routes_1.default);
app.use('/api/habits', habit_routes_1.default);
app.use('/api/sleep', sleep_routes_1.default);
app.use('/api/workouts', workout_routes_1.default);
app.use('/api/mood', mood_routes_1.default);
app.use('/api/expenses', expense_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
// Error handling middleware
app.use(error_middleware_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📊 Life Dashboard API v1.0`);
});
exports.default = app;
