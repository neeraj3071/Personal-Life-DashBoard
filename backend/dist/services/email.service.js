"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const error_middleware_1 = require("../middleware/error.middleware");
class EmailService {
    constructor() {
        this.transporter = null;
    }
    isConfigured() {
        return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    }
    getTransporter() {
        if (!this.isConfigured()) {
            throw new error_middleware_1.AppError('Gmail is not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD.', 500);
        }
        if (!this.transporter) {
            this.transporter = nodemailer_1.default.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL_USER,
                    pass: process.env.GMAIL_APP_PASSWORD
                }
            });
        }
        return this.transporter;
    }
    async sendEmail({ to, subject, html, text }) {
        const from = process.env.GMAIL_FROM || `Daily Orbit <${process.env.GMAIL_USER}>`;
        const transporter = this.getTransporter();
        await transporter.sendMail({
            from,
            to,
            subject,
            html,
            text
        });
    }
}
exports.default = new EmailService();
