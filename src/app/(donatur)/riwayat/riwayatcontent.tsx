'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DonaturNav } from '@/components/polines/donatur/donatur-navbar'
import { TabRiwayat } from '@/components/polines/donatur/tab-riwayat'
import type { Donation } from '@/components/polines/types'

export default function RiwayatContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userDonations, setUserDonations] = useState<Donation[]>([])

  const searchParams = useSearchParams()
  const donationIdFromUrl = searchParams.get('donationId')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (!session?.user) return

    fetch('/api/donations')
      .then(r => r.json())
      .then(d =>
        setUserDonations(
          (d.donations || []).filter(
            (x: Donation) => x.userId === session.user.id
          )
        )
      )
  }, [session])

  return (
    <div className="container mx-auto px-4 py-6">
      <DonaturNav />
      <TabRiwayat
        userDonations={userDonations}
        highlightDonationId={donationIdFromUrl ?? undefined}
      />
    </div>
  )
}