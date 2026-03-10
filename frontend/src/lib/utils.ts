import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function calculateDuration(start: Date | string, end: Date | string): number {
  const startTime = new Date(start).getTime()
  const endTime = new Date(end).getTime()
  return Math.abs(endTime - startTime) / (1000 * 60 * 60)  // hours
}

export function getWeekDates(): Date[] {
  const dates: Date[] = []
  const today = new Date()
  const currentDay = today.getDay()
  const diff = today.getDate() - currentDay

  for (let i = 0; i < 7; i++) {
    const date = new Date(today.setDate(diff + i))
    dates.push(new Date(date))
  }
  
  return dates
}
