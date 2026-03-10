import { Request, Response, NextFunction } from 'express'
import authService from '../services/auth.service'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = registerSchema.parse(req.body)
      const result = await authService.register(name, email, password)

      res.status(201).json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body)
      const result = await authService.login(email, password)

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new AuthController()
