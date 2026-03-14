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

type EmailProvider = 'resend' | 'smtp'

class EmailService {
  private hasResendConfig(): boolean {
    return Boolean(process.env.RESEND_API_KEY)
  }

  private hasSmtpConfig(): boolean {
    return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
  }

  private getPreferredProvider(): EmailProvider | null {
    const provider = process.env.EMAIL_PROVIDER?.trim().toLowerCase()

    if (provider === 'resend' || provider === 'smtp') {
      return provider
    }

    return null
  }

  private getProviderOrder(): EmailProvider[] {
    const preferredProvider = this.getPreferredProvider()

    if (preferredProvider === 'resend') {
      return ['resend', 'smtp']
    }

    if (preferredProvider === 'smtp') {
      return ['smtp', 'resend']
    }

    if (this.hasResendConfig()) {
      return ['resend', 'smtp']
    }

    return ['smtp']
  }

  getProviderDiagnostics() {
    const preferredProvider = this.getPreferredProvider() || 'auto'

    return {
      preferredProvider,
      providerOrder: this.getProviderOrder(),
      resendConfigured: this.hasResendConfig(),
      smtpConfigured: this.hasSmtpConfig()
    }
  }

  isConfigured(): boolean {
    return this.hasResendConfig() || this.hasSmtpConfig()
  }

  private getFromAddress(): string {
    const configuredFrom = process.env.EMAIL_FROM || process.env.RESEND_FROM || process.env.GMAIL_FROM

    if (configuredFrom) {
      return configuredFrom
    }

    if (process.env.GMAIL_USER) {
      return `Daily Orbit <${process.env.GMAIL_USER}>`
    }

    return 'Daily Orbit <onboarding@resend.dev>'
  }

  private async sendWithResend({ to, subject, html, text }: SendEmailInput, from: string): Promise<void> {
    const resendApiKey = process.env.RESEND_API_KEY

    if (!resendApiKey) {
      throw new AppError('Resend is not configured. Please set RESEND_API_KEY.', 500)
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text
        }),
        signal: controller.signal
      })

      const responseBody = await response.text()

      if (!response.ok) {
        let errorDetail = responseBody || 'Unknown error'

        try {
          const parsed = JSON.parse(responseBody) as { message?: string; error?: string; name?: string }
          errorDetail = parsed.message || parsed.error || parsed.name || responseBody
        } catch {
          // keep raw responseBody
        }

        throw new AppError(`Resend API error (${response.status}): ${errorDetail}`, 500)
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new AppError(`Resend request failed: ${message}`, 500)
    } finally {
      clearTimeout(timeout)
    }
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

  private async getSmtpTransporters(): Promise<Array<{ label: string; client: Transporter }>> {
    if (!this.hasSmtpConfig()) {
      throw new AppError('SMTP is not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD.', 500)
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

  private async sendWithSmtp({ to, subject, html, text }: SendEmailInput, from: string): Promise<void> {
    const transporters = await this.getSmtpTransporters()
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

    throw new AppError(`SMTP send failed across all transports. ${errors.join(' | ')}`, 500)
  }

  async sendEmail(input: SendEmailInput): Promise<void> {
    if (!this.isConfigured()) {
      throw new AppError('No email provider configured. Set RESEND_API_KEY or Gmail SMTP credentials.', 500)
    }

    const from = this.getFromAddress()
    const providerOrder = this.getProviderOrder()
    const errors: string[] = []

    for (const provider of providerOrder) {
      try {
        if (provider === 'resend') {
          await this.sendWithResend(input, from)
        } else {
          await this.sendWithSmtp(input, from)
        }

        return
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`${provider} -> ${message}`)
      }
    }

    throw new AppError(`Failed to send email. ${errors.join(' | ')}`, 500)
  }
}

export default new EmailService()
