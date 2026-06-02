'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  LayoutDashboard, Target, CreditCard, FileText, Bell, Vote, Plus, Edit, Trash2,
  Check, X, AlertTriangle, Search, TrendingUp, CircleDollarSign, ThumbsUp, ThumbsDown,
  Heart, Home as HomeIcon, ChevronLeft, ChevronRight, LogOut, Users, HandCoins,
  ArrowLeft, Eye, Printer,
} from 'lucide-react'
import type {
  Campaign, Donation, Proposal, AppNotification, PlatformStats, FundUsage,
} from '@/components/polines/types'
import {
  formatRupiah, formatDate, getCategoryColor, getStatusColor, CATEGORIES,
  formatUniqueCode, calculateTransferAmount, PROPOSAL_CRITERIA,
  getAverageCriteria, isProposalEligible, getCriteriaScoreColor,
} from '@/components/polines/types'

// ============================================================
// PROPS
// ============================================================
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
  openCampaignForm: (campaign?: Campaign) => void
  deleteCampaign: (id: string) => void
  verifyDonation: (id: string, status: 'approved' | 'rejected') => void
  updateProposalStatus: (id: string, status: 'approved' | 'rejected') => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  setFundUsageForm: (form: any) => void
  setFundUsageModalOpen: (open: boolean) => void
  setView: (v: string) => void
  handleSignOut: () => void
  session: any
  notifDropdownOpen: boolean
  setNotifDropdownOpen: (v: boolean) => void
  // Campaign form props
  campaignForm: {
    organizerName: string; organizerEmail: string; organizerPhone: string; organizerAddress: string;
    title: string; description: string; category: string; targetAmount: string;
    startDate: string; endDate: string; isUrgent: boolean;
    paymentMethod: string; accountNumber: string; uniqueCode: string
  }
  setCampaignForm: (form: any) => void
  editingCampaign: Campaign | null
  setEditingCampaign: (c: Campaign | null) => void
  submitCampaign: () => void
  submitting: boolean
  // Full donation list for detail lookup
  donations: Donation[]
  // Fund usage form and submit
  fundUsageForm: { campaignId: string; description: string; amount: string }
  submitFundUsage: () => void
  // New prop: update proposal criteria scores
  updateProposalCriteria: (id: string, criteria: Record<string, number>) => void
  // URL sync: initial campaign sub-tab from URL
  initialCampaignSubTab?: string
  // URL sync: current campaign sub-tab (managed by parent for URL sync)
  adminCampaignSubTab?: string
  setAdminCampaignSubTab?: (subTab: string) => void
  // URL sync: callback to navigate campaign sub-tab (uses pushState)
  onNavigateCampaignSubTab?: (subTab: string) => void
}

// ============================================================
// SIDEBAR MENU (updated: removed Statistik & Ajuan as separate)
// ============================================================
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'campaign', label: 'Campaign', icon: Target },
  { id: 'donasi', label: 'Donasi', icon: CreditCard },
  { id: 'laporan', label: 'Laporan', icon: FileText },
  { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
]

// Campaign sub-tabs
const campaignSubTabs = [
  { id: 'campaigns', label: 'Campaign' },
  { id: 'ajuan', label: 'Ajuan' },
]

const PIE_COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899']

const ITEMS_PER_PAGE = 10

// ============================================================
// COMPONENT
// ============================================================
export function AdminDashboard(props: AdminDashboardProps) {
  const {
    adminTab, setAdminTab: propSetAdminTab,
    allCampaigns, filteredAdminCampaigns, filteredDonations,
    proposals, notifications, stats, fundUsages,
    reportCampaignId, setReportCampaignId, unreadCount,
    adminCampaignFilter, setAdminCampaignFilter,
    adminCampaignStatus, setAdminCampaignStatus,
    donationFilter, setDonationFilter,
    openCampaignForm, deleteCampaign,
    verifyDonation, updateProposalStatus,
    markNotificationRead, markAllNotificationsRead,
    setFundUsageForm, setFundUsageModalOpen,
    setView, handleSignOut, session,
    notifDropdownOpen, setNotifDropdownOpen,
    campaignForm, setCampaignForm,
    editingCampaign, setEditingCampaign,
    submitCampaign, submitting,
    donations,
    fundUsageForm, submitFundUsage,
    updateProposalCriteria,
    adminCampaignSubTab: parentCampaignSubTab,
    setAdminCampaignSubTab: parentSetCampaignSubTab,
    onNavigateCampaignSubTab,
  } = props

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // ============================================================
  // INTERNAL STATE
  // ============================================================
  const [subView, setSubView] = useState<string | null>(null)
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
  const [selectedReportCampaign, setSelectedReportCampaign] = useState<Campaign | null>(null)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [donationSearch, setDonationSearch] = useState('')
  const [donationTypeFilter, setDonationTypeFilter] = useState('all')
  const [donationDateFilter, setDonationDateFilter] = useState('')
  const [donationPage, setDonationPage] = useState(1)
  const [laporanSearch, setLaporanSearch] = useState('')
  const [laporanStatusFilter, setLaporanStatusFilter] = useState('all')
  const [laporanSubView, setLaporanSubView] = useState<'view' | 'edit' | 'print'>('view')
  const [editFundUsage, setEditFundUsage] = useState({ description: '', amount: '' })
  // Campaign sub-tab: use parent state if available, otherwise local
  const [localCampaignSubTab, setLocalCampaignSubTab] = useState<string>(props.initialCampaignSubTab || 'campaigns')
  const adminCampaignSubTab = parentCampaignSubTab || localCampaignSubTab
  const setAdminCampaignSubTab = parentSetCampaignSubTab || setLocalCampaignSubTab
  // Criteria scoring state (local editing before save)
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>({})

  // Wrap setAdminTab to reset sub-view when switching tabs
  // propSetAdminTab now handles pushState URL update in parent
  const setAdminTab = (tab: string) => {
    setSubView(null)
    setSelectedDonation(null)
    setSelectedReportCampaign(null)
    setSelectedProposal(null)
    setDonationPage(1)
    propSetAdminTab(tab) // triggers pushState('/admin/<tab>') in parent
  }

  // ============================================================
  // CHART DATA
  // ============================================================
  const chartData = stats?.categoryBreakdown?.map(c => ({
    ...c,
    total: c.total || 0,
  })) || []

  const pieData = stats?.typeBreakdown?.map(t => ({
    ...t,
    count: t.count || 0,
  })) || []

  // ============================================================
  // TOP CAMPAIGNS
  // ============================================================
  const topCampaigns = [...allCampaigns]
    .sort((a, b) => b.collectedAmount - a.collectedAmount)
    .slice(0, 5)

  // ============================================================
  // STATS CARDS DATA
  // ============================================================
  const statsCards = [
    { label: 'Total Campaign', value: stats?.totalCampaigns ?? 0, icon: Target, color: 'from-teal-700 to-teal-600' },
    { label: 'Total Donasi', value: formatRupiah(stats?.totalAmount ?? 0), icon: HandCoins, color: 'from-emerald-700 to-emerald-600' },
    { label: 'Total Donatur', value: stats?.totalDonors ?? 0, icon: Users, color: 'from-cyan-700 to-cyan-600' },
    { label: 'Transaksi', value: stats?.totalDonations ?? 0, icon: CreditCard, color: 'from-teal-800 to-teal-700' },
  ]

  // ============================================================
  // ACTIVE MENU HELPER
  // ============================================================
  const isActive = (id: string) => adminTab === id

  // ============================================================
  // COMPUTED: BREADCRUMB
  // ============================================================
  const breadcrumbInfo = (() => {
    if (!subView) return null
    switch (subView) {
      case 'campaign-form':
        return {
          parentLabel: 'Campaign',
          currentLabel: editingCampaign ? 'Edit Campaign' : 'Campaign Baru',
        }
      case 'donasi-detail':
        return { parentLabel: 'Donasi', currentLabel: 'Detail Donasi' }
      case 'laporan-detail':
        return {
          parentLabel: 'Laporan',
          currentLabel: laporanSubView === 'edit' ? 'Edit Laporan' : laporanSubView === 'print' ? 'Print Laporan' : 'Detail Laporan',
        }
      case 'ajuan-detail':
        return { parentLabel: 'Campaign / Ajuan', currentLabel: 'Detail Proposal' }
      default:
        return null
    }
  })()

  // ============================================================
  // COMPUTED: FILTERED DONASI LIST
  // ============================================================
  const filteredDonasiList = (donations || []).filter(d => {
    const matchSearch = donationSearch === '' ||
      d.donorName.toLowerCase().includes(donationSearch.toLowerCase()) ||
      d.campaign?.title?.toLowerCase().includes(donationSearch.toLowerCase())
    const matchType = donationTypeFilter === 'all' || d.type === donationTypeFilter
    const matchDate = donationDateFilter === '' ||
      d.createdAt?.startsWith(donationDateFilter)
    return matchSearch && matchType && matchDate
  })

  const totalPages = Math.max(1, Math.ceil(filteredDonasiList.length / ITEMS_PER_PAGE))
  const paginatedDonasi = filteredDonasiList.slice(
    (donationPage - 1) * ITEMS_PER_PAGE,
    donationPage * ITEMS_PER_PAGE,
  )

  // ============================================================
  // COMPUTED: LAPORAN DATA
  // ============================================================
  const laporanCampaignData = allCampaigns.map(c => {
    const campaignUsages = (fundUsages || []).filter(f => f.campaignId === c.id)
    const totalUsed = campaignUsages.reduce((sum, f) => sum + f.amount, 0)
    const status = c.collectedAmount >= c.targetAmount ? 'Selesai' : 'Progress'
    return {
      ...c,
      totalUsed,
      sisaDana: c.collectedAmount - totalUsed,
      laporanStatus: status,
    }
  })

  const filteredLaporanCampaigns = laporanCampaignData.filter(c => {
    const matchSearch = laporanSearch === '' ||
      c.title.toLowerCase().includes(laporanSearch.toLowerCase())
    const matchStatus = laporanStatusFilter === 'all' || c.laporanStatus === laporanStatusFilter
    return matchSearch && matchStatus
  })

  // ============================================================
  // COMPUTED: LOCAL CRITERIA WITH PROPOSAL DATA
  // ============================================================
  const getEffectiveProposal = (): Proposal | null => {
    if (!selectedProposal) return null
    // Merge stored criteria with local editing state
    return {
      ...selectedProposal,
      kejelasanTujuan: criteriaScores.kejelasanTujuan ?? selectedProposal.kejelasanTujuan ?? 0,
      kelayakanAnggaran: criteriaScores.kelayakanAnggaran ?? selectedProposal.kelayakanAnggaran ?? 0,
      urgensi: criteriaScores.urgensi ?? selectedProposal.urgensi ?? 0,
      keterkaitanKampus: criteriaScores.keterkaitanKampus ?? selectedProposal.keterkaitanKampus ?? 0,
      kontribusiSosial: criteriaScores.kontribusiSosial ?? selectedProposal.kontribusiSosial ?? 0,
    }
  }

  // ============================================================
  // HANDLER: BACK
  // ============================================================
  const handleBack = () => {
    setSubView(null)
    setSelectedDonation(null)
    setSelectedReportCampaign(null)
    setSelectedProposal(null)
    setLaporanSubView('view')
    setCriteriaScores({})
  }

  // ============================================================
  // HANDLER: NEW CAMPAIGN
  // ============================================================
  const handleNewCampaign = () => {
    setEditingCampaign(null)
    setCampaignForm({
      organizerName: '', organizerEmail: '', organizerPhone: '', organizerAddress: '',
      title: '', description: '', category: 'Sosial', targetAmount: '',
      startDate: '', endDate: '', isUrgent: false,
      paymentMethod: 'transfer', accountNumber: '', uniqueCode: ''
    })
    setSubView('campaign-form')
  }

  // ============================================================
  // HANDLER: EDIT CAMPAIGN
  // ============================================================
  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setCampaignForm({
      organizerName: '', organizerEmail: '', organizerPhone: '', organizerAddress: '',
      title: campaign.title, description: campaign.description, category: campaign.category,
      targetAmount: String(campaign.targetAmount), startDate: campaign.startDate.split('T')[0],
      endDate: campaign.endDate.split('T')[0], isUrgent: campaign.isUrgent,
      paymentMethod: 'transfer', accountNumber: '', uniqueCode: String(campaign.uniqueCode ?? 0)
    })
    setSubView('campaign-form')
  }

  // ============================================================
  // HANDLER: SAVE CAMPAIGN
  // ============================================================
  const handleSaveCampaign = () => {
    submitCampaign()
    setSubView(null)
    setEditingCampaign(null)
  }

  // ============================================================
  // HANDLER: PROPOSAL DETAIL
  // ============================================================
  const handleProposalDetail = (p: Proposal) => {
    setSelectedProposal(p)
    // Initialize local criteria from proposal
    setCriteriaScores({
      kejelasanTujuan: p.kejelasanTujuan ?? 0,
      kelayakanAnggaran: p.kelayakanAnggaran ?? 0,
      urgensi: p.urgensi ?? 0,
      keterkaitanKampus: p.keterkaitanKampus ?? 0,
      kontribusiSosial: p.kontribusiSosial ?? 0,
    })
    setSubView('ajuan-detail')
  }

  // ============================================================
  // HANDLER: SAVE CRITERIA
  // ============================================================
  const handleSaveCriteria = () => {
    if (!selectedProposal) return
    updateProposalCriteria(selectedProposal.id, criteriaScores)
    // Update local selected proposal to reflect saved state
    setSelectedProposal({
      ...selectedProposal,
      ...criteriaScores,
    } as Proposal)
  }

  // ============================================================
  // HANDLER: HANDLE CRITERIA SLIDER CHANGE
  // ============================================================
  const handleCriteriaChange = (key: string, value: number) => {
    setCriteriaScores(prev => ({ ...prev, [key]: value }))
  }

  // ============================================================
  // RENDER: SIDEBAR
  // ============================================================
  const renderSidebar = () => (
    <aside
      className={`fixed top-0 left-0 h-full z-40 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      } bg-gradient-to-b from-teal-700 to-teal-800 text-white`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 flex-shrink-0">
          <Heart className="h-5 w-5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold leading-tight">Polines Care</h1>
            <p className="text-[10px] text-teal-200 leading-tight">Admin Panel</p>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.id)
          return (
            <button
              key={item.id}
              onClick={() => setAdminTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                active
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-teal-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-white' : 'text-teal-200'}`} />
              {!sidebarCollapsed && <span>{item.label}</span>}
              {item.id === 'notifikasi' && unreadCount > 0 && (
                <span className={`${sidebarCollapsed ? 'absolute top-1 right-1' : 'ml-auto'} flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-4">
        <button
          onClick={() => setView('landing')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-teal-100 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <HomeIcon className="h-5 w-5 flex-shrink-0" />
          {!sidebarCollapsed && <span>Lihat Website</span>}
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-200 hover:bg-red-500/20 hover:text-white transition-all cursor-pointer"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!sidebarCollapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  )

  // ============================================================
  // RENDER: TOP HEADER BAR
  // ============================================================
  const renderTopBar = () => (
    <div className="flex items-center justify-between h-16 px-6 bg-white border-b">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
        {breadcrumbInfo ? (
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              {breadcrumbInfo.parentLabel}
            </button>
            <span className="text-gray-300">/</span>
            <span className="font-medium text-gray-700">{breadcrumbInfo.currentLabel}</span>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-bold text-gray-800">
              {menuItems.find(m => m.id === adminTab)?.label || 'Dashboard'}
            </h2>
            <p className="text-xs text-gray-400">
              {adminTab === 'dashboard' && 'Ringkasan data platform & statistik'}
              {adminTab === 'campaign' && 'Kelola campaign donasi & proposal ajuan'}
              {adminTab === 'donasi' && 'Verifikasi transaksi donasi'}
              {adminTab === 'laporan' && 'Penggunaan dana campaign'}
              {adminTab === 'notifikasi' && 'Pemberitahuan sistem'}
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
          >
            <Bell className="h-5 w-5 text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {notifDropdownOpen && (
            <div className="absolute right-0 top-12 w-80 rounded-lg border bg-white shadow-lg z-50">
              <div className="p-3 border-b flex items-center justify-between">
                <span className="font-semibold text-sm">Notifikasi</span>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={markAllNotificationsRead}>
                    Tandai semua dibaca
                  </Button>
                )}
              </div>
              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground text-center">Tidak ada notifikasi</p>
                ) : (
                  notifications.slice(0, 5).map(n => (
                    <div
                      key={n.id}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-teal-50/50' : ''}`}
                      onClick={() => markNotificationRead(n.id)}
                    >
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                    </div>
                  ))
                )}
              </ScrollArea>
            </div>
          )}
        </div>
        {/* User Avatar */}
        <Avatar className="h-9 w-9 cursor-pointer">
          <AvatarFallback className="bg-teal-100 text-teal-700 text-sm font-bold">
            {session?.user?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  )

  // ============================================================
  // RENDER: DASHBOARD (with merged statistics)
  // ============================================================
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className={`bg-gradient-to-br ${s.color} rounded-xl p-5 text-white shadow-md`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-white/80">{s.label}</p>
                <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Donasi per Kategori</CardTitle>
              <Badge variant="outline" className="text-xs">6 Bulan</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 1000000)}jt`} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
                  <Tooltip
                    formatter={(value: number) => formatRupiah(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="total" fill="#0d9488" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">Belum ada data</div>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Tipe Donasi</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={55}
                    paddingAngle={3}
                    label={({ name, count }: { name: string; count: number }) => `${name}: ${count}`}
                  >
                    {pieData.map((_, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">Belum ada data</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Campaigns */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold">Top Campaign</CardTitle>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setAdminTab('campaign')}>
              Lihat Semua
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {topCampaigns.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Belum ada campaign</p>
          ) : (
            topCampaigns.map((c, i) => {
              const pct = c.targetAmount > 0 ? Math.min((c.collectedAmount / c.targetAmount) * 100, 100) : 0
              return (
                <div key={c.id} className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold truncate mr-2">{c.title}</span>
                      <span className="text-sm font-bold text-teal-600 whitespace-nowrap">{formatRupiah(c.collectedAmount)}</span>
                    </div>
                    <Progress value={pct} className="h-2 [&>div]:bg-teal-500" />
                    <p className="text-xs text-muted-foreground mt-1">{Math.round(pct)}% dari target {formatRupiah(c.targetAmount)}</p>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )

  // ============================================================
  // RENDER: CAMPAIGN TAB (with sub-tabs: Campaigns & Ajuan)
  // ============================================================
  const renderCampaignTab = () => {
    // If in sub-view (form or ajuan detail), render that
    if (subView === 'campaign-form') return renderCampaignForm()
    if (subView === 'ajuan-detail') return renderAjuanDetail()

    return (
      <div className="space-y-4">
        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {campaignSubTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setAdminCampaignSubTab(tab.id)
                setSubView(null)
                setSelectedProposal(null)
                setCriteriaScores({})
                // Navigate via router.push (parent handles cache + URL)
                props.onNavigateCampaignSubTab?.(tab.id)
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${
                adminCampaignSubTab === tab.id
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.id === 'ajuan' && <Vote className="h-4 w-4 inline mr-1.5 -mt-0.5" />}
              {tab.label}
              {tab.id === 'ajuan' && (
                <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1.5">{proposals.length}</Badge>
              )}
            </button>
          ))}
        </div>

        {/* Content based on sub-tab */}
        {adminCampaignSubTab === 'campaigns' ? renderCampaignList() : renderAjuanList()}
      </div>
    )
  }

  // ============================================================
  // RENDER: CAMPAIGN LIST (with Kode column)
  // ============================================================
  const renderCampaignList = () => (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
        <CardTitle className="text-lg font-bold">Kelola Campaign ({allCampaigns.length})</CardTitle>
        <div className="flex gap-2 flex-wrap">
          <Select value={adminCampaignStatus} onValueChange={setAdminCampaignStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="completed">Selesai</SelectItem>
              <SelectItem value="closed">Ditutup</SelectItem>
            </SelectContent>
          </Select>
          <Select value={adminCampaignFilter} onValueChange={setAdminCampaignFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg" onClick={handleNewCampaign}>
            <Plus className="h-4 w-4 mr-1" /> Buat Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredAdminCampaigns.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Tidak ada campaign ditemukan</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-600 hover:bg-teal-600">
                  <TableHead className="text-white font-semibold">Judul</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Kode</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Kategori</TableHead>
                  <TableHead className="text-white font-semibold">Status</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Terkumpul</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Donatur</TableHead>
                  <TableHead className="text-white font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdminCampaigns.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium max-w-[200px]">
                      <div className="flex items-center gap-2">
                        {c.isUrgent && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                        <span className="truncate">{c.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge className="bg-violet-100 text-violet-700 border-violet-200">
                        {formatUniqueCode(c.uniqueCode)}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className={getCategoryColor(c.category)}>{c.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {formatRupiah(c.collectedAmount)} / {formatRupiah(c.targetAmount)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{c._count?.donations ?? 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditCampaign(c)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteCampaign(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // ============================================================
  // RENDER: CAMPAIGN FORM (with Unique Code field in Pembayaran)
  // ============================================================
  const inputCls = 'rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'

  const renderCampaignForm = () => (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <div />
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-lg" onClick={handleBack}>
            Kembali
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-6 py-2.5"
            onClick={handleSaveCampaign}
            disabled={submitting}
          >
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Section 1: Informasi Pribadi */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-1 rounded-full bg-teal-600" />
            <h3 className="text-base font-bold text-gray-800">Informasi Pribadi</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Nama</Label>
              <Input
                value={campaignForm.organizerName}
                onChange={(e) => setCampaignForm({ ...campaignForm, organizerName: e.target.value })}
                placeholder="Ketik di sini"
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                type="email"
                value={campaignForm.organizerEmail}
                onChange={(e) => setCampaignForm({ ...campaignForm, organizerEmail: e.target.value })}
                placeholder="Ketik di sini"
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">No Telp</Label>
              <Input
                value={campaignForm.organizerPhone}
                onChange={(e) => setCampaignForm({ ...campaignForm, organizerPhone: e.target.value })}
                placeholder="Ketik di sini"
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Alamat</Label>
              <Input
                value={campaignForm.organizerAddress}
                onChange={(e) => setCampaignForm({ ...campaignForm, organizerAddress: e.target.value })}
                placeholder="Ketik di sini"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Informasi Campaign */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-1 rounded-full bg-teal-600" />
            <h3 className="text-base font-bold text-gray-800">Informasi Campaign</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Judul</Label>
              <Input
                value={campaignForm.title}
                onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                placeholder="Ketik di sini"
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Deskripsi</Label>
              <Textarea
                value={campaignForm.description}
                onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                placeholder="Ketik di sini"
                rows={5}
                className={inputCls}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Kategori</Label>
              <Select value={campaignForm.category} onValueChange={(v) => setCampaignForm({ ...campaignForm, category: v })}>
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Target Dana</Label>
              <Input
                type="number"
                value={campaignForm.targetAmount}
                onChange={(e) => setCampaignForm({ ...campaignForm, targetAmount: e.target.value })}
                placeholder="Ketik di sini"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={campaignForm.startDate}
                  onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Tanggal Selesai</Label>
                <Input
                  type="date"
                  value={campaignForm.endDate}
                  onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Mendesak</Label>
              <button
                type="button"
                onClick={() => setCampaignForm({ ...campaignForm, isUrgent: !campaignForm.isUrgent })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  campaignForm.isUrgent ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                    campaignForm.isUrgent ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Pembayaran */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-1 rounded-full bg-teal-600" />
            <h3 className="text-base font-bold text-gray-800">Pembayaran</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Metode Pembayaran</Label>
              <Select value={campaignForm.paymentMethod} onValueChange={(v) => setCampaignForm({ ...campaignForm, paymentMethod: v })}>
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer_bni">Transfer Bank BNI</SelectItem>
                  <SelectItem value="transfer_mandiri">Transfer Bank Mandiri</SelectItem>
                  <SelectItem value="ewallet_gopay">E-Wallet GoPay</SelectItem>
                  <SelectItem value="ewallet_ovo">E-Wallet OVO</SelectItem>
                  <SelectItem value="ewallet_dana">E-Wallet DANA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">No Rekening / No Transfer</Label>
              <Input
                value={campaignForm.accountNumber}
                onChange={(e) => setCampaignForm({ ...campaignForm, accountNumber: e.target.value })}
                placeholder="Ketik di sini"
                className={inputCls}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium text-gray-700">Kode Unik Transfer (3 digit)</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={0}
                  max={999}
                  value={campaignForm.uniqueCode}
                  onChange={(e) => setCampaignForm({ ...campaignForm, uniqueCode: e.target.value })}
                  placeholder="000"
                  className={`${inputCls} w-32`}
                />
                <p className="text-xs text-gray-500 leading-relaxed">
                  Kode unik 3 digit untuk identifikasi transfer. Contoh: kode <span className="font-semibold text-violet-600">010</span>, donasi 200.000 → transfer <span className="font-semibold text-violet-600">200.010</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // ============================================================
  // RENDER: DONASI LIST
  // ============================================================
  const renderDonasiList = () => (
    <Card className="shadow-sm border-gray-100">
      <CardContent className="p-6">
        {/* Filter Row */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={donationSearch}
              onChange={(e) => { setDonationSearch(e.target.value); setDonationPage(1) }}
              placeholder="Cari donatur atau campaign..."
              className="pl-9 rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <Input
            type="date"
            value={donationDateFilter}
            onChange={(e) => { setDonationDateFilter(e.target.value); setDonationPage(1) }}
            className="w-auto rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
          <Select value={donationTypeFilter} onValueChange={(v) => { setDonationTypeFilter(v); setDonationPage(1) }}>
            <SelectTrigger className="w-40 rounded-lg border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="uang">Uang</SelectItem>
              <SelectItem value="barang">Barang</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {filteredDonasiList.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Tidak ada donasi ditemukan</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-600 hover:bg-teal-600">
                  <TableHead className="text-white font-semibold">Donatur</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Tanggal</TableHead>
                  <TableHead className="text-white font-semibold">Campaign</TableHead>
                  <TableHead className="text-white font-semibold hidden lg:table-cell">Kode Unik</TableHead>
                  <TableHead className="text-white font-semibold hidden lg:table-cell">Akhir 3 Digit</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Tipe Donasi</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Nominal</TableHead>
                  <TableHead className="text-white font-semibold">Status</TableHead>
                  <TableHead className="text-white font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDonasi.map(d => {
                  const camp = allCampaigns.find(c => c.id === d.campaignId)
                  const last3Digit = String(d.amount % 1000).padStart(3, '0')
                  const uniqueCodeMatch = camp && (d.amount % 1000) === camp.uniqueCode
                  return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.donorName}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-500">
                      {formatDate(d.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-[150px] truncate text-sm">
                      {d.campaign?.title}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {camp ? (
                        <Badge className="bg-violet-100 text-violet-700 border-violet-200">
                          {formatUniqueCode(camp.uniqueCode)}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                        uniqueCodeMatch
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {last3Digit}
                        {uniqueCodeMatch && <Check className="h-3 w-3 ml-1" />}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        d.type === 'uang'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {d.type}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm font-medium text-gray-700">
                      {formatRupiah(d.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(d.status)}>{d.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => {
                          setSelectedDonation(d)
                          setSubView('donasi-detail')
                        }}
                        className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
                      >
                        Detail
                      </button>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              onClick={() => setDonationPage(p => Math.max(1, p - 1))}
              disabled={donationPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={page === donationPage ? 'default' : 'outline'}
                size="sm"
                className={`h-8 w-8 p-0 rounded-lg ${page === donationPage ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}`}
                onClick={() => setDonationPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg"
              onClick={() => setDonationPage(p => Math.min(totalPages, p + 1))}
              disabled={donationPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // ============================================================
  // RENDER: DONASI DETAIL
  // ============================================================
  const renderDonasiDetail = () => {
    if (!selectedDonation) return null
    const d = selectedDonation
    return (
      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-6">
          <div className="max-w-2xl space-y-6">
            {/* Header with actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div />
              {d.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                    onClick={() => {
                      verifyDonation(d.id, 'approved')
                      setSelectedDonation({ ...d, status: 'approved' })
                    }}
                  >
                    <Check className="h-4 w-4 mr-1" /> Setujui
                  </Button>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    onClick={() => {
                      verifyDonation(d.id, 'rejected')
                      setSelectedDonation({ ...d, status: 'rejected' })
                    }}
                  >
                    <X className="h-4 w-4 mr-1" /> Tolak
                  </Button>
                </div>
              )}
            </div>

            {/* Detail Fields */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-start">
                <span className="text-gray-500 w-32 flex-shrink-0 text-sm">Nama Donatur</span>
                <span className="text-sm font-medium text-gray-900">{d.donorName}</span>
              </div>
              <Separator />
              <div className="flex items-start">
                <span className="text-gray-500 w-32 flex-shrink-0 text-sm">Email</span>
                <span className="text-sm font-medium text-gray-900">{d.donorEmail}</span>
              </div>
              <Separator />
              <div className="flex items-start">
                <span className="text-gray-500 w-32 flex-shrink-0 text-sm">No Telp</span>
                <span className="text-sm font-medium text-gray-900">{d.donorPhone || '-'}</span>
              </div>
              <Separator />
              <div className="flex items-start">
                <span className="text-gray-500 w-32 flex-shrink-0 text-sm">Tanggal Donasi</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(d.createdAt)}</span>
              </div>
              <Separator />
              <div className="flex items-start">
                <span className="text-gray-500 w-32 flex-shrink-0 text-sm">Campaign</span>
                <span className="text-sm font-medium text-gray-900">{d.campaign?.title || '-'}</span>
              </div>
              <Separator />
              <div className="flex items-start">
                <span className="text-gray-500 w-32 flex-shrink-0 text-sm">Tipe Donasi</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  d.type === 'uang'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {d.type}
                </span>
              </div>
              <Separator />
              <div className="flex items-start">
                <span className="text-gray-500 w-32 flex-shrink-0 text-sm">Metode Pembayaran</span>
                <span className="text-sm font-medium text-gray-900">{d.paymentMethod || '-'}</span>
              </div>
              <Separator />
              <div className="flex items-start">
                <span className="text-gray-500 w-32 flex-shrink-0 text-sm">Nominal</span>
                <span className="text-sm font-medium text-gray-900">{formatRupiah(d.amount)}</span>
              </div>
              <Separator />
              <div className="flex items-start">
                <span className="text-gray-500 w-32 flex-shrink-0 text-sm">Status</span>
                <Badge className={getStatusColor(d.status)}>{d.status}</Badge>
              </div>
              <Separator />
              <div className="flex items-start">
                <span className="text-gray-500 w-32 flex-shrink-0 text-sm">Pesan</span>
                <span className="text-sm font-medium text-gray-900">{d.message || '-'}</span>
              </div>
              {d.proofUrl && (
                <>
                  <Separator />
                  <div className="flex items-start">
                    <span className="text-gray-500 w-32 flex-shrink-0 text-sm">Bukti Transfer</span>
                    <a
                      href={d.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                    >
                      Lihat Bukti
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ============================================================
  // RENDER: LAPORAN LIST (with Eye + Printer icons)
  // ============================================================
  const renderLaporanList = () => (
    <Card className="shadow-sm border-gray-100">
      <CardContent className="p-6">
        {/* Filter Row */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={laporanSearch}
              onChange={(e) => setLaporanSearch(e.target.value)}
              placeholder="Cari campaign..."
              className="pl-9 rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <Select value={laporanStatusFilter} onValueChange={setLaporanStatusFilter}>
            <SelectTrigger className="w-40 rounded-lg border-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Selesai">Selesai</SelectItem>
              <SelectItem value="Progress">Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {filteredLaporanCampaigns.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Tidak ada campaign ditemukan</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-600 hover:bg-teal-600">
                  <TableHead className="text-white font-semibold">Campaign</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Terkumpul</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Sisa Dana</TableHead>
                  <TableHead className="text-white font-semibold">Status</TableHead>
                  <TableHead className="text-white font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLaporanCampaigns.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium max-w-[200px]">
                      <span className="truncate">{c.title}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-700">
                      {formatRupiah(c.collectedAmount)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-700">
                      {formatRupiah(c.sisaDana)}
                    </TableCell>
                    <TableCell>
                      <Badge className={c.laporanStatus === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {c.laporanStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-teal-600 hover:text-teal-700"
                          onClick={() => {
                            setSelectedReportCampaign(c)
                            setReportCampaignId(c.id)
                            setLaporanSubView('view')
                            setSubView('laporan-detail')
                          }}
                          title="Lihat & Edit"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-teal-600 hover:text-teal-700"
                          onClick={() => {
                            setSelectedReportCampaign(c)
                            setReportCampaignId(c.id)
                            setLaporanSubView('print')
                            setSubView('laporan-detail')
                          }}
                          title="Print / Laporan"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // ============================================================
  // RENDER: LAPORAN DETAIL (View, Edit, Print)
  // ============================================================
  const renderLaporanDetail = () => {
    const camp = selectedReportCampaign
    if (!camp) return null
    const totalUsed = (fundUsages || []).reduce((sum, f) => sum + f.amount, 0)

    // ---- PRINT VIEW ----
    if (laporanSubView === 'print') {
      return (
        <div className="space-y-6 print-area">
          {/* Print Header */}
          <div className="text-center space-y-2 pb-4 border-b-2 border-teal-600">
            <div className="flex items-center justify-center gap-2">
              <Heart className="h-6 w-6 text-teal-600" />
              <h1 className="text-xl font-bold text-gray-900">Polines Care</h1>
            </div>
            <h2 className="text-lg font-bold text-gray-800">Laporan Penggunaan Dana</h2>
            <p className="text-sm text-gray-500">{camp.title}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Total Terkumpul</p>
              <p className="text-lg font-bold text-teal-600">{formatRupiah(camp.collectedAmount)}</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Total Digunakan</p>
              <p className="text-lg font-bold text-orange-600">{formatRupiah(totalUsed)}</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">Sisa Dana</p>
              <p className="text-lg font-bold text-emerald-600">{formatRupiah(camp.collectedAmount - totalUsed)}</p>
            </div>
          </div>

          {/* Fund Usage Table */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle className="text-base font-bold">Rincian Penggunaan Dana</CardTitle>
            </CardHeader>
            <CardContent>
              {(fundUsages || []).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada laporan penggunaan dana</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100 hover:bg-gray-100">
                        <TableHead className="font-semibold">No</TableHead>
                        <TableHead className="font-semibold">Deskripsi</TableHead>
                        <TableHead className="font-semibold">Tanggal</TableHead>
                        <TableHead className="font-semibold text-right">Jumlah</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fundUsages.map((f, idx) => (
                        <TableRow key={f.id}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell className="font-medium">{f.description}</TableCell>
                          <TableCell className="text-sm text-gray-500">{formatDate(f.date)}</TableCell>
                          <TableCell className="text-right font-semibold text-orange-600">{formatRupiah(f.amount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-gray-50 font-bold">
                        <TableCell colSpan={3} className="text-right">TOTAL</TableCell>
                        <TableCell className="text-right text-orange-600">{formatRupiah(totalUsed)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Print Action */}
          <div className="flex justify-end">
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-1" /> Cetak Laporan
            </Button>
          </div>
        </div>
      )
    }

    // ---- EDIT VIEW ----
    if (laporanSubView === 'edit') {
      return (
        <div className="space-y-6">
          {/* Campaign Summary */}
          <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{camp.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    <Badge variant="outline" className={getCategoryColor(camp.category)}>{camp.category}</Badge>
                    <span className="ml-2">Terkumpul: <span className="font-semibold text-teal-600">{formatRupiah(camp.collectedAmount)}</span></span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Fund Usage Form */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle className="text-base font-bold">Tambah Penggunaan Dana</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-2xl">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Deskripsi Penggunaan Dana</Label>
                  <Textarea
                    value={editFundUsage.description}
                    onChange={(e) => setEditFundUsage({ ...editFundUsage, description: e.target.value })}
                    placeholder="Contoh: Pembelian sembako untuk korban banjir"
                    rows={3}
                    className={inputCls}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Jumlah (Rp)</Label>
                  <Input
                    type="number"
                    value={editFundUsage.amount}
                    onChange={(e) => setEditFundUsage({ ...editFundUsage, amount: e.target.value })}
                    placeholder="Contoh: 1500000"
                    className={inputCls}
                  />
                </div>
                <Button
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                  onClick={() => {
                    setFundUsageForm({ campaignId: camp.id, description: editFundUsage.description, amount: editFundUsage.amount })
                    submitFundUsage()
                    setEditFundUsage({ description: '', amount: '' })
                  }}
                  disabled={!editFundUsage.description || !editFundUsage.amount}
                >
                  <Plus className="h-4 w-4 mr-1" /> Simpan Penggunaan Dana
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Existing Fund Usage Records */}
          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle className="text-base font-bold">Riwayat Penggunaan Dana</CardTitle>
            </CardHeader>
            <CardContent>
              {(fundUsages || []).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Belum ada laporan penggunaan dana</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-teal-600 hover:bg-teal-600">
                        <TableHead className="text-white font-semibold">Deskripsi</TableHead>
                        <TableHead className="text-white font-semibold hidden md:table-cell">Tanggal</TableHead>
                        <TableHead className="text-white font-semibold text-right">Jumlah</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fundUsages.map(f => (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">{f.description}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-gray-500">{formatDate(f.date)}</TableCell>
                          <TableCell className="text-right font-semibold text-orange-600">
                            {formatRupiah(f.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    // ---- VIEW (default) ----
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-5 text-white shadow-md">
            <p className="text-sm text-white/80 mb-1">Total Terkumpul</p>
            <p className="text-2xl font-bold">{formatRupiah(camp.collectedAmount)}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-md">
            <p className="text-sm text-white/80 mb-1">Total Digunakan</p>
            <p className="text-2xl font-bold">{formatRupiah(totalUsed)}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-5 text-white shadow-md">
            <p className="text-sm text-white/80 mb-1">Sisa Dana</p>
            <p className="text-2xl font-bold">{formatRupiah(camp.collectedAmount - totalUsed)}</p>
          </div>
        </div>

        {/* Campaign Details */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-base font-bold">Detail Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-start">
                <span className="text-gray-500 w-36 flex-shrink-0 text-sm">Judul</span>
                <span className="text-sm font-medium text-gray-900">{camp.title}</span>
              </div>
              <Separator />
              <div className="flex items-start">
                <span className="text-gray-500 w-36 flex-shrink-0 text-sm">Kategori</span>
                <Badge variant="outline" className={getCategoryColor(camp.category)}>{camp.category}</Badge>
              </div>
              <Separator />
              <div className="flex items-start">
                <span className="text-gray-500 w-36 flex-shrink-0 text-sm">Tanggal Mulai - Selesai</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(camp.startDate)} — {formatDate(camp.endDate)}</span>
              </div>
              <Separator />
              <div className="flex items-start">
                <span className="text-gray-500 w-36 flex-shrink-0 text-sm">Target Dana</span>
                <span className="text-sm font-medium text-gray-900">{formatRupiah(camp.targetAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fund Usage Records */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold">Riwayat Penggunaan Dana</CardTitle>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm"
              onClick={() => {
                setLaporanSubView('edit')
              }}
            >
              <Edit className="h-4 w-4 mr-1" /> Edit Laporan
            </Button>
          </CardHeader>
          <CardContent>
            {(fundUsages || []).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Belum ada laporan penggunaan dana</p>
            ) : (
              <div className="space-y-3">
                {fundUsages.map(f => (
                  <div
                    key={f.id}
                    className="p-4 rounded-lg border border-gray-100 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{f.description}</p>
                      <p className="text-sm text-gray-500 mt-1">{formatDate(f.date)}</p>
                    </div>
                    <p className="font-semibold text-orange-600 whitespace-nowrap">
                      {formatRupiah(f.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Info */}
        <Card className="shadow-sm border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-teal-100 rounded-lg p-2.5">
                  <FileText className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Laporan Penggunaan Dana</p>
                  <p className="text-xs text-gray-500">{fundUsages?.length ?? 0} catatan · {formatRupiah(totalUsed)} total digunakan</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg text-sm"
                onClick={() => {
                  setLaporanSubView('print')
                }}
              >
                <Printer className="h-4 w-4 mr-1" /> Print Laporan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================================
  // RENDER: AJUAN LIST (under Campaign sub-tab)
  // ============================================================
  const renderAjuanList = () => (
    <Card className="shadow-sm border-gray-100">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-800">Proposal / Ajuan Crowdsourcing</h3>
            <p className="text-xs text-gray-500 mt-0.5">Kelola proposal yang diajukan oleh warga kampus</p>
          </div>
        </div>

        {proposals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Belum ada proposal</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-600 hover:bg-teal-600">
                  <TableHead className="text-white font-semibold">Nama Proposal</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Diajukan Oleh</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Kategori</TableHead>
                  <TableHead className="text-white font-semibold">Status</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Suara</TableHead>
                  <TableHead className="text-white font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proposals.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {p.title}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-500">
                      {p.proposer?.name ?? 'Anonim'}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className={getCategoryColor(p.category)}>{p.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-700">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3.5 w-3.5" /> {p.votesCount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleProposalDetail(p)}
                        className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
                      >
                        Detail
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // ============================================================
  // RENDER: AJUAN DETAIL (with scoring flow)
  // ============================================================
  const renderAjuanDetail = () => {
    if (!selectedProposal) return null
    const p = selectedProposal
    const effectiveProposal = getEffectiveProposal()
    const avgScore = effectiveProposal ? getAverageCriteria(effectiveProposal) : 0
    const eligible = effectiveProposal ? isProposalEligible(effectiveProposal) : false

    return (
      <div className="space-y-6">
        {/* Proposal Info */}
        <Card className="shadow-sm border-gray-100">
          <CardContent className="p-6">
            <div className="max-w-2xl space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">{p.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    <Badge variant="outline" className={getCategoryColor(p.category)}>{p.category}</Badge>
                    <span className="ml-2">Diajukan oleh: <span className="font-medium text-gray-700">{p.proposer?.name ?? 'Anonim'}</span></span>
                  </p>
                </div>
                <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
              </div>
              <Separator />
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {p.description}
              </div>
              {p.targetAmount && (
                <>
                  <Separator />
                  <div className="flex items-start">
                    <span className="text-gray-500 w-32 flex-shrink-0 text-sm">Target Dana</span>
                    <span className="text-sm font-medium text-gray-900">{formatRupiah(p.targetAmount)}</span>
                  </div>
                </>
              )}
              <Separator />
              <div className="flex items-start">
                <span className="text-gray-500 w-32 flex-shrink-0 text-sm">Jumlah Suara</span>
                <span className="flex items-center gap-1 text-sm font-medium text-gray-900">
                  <ThumbsUp className="h-3.5 w-3.5" /> {p.votesCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alur Penilaian Proposal */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-teal-600" />
              <div>
                <CardTitle className="text-base font-bold">Alur Penilaian Proposal</CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Proposal dinilai oleh Admin berdasarkan 5 kriteria (skor 0-100). Rata-rata skor ≥ 70 memenuhi syarat untuk diterima.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {PROPOSAL_CRITERIA.map(criterion => {
              const score = criteriaScores[criterion.key] ?? 0
              return (
                <div key={criterion.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">{criterion.label}</Label>
                      <p className="text-xs text-gray-400 mt-0.5">{criterion.description}</p>
                    </div>
                    <span className={`inline-flex items-center justify-center w-12 h-7 rounded-md text-sm font-bold ${getCriteriaScoreColor(score)}`}>
                      {score}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-6">0</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={score}
                      onChange={(e) => handleCriteriaChange(criterion.key, Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                    />
                    <span className="text-xs text-gray-400 w-8">100</span>
                  </div>
                </div>
              )
            })}

            {/* Average Score & Eligibility */}
            <div className={`mt-4 p-4 rounded-lg border-2 ${
              eligible
                ? 'border-emerald-200 bg-emerald-50'
                : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">Rata-rata Skor</p>
                  <p className="text-2xl font-bold mt-1">
                    <span className={eligible ? 'text-emerald-600' : 'text-red-600'}>{avgScore}</span>
                    <span className="text-sm text-gray-400 ml-2">/ 100</span>
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={`text-sm px-3 py-1 ${
                    eligible
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    {eligible ? 'MEMENUHI SYARAT' : 'TIDAK MEMENUHI SYARAT'}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {eligible
                      ? 'Proposal dapat disetujui'
                      : 'Rata-rata skor harus ≥ 70'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                onClick={handleSaveCriteria}
              >
                <Check className="h-4 w-4 mr-1" /> Simpan Penilaian
              </Button>
              {p.status === 'pending' && (
                <>
                  <Button
                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                    onClick={() => {
                      handleSaveCriteria()
                      updateProposalStatus(p.id, 'approved')
                      setSelectedProposal({ ...p, status: 'approved' })
                    }}
                    disabled={!eligible}
                    title={eligible ? 'Setujui proposal' : 'Proposal belum memenuhi syarat (skor rata-rata < 70)'}
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" /> Setujui
                  </Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    onClick={() => {
                      handleSaveCriteria()
                      updateProposalStatus(p.id, 'rejected')
                      setSelectedProposal({ ...p, status: 'rejected' })
                    }}
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" /> Tolak
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ============================================================
  // RENDER: NOTIFIKASI TAB
  // ============================================================
  const renderNotifikasi = () => (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">Notifikasi ({notifications.length})</CardTitle>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="rounded-lg text-sm" onClick={markAllNotificationsRead}>
            Tandai semua dibaca
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Tidak ada notifikasi</p>
        ) : (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  !n.isRead
                    ? 'bg-teal-50/50 border-teal-100 hover:bg-teal-50'
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
                onClick={() => markNotificationRead(n.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{formatDate(n.createdAt)}</p>
                  </div>
                  <Badge variant="outline" className="text-xs flex-shrink-0">
                    {n.type}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  // ============================================================
  // MAIN RETURN
  // ============================================================
  const renderContent = () => {
    // Sub-views take priority
    if (subView === 'campaign-form') return renderCampaignForm()
    if (subView === 'donasi-detail') return renderDonasiDetail()
    if (subView === 'laporan-detail') return renderLaporanDetail()
    if (subView === 'ajuan-detail') return renderAjuanDetail()

    // Tab-based content
    switch (adminTab) {
      case 'dashboard': return renderDashboard()
      case 'campaign': return renderCampaignTab()
      case 'donasi': return renderDonasiList()
      case 'laporan': return renderLaporanList()
      case 'notifikasi': return renderNotifikasi()
      default: return renderDashboard()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {renderSidebar()}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'
        }`}
      >
        {/* Top bar */}
        {renderTopBar()}
        {/* Main content */}
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
