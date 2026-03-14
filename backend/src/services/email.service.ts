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
  private transporters: Array<{ label: string; client: Transporter }> | null = null

  isConfigured(): boolean {
    return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
  }

  private getTransporters(): Array<{ label: string; client: Transporter }> {
    if (!this.isConfigured()) {
      throw new AppError('Gmail is not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD.', 500)
    }

    if (!this.transporters) {
      const candidateOptions: Array<{ label: string; options: SMTPTransport.Options }> = [
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
      ]

      this.transporters = candidateOptions.map((candidate) => ({
        label: candidate.label,
        client: nodemailer.createTransport(candidate.options)
      }))
    }

    return this.transporters
  }

  async sendEmail({ to, subject, html, text }: SendEmailInput): Promise<void> {
    const from = process.env.GMAIL_FROM || `Daily Orbit <${process.env.GMAIL_USER}>`
    const transporters = this.getTransporters()
    const errors: string[] = []

    for (const transporter of transporters) {
      try {
        await transporter.client.sendMail({
          from,
          to,
          subject,
          html,
          text
        })

        return
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`${transporter.label} -> ${message}`)
      }
    }

    throw new AppError(`Failed to send email with all SMTP transports. ${errors.join(' | ')}`, 500)
  }
}

export default new EmailService()
