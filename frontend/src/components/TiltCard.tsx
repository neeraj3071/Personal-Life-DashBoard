'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface TiltCardProps {
  children: React.ReactNode
  className?: string
  intensity?: number
}

interface TiltState {
  x: number
  y: number
}

export default function TiltCard({ children, className, intensity = 14 }: TiltCardProps) {
  const [tilt, setTilt] = useState<TiltState>({ x: 0, y: 0 })

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const offsetX = (event.clientX - rect.left) / rect.width
    const offsetY = (event.clientY - rect.top) / rect.height

    const y = (offsetX - 0.5) * intensity
    const x = (0.5 - offsetY) * intensity

    setTilt({ x, y })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  return (
    <div className="tilt-card-perspective" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
      <div
        className={cn('tilt-card-surface', className)}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
        }}
      >
        <div className="tilt-card-glow" />
        {children}
      </div>
    </div>
  )
}
