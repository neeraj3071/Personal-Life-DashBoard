'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import AppShell from '@/components/AppShell'

interface PageContainerProps {
  title: string
  subtitle: string
  children: React.ReactNode
  actions?: React.ReactNode
}

export default function PageContainer({ title, subtitle, children, actions }: PageContainerProps) {
  return (
    <ProtectedRoute>
      <AppShell title={title} subtitle={subtitle} actions={actions}>
        {children}
      </AppShell>
    </ProtectedRoute>
  )
}
