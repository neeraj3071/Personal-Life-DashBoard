"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const error_middleware_1 = require("../middleware/error.middleware");
class AuthService {
    async register(name, email, password) {
        // Check if user exists
        const existingUser = await prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new error_middleware_1.AppError('User already exists', 400);
        }
        // Hash password
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        // Create user
        const user = await prisma_1.default.user.create({
            data: {
                name,
                email,
                passwordHash
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
            }
        });
        // Generate JWT
        const token = this.generateToken(user.id);
        return { user, token };
    }
    async login(email, password) {
        // Find user
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            throw new error_middleware_1.AppError('Invalid credentials', 401);
        }
        // Verify password
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            throw new error_middleware_1.AppError('Invalid credentials', 401);
        }
        // Generate JWT
        const token = this.generateToken(user.id);
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            },
            token
        };
    }
    generateToken(userId) {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new error_middleware_1.AppError('JWT secret not configured', 500);
        }
        const jwtExpires = process.env.JWT_EXPIRES_IN || '7d';
        return jsonwebtoken_1.default.sign({ userId }, jwtSecret, { expiresIn: jwtExpires });
    }
}
exports.AuthService = AuthService;
exports.default = new AuthService();
