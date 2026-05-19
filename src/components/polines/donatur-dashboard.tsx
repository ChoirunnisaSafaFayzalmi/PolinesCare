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
import {
  Heart, Home as HomeIcon, LogOut, ChevronLeft, ChevronRight, Bell,
  Search, HandHeart, Eye, AlertTriangle, TrendingUp, Star, Sparkles,
  LayoutDashboard, Target, ClipboardList, UserCircle, Mail, Phone, CreditCard, CheckCircle2, Clock, Menu, X,
} from 'lucide-react'
import type {
  Campaign, Donation, RecommendedCampaign, AppNotification, PlatformStats,
} from '@/components/polines/types'
import {
  formatRupiah, formatDate, getCategoryColor, getStatusColor, CATEGORIES,
  formatUniqueCode, PROPOSAL_CRITERIA, getAverageCriteria, isProposalEligible, getCriteriaScoreColor,
} from '@/components/polines/types'

// ============================================================
// PROPS
// ============================================================
interface DonaturDashboardProps {
  donaturTab: string
  setDonaturTab: (tab: string) => void
  campaigns: Campaign[]
  userDonations: Donation[]
  recommendations: {
    personalized: RecommendedCampaign[]
    trending: RecommendedCampaign[]
    becauseYouLiked: RecommendedCampaign[]
  }
  landingSearch: string
  setLandingSearch: (v: string) => void
  landingCategory: string
  setLandingCategory: (v: string) => void
  session: any
  openDonationModal: (campaign?: Campaign) => void
  fetchCampaignDetail: (id: string) => void
  notifications: AppNotification[]
  unreadCount: number
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  setView: (v: string) => void
  handleSignOut: () => void
  notifDropdownOpen: boolean
  setNotifDropdownOpen: (v: boolean) => void
  stats: PlatformStats | null
}

// ============================================================
// SIDEBAR MENU
// ============================================================
const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'campaign', label: 'Campaign', icon: Target },
  { id: 'riwayat', label: 'Donasi Saya', icon: HandHeart },
  { id: 'rekomendasi', label: 'Rekomendasi AI', icon: Sparkles },
  { id: 'profil', label: 'Profil', icon: UserCircle },
  { id: 'notifikasi', label: 'Notifikasi', icon: Bell },
]

const VALID_TABS = menuItems.map(m => m.id)

// ============================================================
// COMPONENT
// ============================================================
export function DonaturDashboard(props: DonaturDashboardProps) {
  const {
    donaturTab: propTab, setDonaturTab,
    campaigns, userDonations, recommendations,
    landingSearch, setLandingSearch, landingCategory, setLandingCategory,
    session, openDonationModal, fetchCampaignDetail,
    notifications, unreadCount,
    markNotificationRead, markAllNotificationsRead,
    setView, handleSignOut,
    notifDropdownOpen, setNotifDropdownOpen,
    stats,
  } = props

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const donaturTab = VALID_TABS.includes(propTab) ? propTab : 'dashboard'

  // ============================================================
  // COMPUTED
  // ============================================================
  const filteredCampaigns = campaigns.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(landingSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(landingSearch.toLowerCase())
    const matchCategory = landingCategory === 'all' || c.category === landingCategory
    return matchSearch && matchCategory
  })

  const totalDonations = userDonations.length
  const approvedDonations = userDonations.filter(d => d.status === 'approved')
  const pendingDonations = userDonations.filter(d => d.status === 'pending')
  const totalNominal = approvedDonations.reduce((s, d) => s + d.amount, 0)

  const topCampaigns = [...campaigns]
    .sort((a, b) => b.collectedAmount - a.collectedAmount)
    .slice(0, 5)

  const recentDonations = [...userDonations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  const latestCampaigns = [...campaigns]
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 3)

  const statsCards = [
    { label: 'Total Donasi', value: totalDonations, icon: HandHeart, color: 'from-teal-700 to-teal-600' },
    { label: 'Disetujui', value: approvedDonations.length, icon: CheckCircle2, color: 'from-emerald-700 to-emerald-600' },
    { label: 'Pending', value: pendingDonations.length, icon: Clock, color: 'from-amber-600 to-amber-500' },
    { label: 'Total Nominal', value: formatRupiah(totalNominal), icon: CreditCard, color: 'from-cyan-700 to-cyan-600' },
  ]

  const isActive = (id: string) => donaturTab === id

  const handleTabSwitch = (tab: string) => {
    setDonaturTab(tab)
    setMobileMenuOpen(false)
  }

  // ============================================================
  // HELPERS
  // ============================================================
  const renderProgress = (collected: number, target: number, showLabel = true) => {
    const pct = target > 0 ? Math.min((collected / target) * 100, 100) : 0
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Terkumpul</span>
          <span className="font-semibold text-teal-600">{formatRupiah(collected)}</span>
        </div>
        <Progress value={pct} className="h-2 [&>div]:bg-teal-500" />
        {showLabel && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatRupiah(target)}</span>
            <span>{target > 0 ? Math.round(pct) : 0}%</span>
          </div>
        )}
      </div>
    )
  }

  const renderMiniProgress = (c: RecommendedCampaign) => {
    const pct = c.targetAmount > 0 ? Math.min((c.collectedAmount / c.targetAmount) * 100, 100) : 0
    return (
      <>
        <Progress value={pct} className="h-1.5 mb-1 [&>div]:bg-teal-500" />
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span>{formatRupiah(c.collectedAmount)} / {formatRupiah(c.targetAmount)}</span>
          <span>{c._count?.donations || 0} donatur</span>
        </div>
      </>
    )
  }

  const renderMatchBadge = (match: number | undefined) => {
    if (match === undefined) return null
    const colorClass = match >= 70 ? 'bg-emerald-100 text-emerald-700' : match >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
    return <Badge className={`absolute bottom-2 right-2 text-xs font-bold ${colorClass}`}>{match}% cocok</Badge>
  }

  const renderUrgencyBadge = (isUrgent: boolean) => {
    if (!isUrgent) return null
    return (
      <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />Mendesak
      </Badge>
    )
  }

  // ============================================================
  // RENDER: SIDEBAR
  // ============================================================
  const renderSidebarContent = () => (
    <>
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 shrink-0">
          <Heart className="h-5 w-5 text-white" />
        </div>
        <div className="overflow-hidden">
          <h1 className="text-lg font-bold leading-tight">Polines Care</h1>
          <p className="text-[10px] text-teal-200 leading-tight">Panel Donatur</p>
        </div>
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white/20">
            <AvatarFallback className="bg-white/20 text-white text-sm font-bold">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden min-w-0">
            <p className="text-sm font-semibold truncate">{session?.user?.name}</p>
            <p className="text-[11px] text-teal-200 truncate">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon
          const active = isActive(item.id)
          return (
            <button
              key={item.id}
              onClick={() => handleTabSwitch(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                active ? 'bg-white/15 text-white shadow-sm' : 'text-teal-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-teal-200'}`} />
              <span>{item.label}</span>
              {item.id === 'notifikasi' && unreadCount > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
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
          onClick={() => { setView('landing'); setMobileMenuOpen(false) }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-teal-100 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
        >
          <HomeIcon className="h-5 w-5 shrink-0" />
          <span>Lihat Website</span>
        </button>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-200 hover:bg-red-500/20 hover:text-white transition-all cursor-pointer"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </>
  )

  const renderSidebar = () => (
    <aside
      className={`hidden lg:flex fixed top-0 left-0 h-full z-40 flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'w-18' : 'w-65'
      } bg-linear-to-br from-teal-700 to-teal-800 text-white`}
    >
      {/* Collapsed Logo */}
      {sidebarCollapsed ? (
        <div className="flex items-center justify-center h-16 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15 shrink-0">
            <Heart className="h-5 w-5 text-white" />
          </div>
        </div>
      ) : null}

      {sidebarCollapsed ? (
        <>
          <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            {menuItems.map(item => {
              const Icon = item.icon
              const active = isActive(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => setDonaturTab(item.id)}
                  title={item.label}
                  className={`w-full flex items-center justify-center relative px-2 py-2.5 rounded-lg transition-all duration-200 cursor-pointer ${
                    active ? 'bg-white/15 text-white shadow-sm' : 'text-teal-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-teal-200'}`} />
                  {item.id === 'notifikasi' && unreadCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
          <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-4">
            <button
              onClick={handleSignOut}
              title="Keluar"
              className="w-full flex items-center justify-center px-2 py-2.5 rounded-lg text-red-200 hover:bg-red-500/20 hover:text-white transition-all cursor-pointer"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </>
      ) : (
        renderSidebarContent()
      )}
    </aside>
  )

  // ============================================================
  // RENDER: MOBILE DRAWER
  // ============================================================
  const renderMobileDrawer = () => (
    <>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      <aside
        className={`fixed top-0 left-0 h-full z-50 w-70 flex flex-col transition-transform duration-300 ease-in-out lg:hidden bg-linear-to-br from-teal-700 to-teal-800 text-white ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="absolute top-4 right-3">
          <button onClick={() => setMobileMenuOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>
        {renderSidebarContent()}
      </aside>
    </>
  )

  // ============================================================
  // RENDER: TOP HEADER BAR
  // ============================================================
  const renderTopBar = () => (
    <div className="flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer lg:hidden"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            {menuItems.find(m => m.id === donaturTab)?.label || 'Dashboard'}
          </h2>
          <p className="text-xs text-gray-400 hidden sm:block">
            {donaturTab === 'dashboard' && 'Ringkasan donasi Anda'}
            {donaturTab === 'campaign' && 'Jelajahi campaign donasi'}
            {donaturTab === 'riwayat' && 'Riwayat donasi Anda'}
            {donaturTab === 'rekomendasi' && 'Rekomendasi AI untuk Anda'}
            {donaturTab === 'profil' && 'Profil dan pengaturan'}
            {donaturTab === 'notifikasi' && 'Pemberitahuan sistem'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setNotifDropdownOpen(!notifDropdownOpen) }}
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
                  <Button variant="ghost" size="sm" className="text-xs h-6" onClick={(e) => { e.stopPropagation(); markAllNotificationsRead() }}>
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
        <Avatar className="h-9 w-9 cursor-pointer hidden sm:flex">
          <AvatarFallback className="bg-teal-100 text-teal-700 text-sm font-bold">
            {session?.user?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  )

  // ============================================================
  // RENDER: DASHBOARD
  // ============================================================
  const renderDashboardView = () => (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-teal-600 to-emerald-600 rounded-xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar className="h-14 w-14 ring-3 ring-white/30 shrink-0">
            <AvatarFallback className="bg-white/20 text-white text-xl font-bold">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="text-xl font-bold">Selamat datang, {session?.user?.name?.split(' ')[0]}!</h2>
            <p className="text-sm text-teal-100 mt-1">Terima kasih sudah berpartisipasi dalam kebaikan.</p>
          </div>
          <Button className="bg-white text-teal-700 hover:bg-white/90 font-semibold shrink-0 shadow-sm" onClick={() => setDonaturTab('campaign')}>
            <HandHeart className="h-4 w-4 mr-1.5" /> Mulai Donasi
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className={`bg-linear-to-brr ${s.color} rounded-xl p-4 sm:p-5 text-white shadow-md`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs sm:text-sm font-medium text-white/80">{s.label}</p>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/15 flex items-center justify-center">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold">{s.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Donations */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Donasi Terakhir</CardTitle>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setDonaturTab('riwayat')}>Lihat Semua</Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentDonations.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">Belum ada donasi</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-teal-600 hover:bg-teal-600">
                      <TableHead className="text-white font-semibold text-xs">Campaign</TableHead>
                      <TableHead className="text-white font-semibold text-xs text-right">Nominal</TableHead>
                      <TableHead className="text-white font-semibold text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentDonations.map(d => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium text-sm max-w-40 truncate">{d.campaign?.title}</TableCell>
                        <TableCell className="font-semibold text-sm text-teal-600 text-right">{formatRupiah(d.amount)}</TableCell>
                        <TableCell><Badge className={getStatusColor(d.status)}>{d.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Campaigns */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Campaign Populer</CardTitle>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setDonaturTab('campaign')}>Lihat Semua</Button>
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'
                    }`}>{i + 1}</div>
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

      {/* Latest Campaigns */}
      {latestCampaigns.length > 0 && (
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Campaign Terbaru</CardTitle>
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setDonaturTab('campaign')}>Jelajahi</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestCampaigns.map(campaign => (
                <Card key={campaign.id} className="overflow-hidden hover:shadow-lg transition-shadow group border-gray-100">
                  <div className="relative">
                    <div className="h-28 bg-linear-to-brr from-teal-100 to-emerald-100 flex items-center justify-center">
                      <Heart className="h-10 w-10 text-teal-300 group-hover:scale-110 transition-transform" />
                    </div>
                    {campaign.isUrgent && <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs"><AlertTriangle className="h-3 w-3 mr-1" /> Mendesak</Badge>}
                    <Badge className={`absolute top-2 right-2 text-xs ${getCategoryColor(campaign.category)}`}>{campaign.category}</Badge>
                    {campaign.uniqueCode > 0 && (
                      <Badge className="absolute bottom-2 left-2 bg-violet-500 text-white text-[10px] font-mono font-bold">
                        Kode: {formatUniqueCode(campaign.uniqueCode)}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h4 className="font-semibold text-sm mb-1 line-clamp-1">{campaign.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{campaign.description}</p>
                    {renderProgress(campaign.collectedAmount, campaign.targetAmount, false)}
                    <Button size="sm" className="w-full mt-2 bg-teal-600 hover:bg-teal-700 text-white text-xs" onClick={() => openDonationModal(campaign)}>
                      <HandHeart className="h-3 w-3 mr-1" /> Donasi Sekarang
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Stats */}
      {stats && (
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-3"><CardTitle className="text-lg font-bold">Statistik Platform</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-teal-50">
                <p className="text-2xl font-bold text-teal-700">{stats.totalCampaigns}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Campaign</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-emerald-50">
                <p className="text-2xl font-bold text-emerald-700">{stats.totalDonations}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Transaksi</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-cyan-50">
                <p className="text-2xl font-bold text-cyan-700">{formatRupiah(stats.totalAmount)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Dana</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-amber-50">
                <p className="text-2xl font-bold text-amber-700">{stats.totalDonors}</p>
                <p className="text-xs text-muted-foreground mt-1">Total Donatur</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // ============================================================
  // RENDER: CAMPAIGN
  // ============================================================
  const renderCampaignView = () => (
    <div className="space-y-6">
      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari campaign..." className="pl-9" value={landingSearch} onChange={(e) => setLandingSearch(e.target.value)} />
            </div>
            <Select value={landingCategory} onValueChange={setLandingCategory}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {CATEGORIES.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCampaigns.length === 0 ? (
          <Card className="col-span-full p-12 text-center"><p className="text-muted-foreground">Tidak ada campaign ditemukan</p></Card>
        ) : (
          filteredCampaigns.map(campaign => (
            <Card key={campaign.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
              <div className="relative">
                <div className="h-36 bg-linear-to-brr from-teal-100 to-emerald-100 flex items-center justify-center">
                  <Heart className="h-14 w-14 text-teal-300 group-hover:scale-110 transition-transform" />
                </div>
                {campaign.isUrgent && <Badge className="absolute top-3 left-3 bg-red-500 text-white text-xs"><AlertTriangle className="h-3 w-3 mr-1" /> Mendesak</Badge>}
                <Badge className={`absolute top-3 right-3 text-xs ${getCategoryColor(campaign.category)}`}>{campaign.category}</Badge>
                {campaign.uniqueCode > 0 && (
                  <Badge className="absolute bottom-3 left-3 bg-violet-500 text-white text-[10px] font-mono font-bold">
                    Kode: {formatUniqueCode(campaign.uniqueCode)}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-1 line-clamp-1">{campaign.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{campaign.description}</p>
                {renderProgress(campaign.collectedAmount, campaign.targetAmount)}
              </CardContent>
              <div className="px-4 pb-4 pt-0 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => fetchCampaignDetail(campaign.id)}><Eye className="h-4 w-4 mr-1" /> Detail</Button>
                <Button size="sm" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => openDonationModal(campaign)}><HandHeart className="h-4 w-4 mr-1" /> Donasi</Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )

  // ============================================================
  // RENDER: RIWAYAT
  // ============================================================
  const renderRiwayatView = () => (
    <Card className="shadow-sm border-gray-100">
      <CardHeader><CardTitle className="text-lg font-bold">Donasi Saya ({userDonations.length})</CardTitle></CardHeader>
      <CardContent>
        {userDonations.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-1">Belum ada riwayat donasi</p>
            <p className="text-sm text-muted-foreground">Mulai berdonasi untuk membantu sesama</p>
            <Button className="mt-4 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setDonaturTab('campaign')}>
              <HandHeart className="h-4 w-4 mr-1" /> Mulai Donasi
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-600 hover:bg-teal-600">
                  <TableHead className="text-white font-semibold">Campaign</TableHead>
                  <TableHead className="text-white font-semibold hidden lg:table-cell">Kode Unik</TableHead>
                  <TableHead className="text-white font-semibold">Nominal</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Metode</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Tanggal</TableHead>
                  <TableHead className="text-white font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userDonations.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium max-w-50 truncate">{d.campaign?.title}</TableCell>
                    <TableCell className="hidden lg:table-cell font-mono text-xs text-violet-600">{(() => {
                      const camp = campaigns.find(c => c.id === d.campaignId)
                      return camp?.uniqueCode ? formatUniqueCode(camp.uniqueCode) : '-'
                    })()}</TableCell>
                    <TableCell className="font-semibold text-teal-600">{formatRupiah(d.amount)}</TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline">{d.paymentMethod}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatDate(d.createdAt)}</TableCell>
                    <TableCell><Badge className={getStatusColor(d.status)}>{d.status}</Badge></TableCell>
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
  // RENDER: REKOMENDASI AI
  // ============================================================
  const renderRekomendasiView = () => (
    <div className="space-y-8">
      <div className="p-4 bg-linear-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Rekomendasi Berbasis AI</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Rekomendasi dipersonalisasi berdasarkan riwayat donasi Anda, preferensi kategori, dan pola donasi donatur lainnya. Semakin sering berdonasi, semakin akurat rekomendasinya!
            </p>
          </div>
        </div>
      </div>

      {recommendations.becauseYouLiked.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" /> Karena Anda Suka
            <Badge variant="outline" className="text-xs">Collaborative Filtering</Badge>
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Campaign yang disukai oleh donatur dengan minat serupa</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recommendations.becauseYouLiked.map(c => (
              <Card key={c.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-28 bg-linear-to-brr from-pink-50 to-rose-50 flex items-center justify-center relative">
                  <Heart className="h-10 w-10 text-pink-300" />
                  <Badge className={`absolute top-2 right-2 text-xs ${getCategoryColor(c.category)}`}>{c.category}</Badge>
                  {renderUrgencyBadge(c.isUrgent)}
                  {renderMatchBadge(c.matchPercentage)}
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-1 line-clamp-1">{c.title}</h4>
                  {c.reason && <p className="text-xs text-teal-600 bg-teal-50 rounded px-2 py-1 mb-2">{c.reason}</p>}
                  {renderMiniProgress(c)}
                  <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={() => openDonationModal(c)}>
                    <HandHeart className="h-4 w-4 mr-1" /> Donasi
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" /> Rekomendasi Personal
          <Badge variant="outline" className="text-xs">Content-Based</Badge>
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Campaign yang sesuai dengan minat dan preferensi Anda</p>
        {recommendations.personalized.length === 0 ? (
          <Card className="p-8 text-center"><Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">Mulai berdonasi untuk mendapatkan rekomendasi personal</p></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recommendations.personalized.map(c => (
              <Card key={c.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-28 bg-linear-to-brr from-amber-50 to-orange-50 flex items-center justify-center relative">
                  <Star className="h-10 w-10 text-amber-300" />
                  <Badge className={`absolute top-2 right-2 text-xs ${getCategoryColor(c.category)}`}>{c.category}</Badge>
                  {renderUrgencyBadge(c.isUrgent)}
                  {renderMatchBadge(c.matchPercentage)}
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-1 line-clamp-1">{c.title}</h4>
                  {c.reason && <p className="text-xs text-teal-600 bg-teal-50 rounded px-2 py-1 mb-2">{c.reason}</p>}
                  {renderMiniProgress(c)}
                  <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={() => openDonationModal(c)}>
                    <HandHeart className="h-4 w-4 mr-1" /> Donasi
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-teal-500" /> Trending di Kampus
          <Badge variant="outline" className="text-xs">Popularity-Based</Badge>
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Campaign paling populer berdasarkan jumlah donatur</p>
        {recommendations.trending.length === 0 ? (
          <Card className="p-8 text-center"><p className="text-muted-foreground">Belum ada campaign trending</p></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recommendations.trending.map(c => (
              <Card key={c.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-28 bg-linear-to-brr from-teal-50 to-cyan-50 flex items-center justify-center relative">
                  <TrendingUp className="h-10 w-10 text-teal-300" />
                  <Badge className={`absolute top-2 right-2 text-xs ${getCategoryColor(c.category)}`}>{c.category}</Badge>
                  {renderUrgencyBadge(c.isUrgent)}
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-1 line-clamp-1">{c.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{c.description}</p>
                  {renderMiniProgress(c)}
                  <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={() => openDonationModal(c)}>
                    <HandHeart className="h-4 w-4 mr-1" /> Donasi
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  // ============================================================
  // RENDER: PROFIL
  // ============================================================
  const renderProfilView = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16 ring-2 ring-teal-200">
              <AvatarFallback className="bg-teal-100 text-teal-700 text-xl font-bold">
                {session?.user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{session?.user?.name}</h2>
              <p className="text-muted-foreground">{session?.user?.email}</p>
              <Badge variant="secondary" className="mt-1">Donatur</Badge>
            </div>
          </div>
          <Separator className="mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{session?.user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{(session?.user as any)?.phone || 'Belum diatur'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-100">
        <CardHeader><CardTitle className="text-lg font-bold">Ringkasan Donasi</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg bg-teal-50">
              <p className="text-2xl font-bold text-teal-700">{totalDonations}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Donasi</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-emerald-50">
              <p className="text-2xl font-bold text-emerald-700">{approvedDonations.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Disetujui</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-amber-50">
              <p className="text-2xl font-bold text-amber-700">{pendingDonations.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Pending</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-cyan-50">
              <p className="text-2xl font-bold text-cyan-700">{formatRupiah(totalNominal)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Nominal</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent donations detail */}
      {userDonations.length > 0 && (
        <Card className="shadow-sm border-gray-100">
          <CardHeader><CardTitle className="text-lg font-bold">Donasi Terakhir</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-teal-600 hover:bg-teal-600">
                    <TableHead className="text-white font-semibold">Campaign</TableHead>
                    <TableHead className="text-white font-semibold">Nominal</TableHead>
                    <TableHead className="text-white font-semibold">Status</TableHead>
                    <TableHead className="text-white font-semibold hidden md:table-cell">Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userDonations.slice(0, 10).map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium max-w-50 truncate">{d.campaign?.title}</TableCell>
                      <TableCell className="font-semibold text-teal-600">{formatRupiah(d.amount)}</TableCell>
                      <TableCell><Badge className={getStatusColor(d.status)}>{d.status}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{formatDate(d.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // ============================================================
  // RENDER: NOTIFIKASI
  // ============================================================
  const renderNotifikasiView = () => (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">Notifikasi</CardTitle>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" className="text-xs" onClick={markAllNotificationsRead}>
            Tandai semua dibaca
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Tidak ada notifikasi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`p-4 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${!n.isRead ? 'bg-teal-50/50 border-teal-100' : 'border-gray-100'}`}
                onClick={() => markNotificationRead(n.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!n.isRead ? 'bg-teal-500' : 'bg-gray-300'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )

  // ============================================================
  // RENDER CONTENT SWITCH
  // ============================================================
  const renderContent = () => {
    switch (donaturTab) {
      case 'campaign': return renderCampaignView()
      case 'riwayat': return renderRiwayatView()
      case 'rekomendasi': return renderRekomendasiView()
      case 'profil': return renderProfilView()
      case 'notifikasi': return renderNotifikasiView()
      default: return renderDashboardView()
    }
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50/80" onClick={() => { if (notifDropdownOpen) setNotifDropdownOpen(false) }}>
      {renderSidebar()}
      {renderMobileDrawer()}

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-18' : 'lg:ml-65'}`}>
        {renderTopBar()}
        <main className="p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
