'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DonaturNav } from '@/components/polines/donatur/donatur-navbar'
import { AjuanForm } from '@/components/polines/donatur/ajuan-form'

export default function AjuanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  return (
    <div className="container mx-auto px-4 py-6">
      <DonaturNav />
      <AjuanForm session={session} />
    </div>
  )
}