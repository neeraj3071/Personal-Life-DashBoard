"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const error_middleware_1 = require("../middleware/error.middleware");
class EmailService {
    constructor() {
        this.transporters = null;
    }
    isConfigured() {
        return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    }
    getTransporters() {
        if (!this.isConfigured()) {
            throw new error_middleware_1.AppError('Gmail is not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD.', 500);
        }
        if (!this.transporters) {
            const candidateOptions = [
                {
                    label: 'smtp.gmail.com:587',
                    options: {
                        host: 'smtp.gmail.com',
                        port: 587,
                        secure: false,
                        connectionTimeout: 15000,
                        greetingTimeout: 15000,
                        socketTimeout: 30000,
                        auth: {
                            user: process.env.GMAIL_USER,
                            pass: process.env.GMAIL_APP_PASSWORD
                        }
                    }
                },
                {
                    label: 'smtp.gmail.com:465',
                    options: {
                        host: 'smtp.gmail.com',
                        port: 465,
                        secure: true,
                        connectionTimeout: 15000,
                        greetingTimeout: 15000,
                        socketTimeout: 30000,
                        auth: {
                            user: process.env.GMAIL_USER,
                            pass: process.env.GMAIL_APP_PASSWORD
                        }
                    }
                }
            ];
            this.transporters = candidateOptions.map((candidate) => ({
                label: candidate.label,
                client: nodemailer_1.default.createTransport(candidate.options)
            }));
        }
        return this.transporters;
    }
    async sendEmail({ to, subject, html, text }) {
        const from = process.env.GMAIL_FROM || `Daily Orbit <${process.env.GMAIL_USER}>`;
        const transporters = this.getTransporters();
        const errors = [];
        for (const transporter of transporters) {
            try {
                await transporter.client.sendMail({
                    from,
                    to,
                    subject,
                    html,
                    text
                });
                return;
            }
            catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`${transporter.label} -> ${message}`);
            }
        }
        throw new error_middleware_1.AppError(`Failed to send email with all SMTP transports. ${errors.join(' | ')}`, 500);
    }
}
exports.default = new EmailService();
