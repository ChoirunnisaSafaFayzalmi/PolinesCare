'use client'

import React, { useState, useEffect, useCallback, use } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Types & Helpers
import type { Campaign, Donation, Proposal, AppNotification, FundUsage, PlatformStats } from '@/components/polines/types'

// Components
import { AdminDashboard } from '@/components/polines/admin-dashboard'
import { CampaignFormModal } from '@/components/polines/admin/campaign-form-modal'
import { FundUsageModal } from '@/components/polines/fund-usage-modal'

// ============================================================
// URL → State mapping
// ============================================================
const VALID_TABS = ['dashboard', 'campaign', 'donasi', 'laporan', 'notifikasi'] as const

function parseSlug(slug: string[]) {
  const segments = (slug || []).filter(Boolean)
  const first = segments[0] || 'dashboard'
  const tab = VALID_TABS.includes(first as any) ? first : 'dashboard'
  const campaignSubTab = (first === 'campaign' && segments[1] === 'ajuan') ? 'ajuan' : 'campaigns'
  return { tab, campaignSubTab }
}

// ============================================================
// Helper: build URL path from tab + sub-tab
// ============================================================
function buildAdminPath(tab: string, campaignSubTab?: string) {
  if (tab === 'campaign' && campaignSubTab === 'ajuan') return '/admin/campaign/ajuan'
  if (tab === 'dashboard') return '/admin/dashboard'
  return `/admin/${tab}`
}

// ============================================================
// ADMIN CATCH-ALL PAGE
// ============================================================
export default function AdminSlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = use(params)

  // Parse initial state from URL
  const { tab: initialTab, campaignSubTab: initialCampaignSubTab } = parseSlug(slug || [])

  const { data: session, status: sessionStatus } = useSession()

  // ---- UI States ----
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)

  // ---- Tab States (synced with URL) ----
  const [adminTab, setAdminTabState] = useState(initialTab)
  const [adminCampaignSubTab, setAdminCampaignSubTabState] = useState(initialCampaignSubTab)

  // ---- Data States ----
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [fundUsages, setFundUsages] = useState<FundUsage[]>([])

  // ---- Filter States ----
  const [adminCampaignFilter, setAdminCampaignFilter] = useState('all')
  const [adminCampaignStatus, setAdminCampaignStatus] = useState('all')
  const [donationFilter, setDonationFilter] = useState('all')
  const [reportCampaignId, setReportCampaignId] = useState('')

  // ============================================================
  // NAVIGATION: use pushState for instant URL changes (no remount)
  // ============================================================
  const navigateAdminTab = useCallback((tab: string) => {
    setAdminTabState(tab)
    setAdminCampaignSubTabState('campaigns') // reset sub-tab
    const path = buildAdminPath(tab)
    window.history.pushState({ adminTab: tab, adminCampaignSubTab: 'campaigns' }, '', path)
  }, [])

  const navigateCampaignSubTab = useCallback((subTab: string) => {
    setAdminCampaignSubTabState(subTab)
    const path = buildAdminPath(adminTab, subTab)
    window.history.pushState({ adminTab, adminCampaignSubTab: subTab }, '', path)
  }, [adminTab])

  // ============================================================
  // Handle browser back/forward (popstate)
  // ============================================================
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      const slugSegments = path.replace('/admin/', '').split('/').filter(Boolean)
      const { tab, campaignSubTab } = parseSlug(slugSegments)
      setAdminTabState(tab)
      setAdminCampaignSubTabState(campaignSubTab)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Sync URL on first mount in case pushState was used before
  useEffect(() => {
    const currentPath = window.location.pathname
    const expectedPath = buildAdminPath(adminTab, adminCampaignSubTab)
    if (currentPath !== expectedPath) {
      window.history.replaceState({}, '', expectedPath)
    }
  }, []) // only on mount

  // ---- Modal States ----
  const [campaignFormModalOpen, setCampaignFormModalOpen] = useState(false)
  const [fundUsageModalOpen, setFundUsageModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ---- Campaign Form State ----
  const [campaignForm, setCampaignForm] = useState({
    organizerName: '', organizerEmail: '', organizerPhone: '', organizerAddress: '',
    title: '', description: '', category: 'Sosial', targetAmount: '',
    startDate: '', endDate: '', isUrgent: false,
    paymentMethod: 'transfer', accountNumber: '', uniqueCode: ''
  })

  // ---- Fund Usage Form State ----
  const [fundUsageForm, setFundUsageForm] = useState({ campaignId: '', description: '', amount: '' })



  // ============================================================
  // DATA FETCHING
  // ============================================================
  const fetchAllCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns')
      if (res.ok) { const data = await res.json(); setAllCampaigns(data.campaigns || data || []) }
    } catch { /* silent */ }
  }, [])

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns?status=active')
      if (res.ok) { const data = await res.json(); setCampaigns(data.campaigns || data || []) }
    } catch { /* silent */ }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      if (res.ok) {
        const data = await res.json()
        setStats({
          totalCampaigns: data.campaigns?.total ?? 0,
          totalDonations: data.donations?.total ?? 0,
          totalAmount: data.donations?.totalAmount ?? 0,
          totalDonors: data.users?.total ?? 0,
          categoryBreakdown: (data.campaigns?.byCategory || []).map((c: { category: string; _count: number; total: number }) => ({
            category: c.category, count: c._count, total: c.total || 0
          })),
          typeBreakdown: (data.donations?.byType || []).map((t: { type: string; _count: number; total: number }) => ({
            type: t.type, count: t._count, total: t.total || 0
          })),
          recentDonations: data.recentDonations || [],
        })
      }
    } catch { /* silent */ }
  }, [])

  const fetchDonations = useCallback(async () => {
    try {
      const res = await fetch('/api/donations')
      if (res.ok) { const data = await res.json(); setDonations(data.donations || data || []) }
    } catch { /* silent */ }
  }, [])

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) { const data = await res.json(); setNotifications(data.notifications || data || []) }
    } catch { /* silent */ }
  }, [session?.user])

  const fetchProposals = useCallback(async () => {
    try {
      const res = await fetch('/api/proposals')
      if (res.ok) { const data = await res.json(); setProposals(data.proposals || data || []) }
    } catch { /* silent */ }
  }, [])

  const fetchFundUsages = useCallback(async (campaignId: string) => {
    if (!campaignId) { setFundUsages([]); return }
    try {
      const res = await fetch(`/api/fund-usage?campaignId=${campaignId}`)
      if (res.ok) { const data = await res.json(); setFundUsages(data.fundUsages || data || []) }
    } catch { setFundUsages([]) }
  }, [])

  // ---- Load initial data (always fetch fresh since no remounting) ----
  useEffect(() => {
    fetchAllCampaigns(); fetchCampaigns(); fetchStats(); fetchProposals(); fetchDonations(); fetchNotifications()
  }, []) // mount-only

  useEffect(() => {
    if (reportCampaignId) fetchFundUsages(reportCampaignId)
  }, [reportCampaignId, fetchFundUsages])

  // ============================================================
  // AUTH HANDLERS
  // ============================================================
  const handleSignOut = async () => {
    try { await signOut({ redirect: false }) } catch { /* ignore */ }
    toast.success('Berhasil keluar')
    window.location.href = '/'
  }

  // ============================================================
  // CAMPAIGN CRUD (Admin)
  // ============================================================
  const openCampaignForm = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign)
      setCampaignForm({
        organizerName: '', organizerEmail: '', organizerPhone: '', organizerAddress: '',
        title: campaign.title, description: campaign.description, category: campaign.category,
        targetAmount: String(campaign.targetAmount), startDate: campaign.startDate.split('T')[0],
        endDate: campaign.endDate.split('T')[0], isUrgent: campaign.isUrgent,
        paymentMethod: 'transfer', accountNumber: '', uniqueCode: String(campaign.uniqueCode || '')
      })
    } else {
      setEditingCampaign(null)
      setCampaignForm({
        organizerName: '', organizerEmail: '', organizerPhone: '', organizerAddress: '',
        title: '', description: '', category: 'Sosial', targetAmount: '',
        startDate: '', endDate: '', isUrgent: false,
        paymentMethod: 'transfer', accountNumber: '', uniqueCode: ''
      })
    }
    setCampaignFormModalOpen(true)
  }

  const submitCampaign = async () => {
    setSubmitting(true)
    try {
      const body = { ...campaignForm, targetAmount: Number(campaignForm.targetAmount), uniqueCode: Number(campaignForm.uniqueCode) || 0, startDate: new Date(campaignForm.startDate).toISOString(), endDate: new Date(campaignForm.endDate).toISOString() }
      const url = editingCampaign ? `/api/campaigns/${editingCampaign.id}` : '/api/campaigns'
      const method = editingCampaign ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.ok) {
        toast.success(editingCampaign ? 'Campaign berhasil diperbarui' : 'Campaign berhasil dibuat')
        setCampaignFormModalOpen(false); fetchCampaigns(); fetchAllCampaigns(); fetchStats()
      } else { const data = await res.json(); toast.error(data.error || 'Gagal menyimpan campaign') }
    } catch { toast.error('Terjadi kesalahan') }
    finally { setSubmitting(false) }
  }

  const deleteCampaign = async (id: string) => {
    if (!confirm('Yakin ingin menghapus campaign ini?')) return
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Campaign berhasil dihapus'); fetchCampaigns(); fetchAllCampaigns(); fetchStats() }
      else toast.error('Gagal menghapus campaign')
    } catch { toast.error('Terjadi kesalahan') }
  }

  // ============================================================
  // DONATION VERIFICATION (Admin)
  // ============================================================
  const verifyDonation = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/donations/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (res.ok) {
        toast.success(`Donasi berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`)
        fetchDonations(); fetchCampaigns(); fetchAllCampaigns(); fetchStats(); fetchNotifications()
      } else toast.error('Gagal memverifikasi donasi')
    } catch { toast.error('Terjadi kesalahan') }
  }

  // ============================================================
  // PROPOSAL HANDLERS (Admin)
  // ============================================================
  const updateProposalStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (res.ok) { toast.success(`Proposal berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`); fetchProposals(); fetchNotifications() }
      else toast.error('Gagal memperbarui proposal')
    } catch { toast.error('Terjadi kesalahan') }
  }

  const updateProposalCriteria = async (id: string, criteria: Record<string, number>) => {
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...criteria }) })
      if (res.ok) { toast.success('Penilaian proposal berhasil disimpan'); fetchProposals() }
      else toast.error('Gagal menyimpan penilaian')
    } catch { toast.error('Terjadi kesalahan') }
  }

  // ============================================================
  // FUND USAGE HANDLERS (Admin)
  // ============================================================
  const submitFundUsage = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/fund-usage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: fundUsageForm.campaignId, description: fundUsageForm.description, amount: Number(fundUsageForm.amount) })
      })
      if (res.ok) { toast.success('Laporan penggunaan dana berhasil ditambahkan'); setFundUsageModalOpen(false); if (reportCampaignId) fetchFundUsages(reportCampaignId) }
      else toast.error('Gagal menambahkan laporan')
    } catch { toast.error('Terjadi kesalahan') }
    finally { setSubmitting(false) }
  }

  // ============================================================
  // NOTIFICATION HANDLERS
  // ============================================================
  const markNotificationRead = async (id: string) => {
    try {
      await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notificationIds: [id] }) })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch { /* silent */ }
  }

  const markAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ markAll: true }) })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch { /* silent */ }
  }

  // ============================================================
  // COMPUTED VALUES
  // ============================================================
  const unreadCount = notifications.filter(n => !n.isRead).length

  const filteredAdminCampaigns = allCampaigns.filter(c => {
    const matchStatus = adminCampaignStatus === 'all' || c.status === adminCampaignStatus
    const matchCategory = adminCampaignFilter === 'all' || c.category === adminCampaignFilter
    return matchStatus && matchCategory
  })

  const filteredDonations = donations.filter(d => donationFilter === 'all' || d.status === donationFilter)

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/80">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    )
  }

  // ============================================================
  // ACCESS CONTROL: only admin can access this page
  // ============================================================
  const userRole = (session?.user as any)?.role || session?.user?.role
  if (!session?.user || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/80">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-xl font-bold mb-2">Akses Ditolak</h2>
          <p className="text-muted-foreground mb-2">Halaman ini hanya untuk admin.</p>
          {session?.user && <p className="text-xs text-muted-foreground mb-4">Role saat ini: <strong>{userRole}</strong></p>}
          <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => { window.location.href = '/' }}>
            Kembali ke Beranda
          </Button>
        </Card>
      </div>
    )
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50/80" onClick={() => { if (notifDropdownOpen) setNotifDropdownOpen(false) }}>
      <AdminDashboard
        adminTab={adminTab} setAdminTab={navigateAdminTab}
        allCampaigns={allCampaigns} filteredAdminCampaigns={filteredAdminCampaigns}
        filteredDonations={filteredDonations} proposals={proposals}
        notifications={notifications} stats={stats} fundUsages={fundUsages}
        reportCampaignId={reportCampaignId} setReportCampaignId={setReportCampaignId}
        unreadCount={unreadCount}
        adminCampaignFilter={adminCampaignFilter} setAdminCampaignFilter={setAdminCampaignFilter}
        adminCampaignStatus={adminCampaignStatus} setAdminCampaignStatus={setAdminCampaignStatus}
        donationFilter={donationFilter} setDonationFilter={setDonationFilter}
        openCampaignForm={openCampaignForm} deleteCampaign={deleteCampaign}
        verifyDonation={verifyDonation} updateProposalStatus={updateProposalStatus}
        markNotificationRead={markNotificationRead} markAllNotificationsRead={markAllNotificationsRead}
        setFundUsageForm={setFundUsageForm} setFundUsageModalOpen={setFundUsageModalOpen}
        setView={() => { window.location.href = '/' }} handleSignOut={handleSignOut}
        session={session}
        notifDropdownOpen={notifDropdownOpen} setNotifDropdownOpen={setNotifDropdownOpen}
        campaignForm={campaignForm} setCampaignForm={setCampaignForm}
        editingCampaign={editingCampaign} setEditingCampaign={setEditingCampaign}
        submitCampaign={submitCampaign} submitting={submitting}
        donations={donations}
        fundUsageForm={fundUsageForm} submitFundUsage={submitFundUsage}
        updateProposalCriteria={updateProposalCriteria}
        initialCampaignSubTab={initialCampaignSubTab}
        adminCampaignSubTab={adminCampaignSubTab}
        setAdminCampaignSubTab={setAdminCampaignSubTabState}
        onNavigateCampaignSubTab={navigateCampaignSubTab}
      />

      {/* Modals */}
      <CampaignFormModal
        open={campaignFormModalOpen} onClose={() => { setCampaignFormModalOpen(false); setEditingCampaign(null) }}
        editingCampaign={editingCampaign} campaignForm={campaignForm}
        setCampaignForm={setCampaignForm} submitting={submitting} onSubmit={submitCampaign}
      />
      <FundUsageModal
        open={fundUsageModalOpen} onClose={() => setFundUsageModalOpen(false)}
        fundUsageForm={fundUsageForm} setFundUsageForm={setFundUsageForm}
        allCampaigns={allCampaigns} submitting={submitting} onSubmit={submitFundUsage}
      />
    </div>
  )
}
