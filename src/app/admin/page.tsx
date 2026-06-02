'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function AdminPage() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any)?.role || session.user.role
      if (role === 'admin') {
        // Use window.location.href for a reliable full page navigation
        window.location.href = '/admin/dashboard'
        return
      }
    }
    // If not admin, redirect to home
    window.location.href = '/'
  }, [status, session])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/80">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Memuat...</p>
      </div>
    </div>
  )
}
