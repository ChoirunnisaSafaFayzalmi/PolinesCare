'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Heart, Menu, X, Bell, LogOut, ChevronDown, Search,
  Plus, Edit, Trash2, Check, AlertTriangle, TrendingUp,
  Users, ArrowLeft, ArrowRight, Calendar,
  Phone, Mail, Globe, CreditCard, QrCode, Banknote,
  Eye, ThumbsUp, ThumbsDown, FileText, BarChart3,
  Activity, Gift, Shield, Star, MapPin, Building2, Award,
  ChevronRight, ExternalLink, Send, CircleDollarSign, Home as HomeIcon,
  Megaphone, Vote, ClipboardList, UserCircle, LayoutDashboard,
  HandHeart, DollarSign, UserPlus, Sparkles, Trophy,
} from 'lucide-react'

// Types & Helpers
import type { Campaign, Donation, Proposal, AppNotification, RecommendedCampaign, FundUsage, PlatformStats } from '@/components/polines/types'
import { CATEGORIES, formatRupiah, formatDate, getCategoryColor, getStatusColor } from '@/components/polines/types'

// Components
import { Header } from '@/components/polines/header'
import { Footer } from '@/components/polines/footer'
import { LandingPage } from '@/components/polines/landing-page'
import { LoginPage } from '@/components/polines/login-page'
import { RegisterPage } from '@/components/polines/register-page'
import { AdminDashboard } from '@/components/polines/admin-dashboard'
import { DonaturDashboard } from '@/components/polines/donatur-dashboard'
import { DonationModal } from '@/components/polines/donation-modal'
import { CampaignDetailModal } from '@/components/polines/campaign-detail-modal'
import { CampaignFormModal } from '@/components/polines/campaign-form-modal'
import { ProposalFormModal } from '@/components/polines/proposal-form-modal'
import { FundUsageModal } from '@/components/polines/fund-usage-modal'

// ============================================================
// MAIN APP COMPONENT
// ============================================================
export default function Home() {
  const { data: session, status: sessionStatus } = useSession()

  // ---- View State ----
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'admin' | 'donatur'>('landing')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false)

  // ---- Data States ----
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [recommendations, setRecommendations] = useState<{ personalized: RecommendedCampaign[]; trending: RecommendedCampaign[]; becauseYouLiked: RecommendedCampaign[] }>({ personalized: [], trending: [], becauseYouLiked: [] })
  const [publicRecommendations, setPublicRecommendations] = useState<RecommendedCampaign[]>([])
  const [fundUsages, setFundUsages] = useState<FundUsage[]>([])
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([])

  // ---- Filter States ----
  const [landingSearch, setLandingSearch] = useState('')
  const [landingCategory, setLandingCategory] = useState('all')
  const [adminCampaignFilter, setAdminCampaignFilter] = useState('all')
  const [adminCampaignStatus, setAdminCampaignStatus] = useState('all')
  const [donationFilter, setDonationFilter] = useState('all')
  const [adminTab, setAdminTab] = useState('campaign')
  const [donaturTab, setDonaturTab] = useState('donasi')
  const [reportCampaignId, setReportCampaignId] = useState('')

  // ---- Modal States ----
  const [donationModalOpen, setDonationModalOpen] = useState(false)
  const [campaignFormModalOpen, setCampaignFormModalOpen] = useState(false)
  const [proposalFormModalOpen, setProposalFormModalOpen] = useState(false)
  const [campaignDetailModalOpen, setCampaignDetailModalOpen] = useState(false)
  const [fundUsageModalOpen, setFundUsageModalOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)

  // ---- Donation Form State ----
  const [donationStep, setDonationStep] = useState(1)
  const [donationForm, setDonationForm] = useState({
    campaignId: '', type: 'uang', amount: '', paymentMethod: 'transfer', message: '', proofUrl: ''
  })

  // ---- Campaign Form State ----
  const [campaignForm, setCampaignForm] = useState({
    title: '', description: '', category: 'Sosial', targetAmount: '',
    startDate: '', endDate: '', isUrgent: false
  })

  // ---- Proposal Form State ----
  const [proposalForm, setProposalForm] = useState({
    title: '', description: '', category: 'Sosial', targetAmount: ''
  })

  // ---- Fund Usage Form State ----
  const [fundUsageForm, setFundUsageForm] = useState({ campaignId: '', description: '', amount: '' })

  // ---- Auth Form States ----
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ---- Campaign Detail State ----
  const [campaignDonations, setCampaignDonations] = useState<Donation[]>([])

  // ============================================================
  // DATA FETCHING
  // ============================================================
  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns?status=active')
      if (res.ok) { const data = await res.json(); setCampaigns(data.campaigns || data || []) }
    } catch { /* silent */ }
  }, [])

  const fetchAllCampaigns = useCallback(async () => {
    try {
      const res = await fetch('/api/campaigns')
      if (res.ok) { const data = await res.json(); setAllCampaigns(data.campaigns || data || []) }
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

  const fetchPublicRecommendations = useCallback(async () => {
    try {
      const res = await fetch('/api/recommendations?mode=public')
      if (res.ok) { const data = await res.json(); setPublicRecommendations(data.recommendations || data.trending || []) }
    } catch { /* silent */ }
  }, [])

  const fetchRecommendations = useCallback(async () => {
    try {
      const res = await fetch('/api/recommendations')
      if (res.ok) {
        const data = await res.json()
        setRecommendations({
          personalized: data.personalized || [],
          trending: data.trending || [],
          becauseYouLiked: data.becauseYouLiked || [],
        })
      }
    } catch { /* silent */ }
  }, [session?.user?.id])

  const fetchFundUsages = useCallback(async (campaignId: string) => {
    if (!campaignId) { setFundUsages([]); return }
    try {
      const res = await fetch(`/api/fund-usage?campaignId=${campaignId}`)
      if (res.ok) { const data = await res.json(); setFundUsages(data.fundUsages || data || []) }
    } catch { setFundUsages([]) }
  }, [])

  const fetchCampaignDetail = useCallback(async (campaignId: string) => {
    try {
      const [campRes, donRes] = await Promise.all([
        fetch(`/api/campaigns/${campaignId}`),
        fetch(`/api/donations?campaignId=${campaignId}`)
      ])
      if (campRes.ok) { const data = await campRes.json(); setSelectedCampaign(data); setCampaignDetailModalOpen(true) }
      if (donRes.ok) { const donData = await donRes.json(); setCampaignDonations(donData.donations || donData || []) }
    } catch { toast.error('Gagal memuat detail campaign') }
  }, [])

  // ---- Load initial data ----
  useEffect(() => {
    fetchCampaigns(); fetchStats(); fetchProposals(); fetchPublicRecommendations()
  }, [fetchCampaigns, fetchStats, fetchProposals, fetchPublicRecommendations])

  useEffect(() => {
    if (session?.user) {
      fetchDonations(); fetchNotifications(); fetchAllCampaigns()
      if (session.user.role === 'donatur') fetchRecommendations()
      if (session.user.role === 'admin') { fetchAllCampaigns(); fetchDonations() }
    }
  }, [session?.user, fetchDonations, fetchNotifications, fetchAllCampaigns, fetchRecommendations])

  useEffect(() => {
    if (session?.user) {
      setView(session.user.role === 'admin' ? 'admin' : 'donatur')
    } else {
      setView('landing')
    }
  }, [session?.user])

  useEffect(() => {
    if (reportCampaignId) fetchFundUsages(reportCampaignId)
  }, [reportCampaignId, fetchFundUsages])

  // ============================================================
  // AUTH HANDLERS
  // ============================================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const result = await signIn('credentials', { email: loginForm.email, password: loginForm.password, redirect: false })
      if (result?.error) {
        toast.error(result.error === 'CredentialsSignin' ? 'Email atau password salah' : result.error)
      } else { toast.success('Berhasil masuk!'); setView('landing') }
    } catch { toast.error('Terjadi kesalahan saat masuk') }
    finally { setLoading(false) }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (registerForm.password !== registerForm.confirmPassword) { toast.error('Password dan konfirmasi tidak cocok'); return }
    if (registerForm.password.length < 6) { toast.error('Password minimal 6 karakter'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: registerForm.name, email: registerForm.email, phone: registerForm.phone, password: registerForm.password })
      })
      const data = await res.json()
      if (res.ok) { toast.success('Registrasi berhasil! Silakan masuk.'); setView('login') }
      else { toast.error(data.error || 'Gagal mendaftar') }
    } catch { toast.error('Terjadi kesalahan saat mendaftar') }
    finally { setLoading(false) }
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false }); setView('landing'); toast.success('Berhasil keluar')
  }

  // ============================================================
  // DONATION HANDLERS
  // ============================================================
  const openDonationModal = (campaign?: Campaign) => {
    if (campaign) {
      setDonationForm({ ...donationForm, campaignId: campaign.id }); setSelectedCampaign(campaign)
    } else {
      setDonationForm({ campaignId: '', type: 'uang', amount: '', paymentMethod: 'transfer', message: '', proofUrl: '' }); setSelectedCampaign(null)
    }
    setDonationStep(1); setDonationModalOpen(true)
  }

  const submitDonation = async () => {
    if (!session?.user) { toast.error('Silakan masuk terlebih dahulu'); return }
    if (!donationForm.campaignId) { toast.error('Pilih campaign terlebih dahulu'); return }
    if (donationForm.type === 'uang' && !donationForm.amount) { toast.error('Masukkan nominal donasi'); return }
    if (!donationForm.amount || Number(donationForm.amount) <= 0) { toast.error('Masukkan nominal yang valid'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/donations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: donationForm.campaignId, amount: Number(donationForm.amount),
          donorName: session.user.name, donorEmail: session.user.email,
          donorPhone: (session.user as any)?.phone || '-',
          type: donationForm.type, paymentMethod: donationForm.paymentMethod,
          message: donationForm.message, proofUrl: donationForm.proofUrl || undefined
        })
      })
      if (res.ok) {
        setDonationStep(3); toast.success('Donasi berhasil dikirim!')
        fetchCampaigns(); fetchStats(); fetchDonations()
        if (session.user.role === 'donatur') fetchRecommendations()
      } else { const data = await res.json(); toast.error(data.error || 'Gagal mengirim donasi') }
    } catch { toast.error('Terjadi kesalahan') }
    finally { setSubmitting(false) }
  }

  // ============================================================
  // CAMPAIGN CRUD (Admin)
  // ============================================================
  const openCampaignForm = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign)
      setCampaignForm({
        title: campaign.title, description: campaign.description, category: campaign.category,
        targetAmount: String(campaign.targetAmount), startDate: campaign.startDate.split('T')[0],
        endDate: campaign.endDate.split('T')[0], isUrgent: campaign.isUrgent
      })
    } else {
      setEditingCampaign(null)
      setCampaignForm({ title: '', description: '', category: 'Sosial', targetAmount: '', startDate: '', endDate: '', isUrgent: false })
    }
    setCampaignFormModalOpen(true)
  }

  const submitCampaign = async () => {
    setSubmitting(true)
    try {
      const body = { ...campaignForm, targetAmount: Number(campaignForm.targetAmount), startDate: new Date(campaignForm.startDate).toISOString(), endDate: new Date(campaignForm.endDate).toISOString() }
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
  // PROPOSAL HANDLERS
  // ============================================================
  const submitProposal = async () => {
    if (!session?.user) return; setSubmitting(true)
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: proposalForm.title, description: proposalForm.description, category: proposalForm.category, targetAmount: proposalForm.targetAmount ? Number(proposalForm.targetAmount) : undefined })
      })
      if (res.ok) { toast.success('Proposal berhasil dikirim'); setProposalFormModalOpen(false); fetchProposals() }
      else { const data = await res.json(); toast.error(data.error || 'Gagal mengirim proposal') }
    } catch { toast.error('Terjadi kesalahan') }
    finally { setSubmitting(false) }
  }

  const updateProposalStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
      if (res.ok) { toast.success(`Proposal berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`); fetchProposals(); fetchNotifications() }
      else toast.error('Gagal memperbarui proposal')
    } catch { toast.error('Terjadi kesalahan') }
  }

  const voteProposal = async (id: string) => {
    if (!session?.user) return
    try { const res = await fetch('/api/proposals/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proposalId: id }) }); if (res.ok) fetchProposals() } catch { /* silent */ }
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

  const filteredLandingCampaigns = campaigns.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(landingSearch.toLowerCase()) || c.description.toLowerCase().includes(landingSearch.toLowerCase())
    const matchCategory = landingCategory === 'all' || c.category === landingCategory
    return matchSearch && matchCategory
  })

  const filteredAdminCampaigns = allCampaigns.filter(c => {
    const matchStatus = adminCampaignStatus === 'all' || c.status === adminCampaignStatus
    const matchCategory = adminCampaignFilter === 'all' || c.category === adminCampaignFilter
    return matchStatus && matchCategory
  })

  const filteredDonations = donations.filter(d => donationFilter === 'all' || d.status === donationFilter)
  const userDonations = donations.filter(d => d.userId === session?.user?.id)

  // ============================================================
  // HANDLERS PASSED TO COMPONENTS
  // ============================================================
  const headerProps = {
    session, view, setView, setAdminTab, setDonaturTab,
    mobileMenuOpen, setMobileMenuOpen,
    notifDropdownOpen, setNotifDropdownOpen, unreadCount,
    notifications, markNotificationRead, markAllNotificationsRead,
    handleSignOut,
  }

  const landingProps = {
    campaigns: filteredLandingCampaigns, stats, publicRecommendations,
    proposals, landingSearch, setLandingSearch, landingCategory, setLandingCategory,
    session, setSelectedCampaign, fetchCampaignDetail, openDonationModal,
    setProposalFormModalOpen, voteProposal, setView,
  }

  const loginProps = { handleLogin, loginForm, setLoginForm, loading, setView }
  const registerProps = { handleRegister, registerForm, setRegisterForm, loading, setView }

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header {...headerProps} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Memuat...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <div className="flex flex-col min-h-screen" onClick={() => { if (notifDropdownOpen) setNotifDropdownOpen(false) }}>
      <Header {...headerProps} />

      <main className="flex-1">
        {view === 'landing' && <LandingPage {...landingProps} />}
        {view === 'login' && <LoginPage {...loginProps} />}
        {view === 'register' && <RegisterPage {...registerProps} />}
        {view === 'admin' && session?.user?.role === 'admin' && (
          <AdminDashboard
            adminTab={adminTab} setAdminTab={setAdminTab}
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
          />
        )}
        {view === 'donatur' && session?.user?.role === 'donatur' && (
          <DonaturDashboard
            donaturTab={donaturTab} setDonaturTab={setDonaturTab}
            campaigns={campaigns} userDonations={userDonations}
            recommendations={recommendations}
            landingSearch={landingSearch} setLandingSearch={setLandingSearch}
            landingCategory={landingCategory} setLandingCategory={setLandingCategory}
            session={session} openDonationModal={openDonationModal}
            fetchCampaignDetail={fetchCampaignDetail}
          />
        )}

        {/* Fallback if role doesn't match */}
        {view === 'admin' && session?.user?.role !== 'admin' && (
          <div className="min-h-[60vh] flex items-center justify-center">
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Anda tidak memiliki akses ke halaman ini</p>
              <Button className="mt-4 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setView('landing')}>Kembali</Button>
            </Card>
          </div>
        )}
      </main>

      <Footer />

      {/* Modals */}
      <DonationModal
        open={donationModalOpen} onClose={() => { setDonationModalOpen(false); setDonationStep(1) }}
        donationStep={donationStep} setDonationStep={setDonationStep}
        donationForm={donationForm} setDonationForm={setDonationForm}
        campaigns={campaigns} submitting={submitting}
        submitDonation={submitDonation} session={session}
      />
      <CampaignDetailModal
        open={campaignDetailModalOpen} onClose={() => { setCampaignDetailModalOpen(false); setSelectedCampaign(null) }}
        selectedCampaign={selectedCampaign} campaignDonations={campaignDonations}
        onDonate={() => { if (selectedCampaign) openDonationModal(selectedCampaign) }}
      />
      <CampaignFormModal
        open={campaignFormModalOpen} onClose={() => { setCampaignFormModalOpen(false); setEditingCampaign(null) }}
        editingCampaign={editingCampaign} campaignForm={campaignForm}
        setCampaignForm={setCampaignForm} submitting={submitting} onSubmit={submitCampaign}
      />
      <ProposalFormModal
        open={proposalFormModalOpen} onClose={() => setProposalFormModalOpen(false)}
        proposalForm={proposalForm} setProposalForm={setProposalForm}
        submitting={submitting} onSubmit={submitProposal}
      />
      <FundUsageModal
        open={fundUsageModalOpen} onClose={() => setFundUsageModalOpen(false)}
        fundUsageForm={fundUsageForm} setFundUsageForm={setFundUsageForm}
        allCampaigns={allCampaigns} submitting={submitting} onSubmit={submitFundUsage}
      />
    </div>
  )
}
