'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { DonaturNav } from '@/components/polines/donatur/donatur-navbar'
import { TabRekomendasi } from '@/components/polines/donatur/tab-rekomendasi'
import { DonationModal } from '@/components/polines/donatur/donation-modal'
import { CampaignDetailModal } from '@/components/polines/donatur/campaign-detail-modal'
import type { Campaign, Donation, RecommendedCampaign } from '@/components/polines/types'

export default function RekomendasiPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [recommendations, setRecommendations] = useState({
    personalized: [] as RecommendedCampaign[],
    trending: [] as RecommendedCampaign[],
    becauseYouLiked: [] as RecommendedCampaign[],
  })

  // ── TAMBAHAN: data campaign lengkap, dipakai khusus untuk DonationModal ──
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  const [donationModalOpen, setDonationModalOpen] = useState(false)
  const [donationStep, setDonationStep] = useState(1)
  const [donationForm, setDonationForm] = useState({
    campaignId: '', type: 'uang', amount: '', paymentMethod: 'transfer', message: '', proofUrl: ''
  })
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [campaignDetailModalOpen, setCampaignDetailModalOpen] = useState(false)
  const [campaignDonations, setCampaignDonations] = useState<Donation[]>([])
  const [submitting, setSubmitting] = useState(false)

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

  // ── TAMBAHAN: fetch data campaign lengkap, sama persis kayak di donasi/page.tsx ──
  useEffect(() => {
    if (!session?.user) return
    fetch('/api/campaigns?status=active')
      .then(r => r.json()).then(d => setCampaigns(d.campaigns || []))
  }, [session])

  const openDonationModal = (campaign?: Campaign) => {
    setSelectedCampaign(campaign || null)
    setDonationForm({ campaignId: campaign?.id || '', type: 'uang', amount: '', paymentMethod: 'transfer', message: '', proofUrl: '' })
    setDonationStep(1)
    setDonationModalOpen(true)
  }

  const submitDonation = async (overrides?: {
    amount?: number
    itemName?: string
    itemQuantity?: number
    senderAddress?: string
  }) => {
    if (!session?.user) { toast.error('Silakan masuk terlebih dahulu'); return }

    const finalAmount = overrides?.amount ?? Number(donationForm.amount)
    if (!finalAmount || finalAmount <= 0) { toast.error('Masukkan nominal yang valid'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/donations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: donationForm.campaignId,
          amount: finalAmount,
          donorName: session.user.name,
          donorEmail: session.user.email,
          type: donationForm.type,
          paymentMethod: overrides ? 'tunai' : donationForm.paymentMethod,
          message: donationForm.message,
          proofUrl: donationForm.proofUrl || undefined,
          itemName: overrides?.itemName ?? null,
          itemQuantity: overrides?.itemQuantity ?? null,
          senderAddress: overrides?.senderAddress ?? null,
        })
      })
      if (res.ok) {
        setDonationStep(3); toast.success('Donasi berhasil dikirim!')
        fetch('/api/recommendations').then(r => r.json()).then(d =>
          setRecommendations({
            personalized: d.personalized || [],
            trending: d.trending || [],
            becauseYouLiked: d.becauseYouLiked || [],
          })
        )
        fetch('/api/campaigns?status=active').then(r => r.json()).then(d => setCampaigns(d.campaigns || []))
      } else { const d = await res.json(); toast.error(d.error || 'Gagal') }
    } catch { toast.error('Terjadi kesalahan') }
    finally { setSubmitting(false) }
  }

  const fetchCampaignDetail = useCallback(async (id: string) => {
    const [campRes, donRes] = await Promise.all([
      fetch(`/api/campaigns/${id}`), fetch(`/api/donations?campaignId=${id}`)
    ])
    if (campRes.ok) { const d = await campRes.json(); setSelectedCampaign(d.campaign); setCampaignDetailModalOpen(true) }
    if (donRes.ok) { const d = await donRes.json(); setCampaignDonations(d.donations || []) }
  }, [])

  return (
    <div className="container mx-auto px-4 py-6">
      <DonaturNav />
      <TabRekomendasi
        recommendations={recommendations as any}
        openDonationModal={openDonationModal}
        fetchCampaignDetail={fetchCampaignDetail}
      />
      <DonationModal open={donationModalOpen}
        onClose={() => { setDonationModalOpen(false); setDonationStep(1) }}
        donationStep={donationStep} setDonationStep={setDonationStep}
        donationForm={donationForm} setDonationForm={setDonationForm}
        campaigns={campaigns} submitting={submitting}
        submitDonation={submitDonation} session={session} />
      <CampaignDetailModal open={campaignDetailModalOpen}
        onClose={() => { setCampaignDetailModalOpen(false); setSelectedCampaign(null) }}
        selectedCampaign={selectedCampaign} campaignDonations={campaignDonations}
        onDonate={() => { if (selectedCampaign) openDonationModal(selectedCampaign) }} />
    </div>
  )
}