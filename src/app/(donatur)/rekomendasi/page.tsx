'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DonaturNav } from '@/components/polines/donatur/donatur-navbar'
import { TabRekomendasi } from '@/components/polines/donatur/tab-rekomendasi'
import type { Campaign, RecommendedCampaign } from '@/components/polines/types'

export default function RekomendasiPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [recommendations, setRecommendations] = useState({
    personalized: [] as RecommendedCampaign[],
    trending: [] as RecommendedCampaign[],
    becauseYouLiked: [] as RecommendedCampaign[],
  })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status])

  useEffect(() => {
    if (!session?.user) return
    fetch('/api/recommendations').then(r => r.json()).then(d =>
      setRecommendations({
        personalized: d.personalized || [],
        trending: d.trending || [],
        becauseYouLiked: d.becauseYouLiked || [],
      })
    )
  }, [session])

  const openDonationModal = (campaign: Campaign) => {
    router.push(`/donasi`) // redirect ke halaman donasi
    toast.info('Pilih campaign di halaman donasi')
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <DonaturNav />
      <TabRekomendasi recommendations={recommendations} openDonationModal={openDonationModal} />
    </div>
  )
}