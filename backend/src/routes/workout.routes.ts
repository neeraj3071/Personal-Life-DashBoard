import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware'
import workoutController from '../controllers/workout.controller'

const router = Router()

router.use(authMiddleware)

router.get('/', workoutController.getWorkouts.bind(workoutController))
router.post('/', workoutController.createWorkout.bind(workoutController))

export default router
