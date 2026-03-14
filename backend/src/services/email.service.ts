import nodemailer, { Transporter } from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import dns from 'node:dns'
import { AppError } from '../middleware/error.middleware'

interface SendEmailInput {
  to: string
  subject: string
  html: string
  text: string
}

class EmailService {
  isConfigured(): boolean {
    return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
  }

  private async resolveSmtpHosts(): Promise<string[]> {
    try {
      const addresses = await dns.promises.lookup('smtp.gmail.com', { family: 4, all: true })
      const uniqueAddresses = Array.from(new Set(addresses.map((item) => item.address).filter(Boolean)))

      if (uniqueAddresses.length > 0) {
        return uniqueAddresses
      }
    } catch {
      // fall through to hostname fallback
    }

    return ['smtp.gmail.com']
  }

  private createTransporter(host: string, port: number, secure: boolean): Transporter {
    const smtpOptions: SMTPTransport.Options = {
      host,
      port,
      secure,
      connectionTimeout: 12000,
      greetingTimeout: 12000,
      socketTimeout: 20000,
      tls: {
        servername: 'smtp.gmail.com'
      },
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    }

    return nodemailer.createTransport(smtpOptions)
  }

  private async getTransporters(): Promise<Array<{ label: string; client: Transporter }>> {
    if (!this.isConfigured()) {
      throw new AppError('Gmail is not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD.', 500)
    }

    const hosts = await this.resolveSmtpHosts()
    const selectedHosts = hosts.slice(0, 3)

    const transporters: Array<{ label: string; client: Transporter }> = []

    for (const host of selectedHosts) {
      transporters.push({
        label: `${host}:587`,
        client: this.createTransporter(host, 587, false)
      })

      transporters.push({
        label: `${host}:465`,
        client: this.createTransporter(host, 465, true)
      })
    }

    return transporters
  }

  async sendEmail({ to, subject, html, text }: SendEmailInput): Promise<void> {
    const from = process.env.GMAIL_FROM || `Daily Orbit <${process.env.GMAIL_USER}>`
    const transporters = await this.getTransporters()
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
