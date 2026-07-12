'use client'

import React, { useState, useEffect, useCallback, use } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Types & Helpers
import type { Campaign, Donation, Proposal, AppNotification, FundUsage, PlatformStats, PaymentMethod } from '@/components/polines/types'

type FundUsageSubmitPayload = {
  campaignId: string
  description: string
  amount: string | number
  date?: string
  proofFile?: File | null
}

// Components
import { AdminDashboard } from '@/components/polines/admin/admin-dashboard'
import { FundUsageModal } from '@/components/polines/admin/fund-usage-modal'

// Workaround: some modal prop types differ; cast to any to avoid TS error here
const FundUsageModalAny = FundUsageModal as any

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

  // ⬅ FIX: sebelumnya fungsi ini cuma setStatsMonth(month) tanpa memanggil
  // ulang fetchStats(month). Akibatnya state `statsMonth` ter-update (dan
  // dropdown filter di UI kelihatan berubah), TAPI data yang ditampilkan di
  // dashboard tetap data lama dari fetch pertama kali saat halaman dibuka —
  // request baru ke /api/stats?month=... tidak pernah dikirim. Makanya filter
  // bulan kelihatan "tidak berfungsi" padahal backend-nya (route.ts) sudah
  // benar mendukung filter month sejak awal.
  //
  // Catatan: `fetchStats` SENGAJA tidak dimasukkan ke dependency array useCallback
  // di bawah ini, karena fetchStats baru dideklarasikan lebih bawah (di bagian
  // DATA FETCHING). Kalau dimasukkan ke array, itu akan dievaluasi saat baris
  // ini dieksekusi (render time) — sebelum fetchStats selesai di-assign — yang
  // menyebabkan ReferenceError "used before its declaration" (temporal dead
  // zone). Referensi fetchStats DI DALAM BODY fungsi ini aman karena body baru
  // benar-benar dijalankan belakangan, saat dropdown bulan diganti oleh admin
  // (bukan saat render), jadi fetchStats sudah pasti terdefinisi saat itu.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onChangeStatsMonth = useCallback((month: string) => {
    setStatsMonth(month)
    fetchStats(month)
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
  }, []) // only on mount

  // ---- Modal States ----
  const [campaignFormModalOpen, setCampaignFormModalOpen] = useState(false)
  const [fundUsageModalOpen, setFundUsageModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // ---- Campaign Form State ----
  const [campaignForm, setCampaignForm] = useState<{
    organizerName: string
    organizerEmail: string
    organizerPhone: string
    organizerAddress: string
    title: string
    description: string
    category: string
    targetAmount: string
    startDate: string
    endDate: string
    isUrgent: boolean
    isPublic: boolean
    paymentMethods: PaymentMethod[]
    accountNumber: string
    uniqueCode: string
    images?: string[]
  }>({
    organizerName: '', organizerEmail: '', organizerPhone: '', organizerAddress: '',
    title: '', description: '', category: 'Sosial', targetAmount: '',
    startDate: '', endDate: '', isUrgent: false,
    // align shape with Campaign form type: include isPublic and paymentMethods
    isPublic: true,
    // cast via unknown to satisfy TypeScript when string literal types may not match PaymentMethod
    paymentMethods: ['transfer'] as unknown as PaymentMethod[],
    accountNumber: '', uniqueCode: '',
    images: [],
  })

  // ---- Fund Usage Form State ----
  // include fields expected by FundUsage type: date and proofFile
  const [fundUsageForm, setFundUsageForm] = useState({ campaignId: '', description: '', amount: '', date: '', proofFile: null as File | null })



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
    fetchAllCampaigns(); fetchCampaigns(); fetchStats(statsMonth); fetchProposals(); fetchDonations(); fetchNotifications()
  }, [])

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
        isPublic: campaign.isPublic ?? true,
        paymentMethods: campaign.paymentMethods || (['transfer'] as unknown as PaymentMethod[]),
        accountNumber: '', uniqueCode: String(campaign.uniqueCode || ''),
        images: Array.isArray(campaign.images) ? campaign.images : (campaign.images ? JSON.parse(campaign.images as any) : []),
      })
    } else {
      setEditingCampaign(null)
      setCampaignForm({
        organizerName: '', organizerEmail: '', organizerPhone: '', organizerAddress: '',
        title: '', description: '', category: 'Sosial', targetAmount: '',
        startDate: '', endDate: '', isUrgent: false,
        isPublic: true,
        paymentMethods: (['transfer'] as unknown as PaymentMethod[]),
        accountNumber: '', uniqueCode: '',
        images: [],
      })
    }
    setCampaignFormModalOpen(true)
  }

  // ⬅ FIX: sebelumnya submitCampaign() tidak menerima parameter apapun, padahal
  // CampaignFormView & AdminDashboard mengirim imageFiles (File[]) ke fungsi ini
  // lewat rantai onSave(imageFiles) -> handleSaveCampaign(imageFiles) ->
  // submitCampaign(imageFiles). Karena parameter tidak dideklarasikan di sini,
  // imageFiles yang dikirim dari form selalu diabaikan begitu saja — akibatnya
  // foto baru yang di-upload admin TIDAK PERNAH benar-benar terkirim ke
  // Cloudinary, dan campaign tersimpan tanpa foto baru (atau kehilangan foto
  // lama yang sudah dihapus dari campaignForm.images) tanpa error apapun yang
  // terlihat oleh user. Fix: terima imageFiles, upload dulu ke /api/upload
  // kalau ada file baru, gabungkan URL hasil upload dengan foto lama yang
  // masih ada di campaignForm.images, baru kirim semuanya ke /api/campaigns.
  const submitCampaign = async (imageFiles?: File[]) => {
    setSubmitting(true)
    try {
      // 1. Kalau ada foto baru yang dipilih admin, upload dulu ke Cloudinary
      let uploadedUrls: string[] = []
      if (imageFiles && imageFiles.length > 0) {
        const formData = new FormData()
        imageFiles.forEach(file => formData.append('files', file))
        formData.append('folder', 'campaigns')

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData, // jangan set Content-Type manual — browser yang atur multipart boundary
        })

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}))
          toast.error(err.error || 'Gagal upload gambar campaign')
          setSubmitting(false)
          return
        }

        const uploadData = await uploadRes.json()
        uploadedUrls = uploadData.urls || (uploadData.url ? [uploadData.url] : [])
      }

      // 2. Gabungkan foto lama yang masih tersisa (campaignForm.images) + foto baru yang baru diupload
      const combinedImages = [...(campaignForm.images || []), ...uploadedUrls]

      // 3. Kirim body campaign ke API, sudah termasuk images gabungan
      const body = {
        ...campaignForm,
        images: combinedImages,
        targetAmount: Number(campaignForm.targetAmount),
        uniqueCode: Number(campaignForm.uniqueCode) || 0,
        startDate: new Date(campaignForm.startDate).toISOString(),
        endDate: new Date(campaignForm.endDate).toISOString(),
      }
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
  // FIX: backend di /api/donations/[id]/route.ts hanya mengekspor handler PATCH,
  // bukan PUT. Sebelumnya method di sini adalah 'PUT' sehingga request selalu
  // gagal dengan 405 Method Not Allowed -> database tidak pernah ter-update,
  // walau UI sempat terlihat berubah karena optimistic update di state lokal
  // komponen AdminDashboard. Diubah menjadi 'PATCH' agar cocok dengan backend.
  const verifyDonation = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/donations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.success(`Donasi berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`)
        fetchDonations(); fetchCampaigns(); fetchAllCampaigns(); fetchStats(); fetchNotifications()
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

  // Edit an existing fund usage report
  const editFundUsage = async (id: string, updates: any) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/fund-usage/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, amount: Number(updates.amount) })
      })
      if (res.ok) { toast.success('Laporan penggunaan dana berhasil diperbarui'); if (reportCampaignId) fetchFundUsages(reportCampaignId) }
      else toast.error('Gagal memperbarui laporan penggunaan dana')
    } catch { toast.error('Terjadi kesalahan') }
    finally { setSubmitting(false) }
  }

  // Delete a fund usage report
  const deleteFundUsage = async (id: string) => {
    if (!confirm('Yakin ingin menghapus laporan penggunaan dana ini?')) return
    try {
      const res = await fetch(`/api/fund-usage/${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Laporan penggunaan dana berhasil dihapus'); if (reportCampaignId) fetchFundUsages(reportCampaignId) }
      else toast.error('Gagal menghapus laporan penggunaan dana')
    } catch { toast.error('Terjadi kesalahan') }
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
        setFundUsageForm={setFundUsageForm}
        setView={() => { window.location.href = '/' }} handleSignOut={handleSignOut}
        session={session}
        
        campaignForm={campaignForm} setCampaignForm={setCampaignForm}
        editingCampaign={editingCampaign} setEditingCampaign={setEditingCampaign}
        submitCampaign={submitCampaign} submitting={submitting}
        donations={donations}
        fundUsageForm={fundUsageForm} submitFundUsage={submitFundUsage}
        editFundUsage={editFundUsage} deleteFundUsage={deleteFundUsage}
        updateProposalCriteria={updateProposalCriteria}
        initialCampaignSubTab={initialCampaignSubTab}
        adminCampaignSubTab={adminCampaignSubTab}
        setAdminCampaignSubTab={setAdminCampaignSubTabState}
        onNavigateCampaignSubTab={navigateCampaignSubTab}
        statsMonth={statsMonth}
        onChangeStatsMonth={onChangeStatsMonth}
      />

      {/* Modals */}
      <FundUsageModalAny
        open={fundUsageModalOpen} onClose={() => setFundUsageModalOpen(false)}
        fundUsageForm={fundUsageForm} setFundUsageForm={setFundUsageForm}
        allCampaigns={allCampaigns} submitting={submitting} onSubmit={submitFundUsage}
      />
    </div>
  )
}