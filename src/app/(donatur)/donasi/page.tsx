'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { DonaturNav } from '@/components/polines/donatur/donatur-navbar'
import { TabDonasi } from '@/components/polines/donatur/tab-donasi'
import { DonationModal } from '@/components/polines/donatur/donation-modal'
import { CampaignDetailModal } from '@/components/polines/donatur/campaign-detail-modal'
import type { Campaign, Donation } from '@/components/polines/types'

export default function DonasiPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
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

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (session?.user?.role === 'admin') router.push('/admin/dashboard')
  }, [status, session])

  useEffect(() => {
  const fetchCampaigns = () => {
    fetch('/api/campaigns?status=active')
      .then(r => r.json()).then(d => setCampaigns(d.campaigns || []))
  }

  fetchCampaigns() // fetch pertama saat mount

  // Polling setiap 15 detik agar progress donasi (collectedAmount) selalu up-to-date
  const interval = setInterval(fetchCampaigns, 15000)
  return () => clearInterval(interval)
}, [])

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
        //donorPhone: (session.user as any)?.phone || '',
        type: donationForm.type,
        paymentMethod: overrides ? 'tunai' : donationForm.paymentMethod,
        message: donationForm.message,
        proofUrl: donationForm.proofUrl || undefined,
        // field barang
        itemName: overrides?.itemName ?? null,
        itemQuantity: overrides?.itemQuantity ?? null,
        senderAddress: overrides?.senderAddress ?? null,
      })
    })
    if (res.ok) {
      setDonationStep(3); toast.success('Donasi berhasil dikirim!')
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
      <TabDonasi campaigns={campaigns} search={search} setSearch={setSearch}
        category={category} setCategory={setCategory}
        openDonationModal={openDonationModal} fetchCampaignDetail={fetchCampaignDetail} />
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