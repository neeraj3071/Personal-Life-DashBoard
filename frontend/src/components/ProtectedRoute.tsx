'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

const subscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const hasHydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)

  useEffect(() => {
    if (hasHydrated && !isLoading && !user) {
      router.push('/auth/login')
    }
  }, [hasHydrated, user, isLoading, router])

  if (!hasHydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
