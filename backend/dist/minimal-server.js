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
console.log('[STARTUP] 1. Config loaded');
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
console.log('[STARTUP] 2. Middleware configured');
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
console.log('[STARTUP] 3. Health route configured');
app.use('/api/auth', auth_routes_1.default);
app.use('/api/habits', habit_routes_1.default);
app.use('/api/sleep', sleep_routes_1.default);
app.use('/api/workouts', workout_routes_1.default);
app.use('/api/mood', mood_routes_1.default);
app.use('/api/expenses', expense_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
console.log('[STARTUP] 4. All routes mounted');
app.use(error_middleware_1.errorHandler);
console.log('[STARTUP] 5. Error handler mounted');
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
console.log('[STARTUP] 6. Listener attached');
