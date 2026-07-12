'use client'

import React, { useState, useEffect, useCallback, use } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Types & Helpers
import type { Campaign, Donation, Proposal, AppNotification, FundUsage, PlatformStats, PaymentMethod } from '@/components/polines/types'

// Components
import { AdminDashboard } from '@/components/polines/admin/admin-dashboard'

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
// Fund usage payload shape (matches AdminDashboardProps)
// ============================================================
interface FundUsageSubmitPayload {
  campaignId?: string
  type: 'uang' | 'barang'
  date: string
  description: string
  amount: string
  itemName: string
  itemQuantity: string
  proofFile: File | null
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
  const [statsMonth, setStatsMonth] = useState(() => new Date().toISOString().slice(0, 7)) // "YYYY-MM"

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

  const onChangeStatsMonth = useCallback((month: string) => {
    setStatsMonth(month)
  }, [])

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
  }, [adminTab, adminCampaignSubTab]) // only on mount

  // ---- Modal States ----
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ---- Campaign Form State (shape sesuai CampaignFormView / AdminDashboardProps) ----
  const [campaignForm, setCampaignForm] = useState<{
    title: string; description: string; category: string; targetAmount: string
    startDate: string; endDate: string; isUrgent: boolean; isPublic: boolean
    paymentMethods: PaymentMethod[]
    uniqueCode: string
    images?: string[]
    location?: string
    dropOffLocation?: string
    qrisImageUrl?: string
    mode?: 'create' | 'complete-from-proposal'
  }>({
    title: '', description: '', category: 'Sosial', targetAmount: '',
    startDate: '', endDate: '', isUrgent: false, isPublic: true,
    paymentMethods: [], uniqueCode: '',
    images: [], location: '', dropOffLocation: '', qrisImageUrl: '',
    mode: 'create',
  })

  // ---- Fund Usage Form State (shape sesuai AdminDashboardProps) ----
  const [fundUsageForm, setFundUsageForm] = useState<FundUsageSubmitPayload>({
    campaignId: '', type: 'uang', date: '', description: '',
    amount: '', itemName: '', itemQuantity: '', proofFile: null,
  })

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

  const fetchStats = useCallback(async (month?: string) => {
    try {
      const query = month ? `?month=${month}` : ''
      const res = await fetch(`/api/stats${query}`)
      if (res.ok) {
        const data = await res.json()
        setStats({
          totalCampaigns: data.totalCampaigns ?? 0,
          totalDonations: data.totalDonations ?? 0,
          totalAmount: data.totalAmount ?? 0,
          totalDonors: data.totalDonors ?? 0,
          categoryBreakdown: data.categoryBreakdown || [],
          typeBreakdown: data.typeBreakdown || [],
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
  }, [])

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

  const fetchAllFundUsages = useCallback(async () => {
    try {
      const res = await fetch('/api/fund-usage')
      if (res.ok) { const data = await res.json(); setFundUsages(data.fundUsages || data || []) }
    } catch { setFundUsages([]) }
  }, [])

  // 1. Initial Load: Fetch all stable data on mount
  useEffect(() => {
    fetchAllCampaigns(); 
    fetchCampaigns(); 
    fetchProposals(); 
    fetchDonations(); 
    fetchNotifications();
    fetchAllFundUsages();
  }, [fetchAllCampaigns, fetchCampaigns, fetchProposals, fetchDonations, fetchNotifications, fetchAllFundUsages]);

  // 2. Stats Load: Fetch dynamically based on selected month
  useEffect(() => {
    fetchStats(statsMonth);
  }, [statsMonth, fetchStats]);

  useEffect(() => {
    if (reportCampaignId) {
      fetchFundUsages(reportCampaignId)
    }
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
  const submitCampaign = async (imageFiles?: File[], qrisFile?: File) => {
    setSubmitting(true)
    try {
      let finalImages = campaignForm.images ?? []

      // 1. Upload new campaign photos to Cloudinary
      if (imageFiles && imageFiles.length > 0) {
        const uploadFd = new FormData()
        uploadFd.append('folder', 'campaigns')
        imageFiles.forEach(file => uploadFd.append('files', file))

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadFd })
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}))
          toast.error(err.error || 'Gagal mengupload foto')
          setSubmitting(false)
          return
        }
        const uploadData = await uploadRes.json()
        const newUrls: string[] = uploadData.urls ?? (uploadData.url ? [uploadData.url] : [])
        finalImages = [...finalImages, ...newUrls]
      }

      // 2. Upload QRIS photo (single file) to separate folder
      let finalQrisUrl = campaignForm.qrisImageUrl ?? ''
      if (qrisFile) {
        const qrisFd = new FormData()
        qrisFd.append('folder', 'qris')
        qrisFd.append('file', qrisFile)

        const qrisUploadRes = await fetch('/api/upload', { method: 'POST', body: qrisFd })
        if (!qrisUploadRes.ok) {
          const err = await qrisUploadRes.json().catch(() => ({}))
          toast.error(err.error || 'Gagal mengupload foto QRIS')
          setSubmitting(false)
          return
        }
        const qrisData = await qrisUploadRes.json()
        finalQrisUrl = qrisData.url ?? finalQrisUrl
      }

      const url = editingCampaign ? `/api/campaigns/${editingCampaign.id}` : '/api/campaigns'
      const method = editingCampaign ? 'PUT' : 'POST'

      // 3. Submit final merged payload
      const body = {
        title: campaignForm.title,
        description: campaignForm.description,
        category: campaignForm.category,
        targetAmount: Number(campaignForm.targetAmount) || 0,
        startDate: new Date(campaignForm.startDate).toISOString(),
        endDate: new Date(campaignForm.endDate).toISOString(),
        isUrgent: campaignForm.isUrgent,
        isPublic: campaignForm.isPublic,
        status: campaignForm.isPublic ? 'active' : 'completed',
        uniqueCode: Number(campaignForm.uniqueCode) || 0,
        location: campaignForm.location ?? '',
        dropOffLocation: campaignForm.dropOffLocation ?? '',
        paymentMethods: campaignForm.paymentMethods,
        images: finalImages,
        qrisImageUrl: finalQrisUrl,
        ...(campaignForm.mode === 'complete-from-proposal' ? { status: 'active' } : {}),
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editingCampaign ? 'Campaign berhasil diperbarui' : 'Campaign berhasil dibuat')
        await Promise.all([
          fetchCampaigns(),
          fetchAllCampaigns(),
          fetchStats(statsMonth),
          fetchProposals(),
        ])
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Gagal menyimpan campaign')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteCampaign = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Campaign berhasil dihapus'); fetchCampaigns(); fetchAllCampaigns(); fetchStats(statsMonth) }
      else toast.error('Gagal menghapus campaign')
    } catch { toast.error('Terjadi kesalahan') }
  }

  // ============================================================
  // DONATION VERIFICATION (Admin)
  // ============================================================
  const verifyDonation = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/donations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(`Donasi berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`)
        fetchDonations(); fetchCampaigns(); fetchAllCampaigns(); fetchStats(statsMonth); fetchNotifications()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Gagal memverifikasi donasi')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
  }

  // ============================================================
  // PROPOSAL HANDLERS (Admin)
  // ============================================================
  const updateProposalStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (res.ok) {
        toast.success(`Proposal berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`)
        fetchProposals(); fetchNotifications(); fetchAllCampaigns()
      }
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
  const submitFundUsage = async (payload?: FundUsageSubmitPayload) => {
    const data = payload ?? fundUsageForm
    setSubmitting(true)
    try {
      let documentUrl: string | null = null
      if (data.proofFile) {
        const uploadFd = new FormData()
        uploadFd.append('folder', 'fund-usage')
        uploadFd.append('file', data.proofFile)

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadFd })
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}))
          toast.error(err.error || 'Gagal mengupload bukti')
          setSubmitting(false)
          return
        }
        const uploadData = await uploadRes.json()
        documentUrl = uploadData.url ?? null
      }

      const res = await fetch('/api/fund-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: data.campaignId,
          type: data.type,
          date: data.date,
          description: data.description,
          amount: data.type === 'uang' ? (Number(data.amount) || 0) : undefined,
          itemName: data.type === 'barang' ? data.itemName : undefined,
          itemQuantity: data.type === 'barang' ? (Number(data.itemQuantity) || 0) : undefined,
          documentUrl,
        }),
      })

      if (res.ok) {
        toast.success('Laporan penggunaan dana berhasil ditambahkan')
        fetchAllFundUsages()
        if (reportCampaignId) fetchFundUsages(reportCampaignId)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Gagal menambahkan laporan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const editFundUsage = async (fundUsageId: string, payload: FundUsageSubmitPayload) => {
    setSubmitting(true)
    try {
      let documentUrl: string | undefined = undefined
      if (payload.proofFile) {
        const uploadFd = new FormData()
        uploadFd.append('folder', 'fund-usage')
        uploadFd.append('file', payload.proofFile)

        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadFd })
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}))
          toast.error(err.error || 'Gagal mengupload bukti')
          setSubmitting(false)
          return
        }
        const uploadData = await uploadRes.json()
        documentUrl = uploadData.url
      }

      const res = await fetch(`/api/fund-usage/${fundUsageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: payload.type,
          description: payload.description,
          amount: payload.type === 'uang' ? (Number(payload.amount) || 0) : undefined,
          itemName: payload.type === 'barang' ? payload.itemName : undefined,
          itemQuantity: payload.type === 'barang' ? (Number(payload.itemQuantity) || 0) : undefined,
          date: payload.date,
          ...(documentUrl !== undefined ? { documentUrl } : {}),
        }),
      })

      if (res.ok) {
        toast.success('Laporan berhasil diperbarui')
        fetchAllFundUsages()
        if (reportCampaignId) fetchFundUsages(reportCampaignId)
      } else {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Gagal memperbarui laporan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  const deleteFundUsage = async (fundUsageId: string) => {
    if (!confirm('Yakin ingin menghapus laporan penggunaan dana ini?')) return
    try {
      const res = await fetch(`/api/fund-usage/${fundUsageId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Laporan berhasil dihapus')
        fetchAllFundUsages()
        if (reportCampaignId) fetchFundUsages(reportCampaignId)
      } else {
        toast.error('Gagal menghapus laporan')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
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
        deleteCampaign={deleteCampaign}
        verifyDonation={verifyDonation} updateProposalStatus={updateProposalStatus}
        markNotificationRead={markNotificationRead} markAllNotificationsRead={markAllNotificationsRead}
        
        // --- TAMBAHKAN 'as any' DI 4 BARIS INI ---
        setFundUsageForm={setFundUsageForm as any}
        submitFundUsage={submitFundUsage as any}
        editFundUsage={editFundUsage as any}
        fundUsageForm={fundUsageForm as any}
        // ----------------------------------------

        deleteFundUsage={deleteFundUsage}
        setView={() => { window.location.href = '/' }} handleSignOut={handleSignOut}
        session={session}
        campaignForm={campaignForm} setCampaignForm={setCampaignForm}
        editingCampaign={editingCampaign} setEditingCampaign={setEditingCampaign}
        submitCampaign={submitCampaign} submitting={submitting}
        donations={donations}
        updateProposalCriteria={updateProposalCriteria}
        initialCampaignSubTab={initialCampaignSubTab}
        adminCampaignSubTab={adminCampaignSubTab}
        setAdminCampaignSubTab={setAdminCampaignSubTabState}
        onNavigateCampaignSubTab={navigateCampaignSubTab}
        statsMonth={statsMonth}
        onChangeStatsMonth={onChangeStatsMonth}
        />
    </div>
  )
}