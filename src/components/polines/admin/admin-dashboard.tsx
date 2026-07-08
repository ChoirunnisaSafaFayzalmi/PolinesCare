'use client'

import { useState } from 'react'
import { AdminSidebar, menuItems } from './admin-sidebar'
import { DashboardTab } from './tab-dashboard'
import { CampaignTab } from './tab-campaign'
import { CampaignFormView } from './campaign-form'
import { DonasiTab } from './tab-donasi'
import { DonasiDetailView } from './donasi-detail'
import { LaporanTab } from './tab-laporan'
import { LaporanDetailView } from './laporan-detail'
import { AjuanDetailView } from './ajuan-detail'
import { NotifikasiTab } from './tab-notifikasi'
import { ArrowLeft } from 'lucide-react'
import type { Campaign, Donation, Proposal, AppNotification, PlatformStats, FundUsage, PaymentMethod } from '@/components/polines/types'
import type { LaporanCampaign } from './tab-laporan'
import { AdminProfileTab } from './admin-profile'

// ── Types ──────────────────────────────────────────────────────
type SubView = 'campaign-form' | 'donasi-detail' | 'laporan-detail' | 'ajuan-detail' | null

interface FundUsageSubmitPayload {
  date: string
  description: string
  amount: string
  proofFile: File | null
}

interface AdminDashboardProps {
  adminTab: string
  setAdminTab: (tab: string) => void
  allCampaigns: Campaign[]
  filteredAdminCampaigns: Campaign[]
  filteredDonations: Donation[]
  proposals: Proposal[]
  notifications: AppNotification[]
  stats: PlatformStats | null
  fundUsages: FundUsage[]
  reportCampaignId: string
  setReportCampaignId: (id: string) => void
  unreadCount: number
  adminCampaignFilter: string
  setAdminCampaignFilter: (v: string) => void
  adminCampaignStatus: string
  setAdminCampaignStatus: (v: string) => void
  donationFilter: string
  setDonationFilter: (v: string) => void
  deleteCampaign: (id: string) => void
  verifyDonation: (id: string, status: 'approved' | 'rejected') => void
  updateProposalStatus: (id: string, status: 'approved' | 'rejected') => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  setFundUsageForm: (form: any) => void
  submitFundUsage: (payload?: FundUsageSubmitPayload & { campaignId: string }) => void | Promise<void>
  editFundUsage: (fundUsageId: string, payload: FundUsageSubmitPayload) => void | Promise<void>
  deleteFundUsage: (fundUsageId: string) => void | Promise<void>
  setView: (v: string) => void
  handleSignOut: () => void
  session: any
  campaignForm: {
    title: string
    description: string
    category: string
    targetAmount: string
    startDate: string
    endDate: string
    isUrgent: boolean
    isPublic: boolean
    paymentMethods: PaymentMethod[]  // ← pakai type dari types.ts, bukan inline
    uniqueCode: string
    images?: string[]
    dropOffLocation?: string   // ⬅ tambah
    mode?: 'create' | 'complete-from-proposal'
  }
  setCampaignForm: (form: any) => void
  editingCampaign: Campaign | null
  setEditingCampaign: (c: Campaign | null) => void
  // submitCampaign: () => void
  submitCampaign: (imageFiles?: File[]) => void
  submitting: boolean
  donations: Donation[]
  fundUsageForm: { campaignId: string; date: string; description: string; amount: string; proofFile: File | null }
  updateProposalCriteria: (id: string, criteria: Record<string, number>) => void
  initialCampaignSubTab?: string
  adminCampaignSubTab?: string
  setAdminCampaignSubTab?: (v: string) => void
  onNavigateCampaignSubTab?: (subTab: string) => void
  statsMonth: string
  onChangeStatsMonth: (month: string) => void
}

// ── Component ──────────────────────────────────────────────────
export function AdminDashboard(props: AdminDashboardProps) {
  const {
    adminTab, setAdminTab: propSetAdminTab,
    allCampaigns, filteredAdminCampaigns,
    proposals, notifications, stats, fundUsages,
    setReportCampaignId, unreadCount,
    adminCampaignFilter, setAdminCampaignFilter,
    adminCampaignStatus, setAdminCampaignStatus,
    deleteCampaign, verifyDonation, updateProposalStatus,
    markNotificationRead, markAllNotificationsRead,
    setFundUsageForm, submitFundUsage, editFundUsage, deleteFundUsage,
    setView, handleSignOut, session,
    campaignForm, setCampaignForm,
    editingCampaign, setEditingCampaign,
    submitCampaign, submitting,
    donations, updateProposalCriteria,
    adminCampaignSubTab: parentSubTab,
    setAdminCampaignSubTab: parentSetSubTab,
    onNavigateCampaignSubTab,
    statsMonth,
    onChangeStatsMonth,
  } = props

  // ── Layout state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // ── Navigation state
  const [subView, setSubView] = useState<SubView>(null)
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
  const [selectedLaporanCampaign, setSelectedLaporanCampaign] = useState<LaporanCampaign | null>(null)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)

  // Campaign sub-tab: prefer parent-controlled, fallback to local
  const [localSubTab, setLocalSubTab] = useState(props.initialCampaignSubTab || 'campaigns')
  const campaignSubTab = parentSubTab || localSubTab
  const setCampaignSubTab = parentSetSubTab || setLocalSubTab

  // ── Wrap setAdminTab to reset sub-views
  const setAdminTab = (tab: string) => {
    setSubView(null)
    setSelectedDonation(null)
    setSelectedLaporanCampaign(null)
    setSelectedProposal(null)
    propSetAdminTab(tab)
  }

  // ── Breadcrumb label for sub-views
  const breadcrumb = (() => {
    if (!subView) return null
    const labels: Record<string, { parent: string; current: string }> = {
      'campaign-form': { parent: 'Campaign', current: editingCampaign ? 'Edit Campaign' : 'Campaign Baru' },
      'donasi-detail': { parent: 'Donasi', current: 'Detail Donasi' },
      'laporan-detail': { parent: 'Laporan', current: 'Detail Laporan' },
      'ajuan-detail': { parent: 'Campaign / Ajuan', current: 'Detail Proposal' },
    }
    return labels[subView] ?? null
  })()

  // ── Page title (when not in sub-view)
  const extraLabels: Record<string, string> = {
    profil: 'Profil Saya',
  }
  const pageTitle = menuItems.find(m => m.id === adminTab)?.label ?? extraLabels[adminTab] ?? 'Dashboard'

  // ── Handlers: Campaign
  const handleNewCampaign = () => {
    setEditingCampaign(null)
    setCampaignForm({
      title: '', description: '', category: 'Sosial', targetAmount: '',
      startDate: '', endDate: '', isUrgent: false, isPublic: true,
      paymentMethods: [], uniqueCode: '',
      images: [], location: '',
      dropOffLocation: '',
    })
    setSubView('campaign-form')
  }

  const handleEditCampaign = (c: Campaign) => {
    setEditingCampaign(c)
    setCampaignForm({
      title: c.title,
      description: c.description,
      location: c.location ?? '',
      dropOffLocation: c.dropOffLocation ?? '',
      category: c.category,
      targetAmount: String(c.targetAmount),
      startDate: c.startDate.split('T')[0],
      endDate: c.endDate.split('T')[0],
      isUrgent: c.isUrgent,
      isPublic: c.isPublic ?? true,
      paymentMethods: (c.paymentMethods ?? []).map(pm => ({
        key: pm.key,
        label: pm.label ?? '',
        accountNumber: pm.accountNumber,
        isVisible: pm.isVisible ?? true,
      })),
      uniqueCode: String(c.uniqueCode ?? 0),
      images: Array.isArray(c.images)
        ? c.images
        : (c.images ? JSON.parse(c.images) : []),
    })
    setSubView('campaign-form')
  }

  const handleCompleteFromProposal = (c: Campaign) => {
    setEditingCampaign(c)
    setCampaignForm({
      title: c.title,
      description: c.description,
      location: c.location ?? '',
      category: c.category,
      targetAmount: String(c.targetAmount),
      startDate: c.startDate.split('T')[0],
      endDate: c.endDate.split('T')[0],
      isUrgent: c.isUrgent,
      isPublic: true,
      paymentMethods: [],
      uniqueCode: '',
      dropOffLocation: c.dropOffLocation ?? '',
      images: Array.isArray(c.images) ? c.images : (c.images ? JSON.parse(c.images) : []),
      mode: 'complete-from-proposal',
    })
    setSubView('campaign-form')
  }

  const handleSaveCampaign = async (imageFiles?: File[]) => {
  // Sync status berdasarkan isPublic sebelum submit
  setCampaignForm((prev: typeof campaignForm) => ({
    ...prev,
    status: prev.isPublic ? 'active' : 'closed',
  }))
  await submitCampaign(imageFiles)
  setSubView(null)
  setEditingCampaign(null)
}

  // ── Handler: Laporan
  // PENTING: payload dikirim LANGSUNG ke submitFundUsage(fullPayload), bukan
  // via setFundUsageForm(...) lalu submitFundUsage() tanpa argumen.
  // setFundUsageForm bersifat asinkron (state update React tidak langsung
  // berlaku), jadi memanggil submitFundUsage() di baris berikutnya akan
  // membaca state LAMA (kosong) — itulah sebab data tidak pernah tersimpan
  // walau form sudah terisi di UI.
  const handleAddFundUsage = (campaignId: string, payload: FundUsageSubmitPayload) => {
    const fullPayload = {
      campaignId,
      date: payload.date,
      description: payload.description,
      amount: payload.amount,
      proofFile: payload.proofFile,
    }
    // Tetap sinkronkan state form (opsional, untuk konsistensi tampilan/debug)
    setFundUsageForm(fullPayload)
    // Tapi submit pakai data langsung, tidak menunggu state ter-update
    return submitFundUsage(fullPayload)
  }

  const handleEditFundUsage = (fundUsageId: string, payload: FundUsageSubmitPayload) => {
    return editFundUsage(fundUsageId, payload)
  }

  const handleDeleteFundUsage = (fundUsageId: string) => {
    return deleteFundUsage(fundUsageId)
  }

  // ── Back handler
  const handleBack = () => {
    setSubView(null)
    setSelectedDonation(null)
    setSelectedLaporanCampaign(null)
    setSelectedProposal(null)
  }

  // ── Render content
  const renderContent = () => {
    // Sub-views take priority over tab content
    if (subView === 'campaign-form') {
      return (
        <CampaignFormView
          campaignForm={campaignForm}
          setCampaignForm={setCampaignForm}
          editingCampaign={editingCampaign}
          submitting={submitting}
          onSave={handleSaveCampaign}
          onBack={handleBack}
          session={session}
          mode={campaignForm.mode ?? 'create'}
        />
      )
    }

    if (subView === 'donasi-detail' && selectedDonation) {
      return (
        <DonasiDetailView
          donation={selectedDonation}
          onVerify={verifyDonation}
        />
      )
    }

    if (subView === 'laporan-detail' && selectedLaporanCampaign) {
      return (
        <LaporanDetailView
          campaign={selectedLaporanCampaign}
          fundUsages={fundUsages.filter(f => f.campaignId === selectedLaporanCampaign.id)}
          onAddFundUsage={handleAddFundUsage}
          onEditFundUsage={handleEditFundUsage}
          onDeleteFundUsage={handleDeleteFundUsage}
        />
      )
    }

    if (subView === 'ajuan-detail' && selectedProposal) {
      return (
        <AjuanDetailView
          proposal={selectedProposal}
          onSaveCriteria={updateProposalCriteria}
          onUpdateStatus={updateProposalStatus}
        />
      )
    }

    // Tab content
    switch (adminTab) {
      case 'dashboard':
        return (
          <DashboardTab
            stats={stats}
            allCampaigns={allCampaigns}
            onNavigateCampaign={() => setAdminTab('campaign')}
            selectedMonth={statsMonth}
            onChangeMonth={onChangeStatsMonth}
          />
        )

      case 'campaign':
        return (
          <CampaignTab
            allCampaigns={allCampaigns}
            filteredAdminCampaigns={filteredAdminCampaigns}
            proposals={proposals}
            adminCampaignFilter={adminCampaignFilter}
            setAdminCampaignFilter={setAdminCampaignFilter}
            adminCampaignStatus={adminCampaignStatus}
            setAdminCampaignStatus={setAdminCampaignStatus}
            adminCampaignSubTab={campaignSubTab}
            setAdminCampaignSubTab={(tab) => {
              setCampaignSubTab(tab)
              setSubView(null)
              setSelectedProposal(null)
            }}
            onNavigateCampaignSubTab={onNavigateCampaignSubTab}
            onNewCampaign={handleNewCampaign}
            onEditCampaign={handleEditCampaign}
            onCompleteFromProposal={handleCompleteFromProposal}
            onDeleteCampaign={deleteCampaign}
            onProposalDetail={(p) => {
              setSelectedProposal(p)
              setSubView('ajuan-detail')
            }}
          />
        )

      case 'donasi':
        return (
          <DonasiTab
            donations={donations}
            allCampaigns={allCampaigns}
            onSelectDonation={(d) => {
              setSelectedDonation(d)
              setSubView('donasi-detail')
            }}
          />
        )

      case 'laporan':
        return (
          <LaporanTab
            allCampaigns={allCampaigns}
            fundUsages={fundUsages}
            onViewDetail={(c) => {
              setSelectedLaporanCampaign(c)
              setReportCampaignId(c.id)
              setSubView('laporan-detail')
            }}
          />
        )

      case 'notifikasi':
        return (
          <NotifikasiTab
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkRead={markNotificationRead}
            onMarkAllRead={markAllNotificationsRead}
          />
        )

      case 'profil':          // ← tambah ini
        return <AdminProfileTab />

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AdminSidebar
        adminTab={adminTab}
        setAdminTab={setAdminTab}
        unreadCount={unreadCount}
        session={session}
        setView={setView}
        handleSignOut={handleSignOut}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'}`}>
        <main className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            {breadcrumb ? (
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {breadcrumb.parent}
                </button>
                <span className="text-gray-300">/</span>
                <span className="font-semibold text-gray-700">{breadcrumb.current}</span>
              </div>
            ) : (
              <h1 className="text-xl font-bold text-gray-800">{pageTitle}</h1>
            )}
          </div>

          {renderContent()}
        </main>
      </div>
    </div>
  )
}