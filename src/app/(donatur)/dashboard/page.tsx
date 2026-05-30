'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DonaturNav } from '@/components/polines/donatur/donatur-navbar'
import { TabDashboard } from '@/components/polines/donatur/tab-dashboard'
import type { Campaign, Donation } from '@/components/polines/types'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [userDonations, setUserDonations] = useState<Donation[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (session?.user?.role === 'admin') router.push('/admin/dashboard')
  }, [status, session])

  useEffect(() => {
    fetch('/api/campaigns?status=active')
      .then(r => r.json()).then(d => setCampaigns(d.campaigns || []))
    if (session?.user) {
      fetch('/api/donations').then(r => r.json()).then(d =>
        setUserDonations((d.donations || []).filter((x: Donation) => x.userId === session.user.id))
      )
    }
  }, [session])

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
  </div>

  return (
    <div className="container mx-auto px-4 py-6">
      <DonaturNav />
      <TabDashboard session={session} userDonations={userDonations} campaigns={campaigns} />
    </div>
  )
}