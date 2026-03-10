import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import prisma from '../utils/prisma'
import { AppError } from '../middleware/error.middleware'

export class AuthService {
  async register(name: string, email: string, password: string) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      throw new AppError('User already exists', 400)
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
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
    })

    // Generate JWT
    const token = this.generateToken(user.id)

    return { user, token }
  }

  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      throw new AppError('Invalid credentials', 401)
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      throw new AppError('Invalid credentials', 401)
    }

    // Generate JWT
    const token = this.generateToken(user.id)

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    }
  }

  private generateToken(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500)
    }

    const jwtExpires = process.env.JWT_EXPIRES_IN || '7d'
    return jwt.sign({ userId }, jwtSecret, { expiresIn: jwtExpires } as any)
  }
}

export default new AuthService()
