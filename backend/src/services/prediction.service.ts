import { z } from 'zod'

type InsightConfidence = 'low' | 'medium' | 'high'

interface PredictionTargets {
  sleepHours: number
  workoutSessions: number
  workoutMinutes: number
  weeklySpending: number
  habitCompletion: number
  mood: number
}

interface BaseForecastInput {
  readinessScore: number
  confidence: InsightConfidence
  trendDelta: number
  narrative: string
  strengths: string[]
  risks: string[]
  actions: string[]
  scoreHistory: Array<{
    date: string
    score: number
  }>
}

interface PredictionInput {
  targets: PredictionTargets
  baseForecast: BaseForecastInput
  recentSummary: {
    avgSleep: number | null
    avgMood: number | null
    avgSpending: number
    avgWorkoutMinutes: number
    avgHabitCompletion: number
    activeDays: number
  }
  correlations: Array<{
    title: string
    summary: string
    impact: string
  }>
  streakDays: number
}

interface PredictionResult {
  readinessScore: number
  confidence: InsightConfidence
  narrative: string
  strengths: string[]
  risks: string[]
  actions: string[]
  model: string | null
}

const geminiForecastSchema = z.object({
  readinessScore: z.coerce.number().min(0).max(100),
  confidence: z.enum(['low', 'medium', 'high']),
  narrative: z.string().min(20).max(320),
  strengths: z.array(z.string().min(3).max(120)).max(3),
  risks: z.array(z.string().min(3).max(120)).max(3),
  actions: z.array(z.string().min(3).max(160)).max(3)
})

const stripCodeFences = (value: string): string => {
  return value
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()
}

class PredictionService {
  async generateForecast(input: PredictionInput): Promise<PredictionResult | null> {
    const apiKey = process.env.GEMINI_API_KEY
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

    if (!apiKey) {
      return null
    }

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)

      const prompt = [
        'You are a personal performance forecasting engine for a quantified-self dashboard.',
        'Given the structured metrics, predict next-day readiness and provide concise coaching.',
        'Return JSON only with keys: readinessScore, confidence, narrative, strengths, risks, actions.',
        'Do not mention being an AI model or speculate beyond provided data.',
        'Keep strengths, risks, and actions short and actionable.',
        JSON.stringify(input)
      ].join('\n')

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            generationConfig: {
              temperature: 0.3,
              responseMimeType: 'application/json'
            },
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ]
          }),
          signal: controller.signal
        }
      )

      clearTimeout(timeout)

      if (!response.ok) {
        return null
      }

      const payload = (await response.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              text?: string
            }>
          }
        }>
      }

      const rawText = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('')
      if (!rawText) {
        return null
      }

      const parsed = geminiForecastSchema.parse(JSON.parse(stripCodeFences(rawText)))

      return {
        readinessScore: parsed.readinessScore,
        confidence: parsed.confidence,
        narrative: parsed.narrative,
        strengths: parsed.strengths,
        risks: parsed.risks,
        actions: parsed.actions,
        model
      }
    } catch {
      return null
    }
  }
}

export default new PredictionService()