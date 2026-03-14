import nodemailer, { Transporter } from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import { AppError } from '../middleware/error.middleware'

interface SendEmailInput {
  to: string
  subject: string
  html: string
  text: string
}

class EmailService {
  private transporter: Transporter | null = null

  isConfigured(): boolean {
    return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
  }

  private getTransporter(): Transporter {
    if (!this.isConfigured()) {
      throw new AppError('Gmail is not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD.', 500)
    }

    if (!this.transporter) {
      const smtpOptions: SMTPTransport.Options & { family: number } = {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        family: 4,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      }
      this.transporter = nodemailer.createTransport(smtpOptions as SMTPTransport.Options)
    }

    return this.transporter
  }

  async sendEmail({ to, subject, html, text }: SendEmailInput): Promise<void> {
    const from = process.env.GMAIL_FROM || `Daily Orbit <${process.env.GMAIL_USER}>`
    const transporter = this.getTransporter()

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text
    })
  }
}

export default new EmailService()
