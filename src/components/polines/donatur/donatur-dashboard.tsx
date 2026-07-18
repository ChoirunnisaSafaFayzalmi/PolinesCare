'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HandHeart, ClipboardList, Star, UserCircle, Megaphone } from 'lucide-react'
import type { Campaign, Donation, RecommendedCampaign } from '@/components/polines/types'
import { TabDashboard } from '@/components/polines/donatur/tab-dashboard'
import { TabDonasi } from '@/components/polines/donatur/tab-donasi'
import { TabRiwayat } from '@/components/polines/donatur/tab-riwayat'
import { TabRekomendasi } from '@/components/polines/donatur/tab-rekomendasi'
import { TabAjuan, useProposals } from '@/components/polines/donatur/tab-ajuan'
import { ProfilDonatur } from '@/components/polines/donatur/tab-profil'
import { DonationModal } from '@/components/polines/donatur/donation-modal'
import { CampaignDetailModal } from '@/components/polines/donatur/campaign-detail-modal'

interface DonaturDashboardProps {
  defaultTab?: string
}

export function DonaturDashboard({ defaultTab = 'dashboard' }: DonaturDashboardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlTab = searchParams.get('tab')
  const proposalIdFromUrl = searchParams.get('proposalId')
  const donationIdFromUrl = searchParams.get('donationId')

  const tabKey = `${defaultTab}:${urlTab ?? ''}`
  const [activeTab, setActiveTab] = useState(urlTab || defaultTab)
  const [prevTabKey, setPrevTabKey] = useState(tabKey)
  if (tabKey !== prevTabKey) {
    setPrevTabKey(tabKey)
    setActiveTab(urlTab || defaultTab)
  }

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [userDonations, setUserDonations] = useState<Donation[]>([])


  // ── Ajuan/Proposal: diangkat ke sini biar TabDashboard & TabAjuan share data yang sama ──
  const {
    proposals,
    loading: proposalsLoading,
    error: proposalsError,
    refetch: refetchProposals,
  } = useProposals(session)

  // ── State recommendations: Disesuaikan jadi 3 section utama ──

  // ── State recommendations: 3 section utama ──

  const [recommendations, setRecommendations] = useState<{
    personalized: RecommendedCampaign[]
    becauseYouLiked: RecommendedCampaign[]
    collaborative: RecommendedCampaign[]
  }>({ personalized: [], becauseYouLiked: [], collaborative: [] })

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const [donationModalOpen, setDonationModalOpen] = useState(false)
  const [donationStep, setDonationStep] = useState(1)
  const [donationForm, setDonationForm] = useState({
    campaignId: '', type: 'uang', amount: '', paymentMethod: 'transfer', message: '', proofUrl: ''
  })
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [campaignDetailModalOpen, setCampaignDetailModalOpen] = useState(false)
  const [campaignDonations, setCampaignDonations] = useState<Donation[]>([])
  const [submitting, setSubmitting] = useState(false)

  // ── Auth Guard ──
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (session?.user?.role === 'admin') router.push('/admin/dashboard')
  }, [status, session, router])


  // ── Sync tab jika defaultTab atau urlTab berubah ──
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern, aman
    setActiveTab(urlTab || defaultTab)
  }, [defaultTab, urlTab])

  // ── Fetch Campaigns ──
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns?status=active')
      if (res.ok) { const d = await res.json(); setCampaigns(d.campaigns || []) }
    } catch { /* silent */ }
  }, [])

  // ── Fetch Donasi User ──
  const fetchUserDonations = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      const res = await fetch('/api/donations')
      if (res.ok) {
        const d = await res.json()
        setUserDonations((d.donations || []).filter((x: Donation) => x.userId === session.user.id))
      }
    } catch { /* silent */ }
  }, [session])

  const fetchRecommendations = useCallback(async () => {
    if (!session?.user?.id) return
    try {
      const res = await fetch('/api/recommendations')
      if (res.ok) {
        const d = await res.json()
        console.log('[DEBUG] full API response:', JSON.stringify(d, null, 2)) // ← tambah ini
        setRecommendations({
          personalized:    d.personalized    || [],
          becauseYouLiked: d.becauseYouLiked || [],
          collaborative:   d.collaborative   || [],
        })
      }
    } catch { /* silent */ }
  }, [session?.user?.id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern, aman
    fetchCampaigns()
  }, [fetchCampaigns])

  useEffect(() => {
    if (session?.user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern, aman
      fetchUserDonations()
      fetchRecommendations()
    }
  }, [session?.user, fetchUserDonations, fetchRecommendations])

  // ── Donation ──
  const openDonationModal = async (campaign?: Campaign) => {
    if (!session?.user) { toast.error('Silakan masuk terlebih dahulu'); return }
    if (!donationForm.campaignId) { toast.error('Pilih campaign terlebih dahulu'); return }
    if (!donationForm.amount || Number(donationForm.amount) <= 0) { toast.error('Masukkan nominal yang valid'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId:    donationForm.campaignId,
          amount:        Number(donationForm.amount),
          donorName:     session.user.name,
          donorEmail:    session.user.email,
          donorPhone:    (session.user as any)?.phone || '-',
          type:          donationForm.type,
          paymentMethod: donationForm.paymentMethod,
          message:       donationForm.message,
          proofUrl:      donationForm.proofUrl || undefined,
        }),
      })
      if (res.ok) {
        setDonationStep(3)
        toast.success('Donasi berhasil dikirim!')
        fetchCampaigns(); fetchUserDonations(); fetchRecommendations()
      } else {
        const d = await res.json()
        toast.error(d.error || 'Gagal mengirim donasi')
      }
    } catch { toast.error('Terjadi kesalahan') }
    finally { setSubmitting(false) }
  }

  const fetchCampaignDetail = useCallback(async (id: string) => {
    try {
      const [campRes, donRes] = await Promise.all([
        fetch(`/api/campaigns/${id}`),
        fetch(`/api/donations?campaignId=${id}`),
      ])
      if (campRes.ok) { const d = await campRes.json(); setSelectedCampaign(d.campaign); setCampaignDetailModalOpen(true) }
      if (donRes.ok)  { const d = await donRes.json();  setCampaignDonations(d.donations || []) }
    } catch { toast.error('Gagal memuat detail campaign') }
  }, [])

  // ── Navigasi dari Dashboard ke detail ajuan tertentu di tab Ajuan ──
  const handleViewProposal = (id: string) => {
    router.push(`?tab=ajuan&proposalId=${id}`)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    )
  }

  function submitDonation(overrides?: { amount?: number | undefined; itemName?: string | undefined; itemQuantity?: number | undefined; senderAddress?: string | undefined } | undefined): void {
    throw new Error('Function not implemented.')
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1 bg-white border p-1">
            <TabsTrigger value="donasi"
              className="text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <HandHeart className="h-4 w-4 mr-1.5" /> Donasi
            </TabsTrigger>
            <TabsTrigger value="riwayat"
              className="text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <ClipboardList className="h-4 w-4 mr-1.5" /> Riwayat
            </TabsTrigger>
            <TabsTrigger value="rekomendasi"
              className="text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <Star className="h-4 w-4 mr-1.5" /> Rekomendasi
            </TabsTrigger>
            <TabsTrigger value="ajuan"
              className="text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <Megaphone className="h-4 w-4 mr-1.5" /> Ajuan
            </TabsTrigger>
            <TabsTrigger value="profil"
              className="text-sm data-[state=active]:bg-teal-600 data-[state=active]:text-white">
              <UserCircle className="h-4 w-4 mr-1.5" /> Profil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <TabDashboard
              session={session}
              userDonations={userDonations}
              campaigns={campaigns}
              proposals={proposals}
              proposalsLoading={proposalsLoading}
              onViewProposal={handleViewProposal}
            />
          </TabsContent>

          <TabsContent value="donasi">
            <TabDonasi
              campaigns={campaigns}
              search={search} setSearch={setSearch}
              category={category} setCategory={setCategory}
              openDonationModal={openDonationModal}
              fetchCampaignDetail={fetchCampaignDetail}
            />
          </TabsContent>

          <TabsContent value="riwayat">
            <TabRiwayat userDonations={userDonations} highlightDonationId={donationIdFromUrl ?? undefined} />
          </TabsContent>

          <TabsContent value="rekomendasi">
            <TabRekomendasi
              recommendations={recommendations}
              openDonationModal={openDonationModal}
              fetchCampaignDetail={fetchCampaignDetail}
            />
          </TabsContent>

          <TabsContent value="ajuan">
            <TabAjuan
              session={session}
              initialProposalId={proposalIdFromUrl ?? undefined}
              proposals={proposals}
              loading={proposalsLoading}
              error={proposalsError}
              refetch={refetchProposals}
            />
          </TabsContent>

          <TabsContent value="profil">
            <ProfilDonatur session={session} userDonations={userDonations} />
          </TabsContent>
        </Tabs>
      </div>

      <DonationModal
        open={donationModalOpen}
        onClose={() => { setDonationModalOpen(false); setDonationStep(1) }}
        donationStep={donationStep} setDonationStep={setDonationStep}
        donationForm={donationForm} setDonationForm={setDonationForm}
        campaigns={campaigns} submitting={submitting}
        submitDonation={submitDonation} session={session}
      />
      <CampaignDetailModal
        open={campaignDetailModalOpen}
        onClose={() => { setCampaignDetailModalOpen(false); setSelectedCampaign(null) }}
        selectedCampaign={selectedCampaign}
        campaignDonations={campaignDonations}
        onDonate={() => { if (selectedCampaign) openDonationModal(selectedCampaign) }}

        
      />
    </div>
  )
}