'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Types & Helpers
import type { Campaign, Donation, Proposal, AppNotification, RecommendedCampaign, PlatformStats } from '@/components/polines/types'
import { CATEGORIES, formatRupiah, formatDate, getCategoryColor, getStatusColor } from '@/components/polines/types'

// Components
import { Header } from '@/components/polines/header'
import { Footer } from '@/components/polines/footer'
import { LandingPage } from '@/components/polines/landing-page'
import { LoginPage } from '@/components/polines/login-page'
import { RegisterPage } from '@/components/polines/register-page'
import { DonaturDashboard } from '@/components/polines/donatur-dashboard'
import { DonationModal } from '@/components/polines/donation-modal'
import { CampaignDetailModal } from '@/components/polines/campaign-detail-modal'
import { ProposalFormModal } from '@/components/polines/proposal-form-modal'

// ============================================================
// MAIN APP COMPONENT (Landing + Login + Register + Donatur)
// ============================================================
export default function Home() {
  const { data: session, status: sessionStatus } = useSession()

  // ---- View State ----
  const [view, setView] = useState<string>('landing')
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

  // ---- Filter States ----
  const [landingSearch, setLandingSearch] = useState('')
  const [landingCategory, setLandingCategory] = useState('all')
  const [donaturTab, setDonaturTab] = useState('dashboard')

  // ---- Modal States ----
  const [donationModalOpen, setDonationModalOpen] = useState(false)
  const [proposalFormModalOpen, setProposalFormModalOpen] = useState(false)
  const [campaignDetailModalOpen, setCampaignDetailModalOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  // ---- Donation Form State ----
  const [donationStep, setDonationStep] = useState(1)
  const [donationForm, setDonationForm] = useState({
    campaignId: '', type: 'uang', amount: '', paymentMethod: 'transfer', message: '', proofUrl: ''
  })

  // ---- Proposal Form State ----
  const [proposalForm, setProposalForm] = useState({
    title: '', description: '', category: 'Sosial', targetAmount: ''
  })

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
      fetchDonations(); fetchNotifications()
      if (session.user.role === 'donatur') fetchRecommendations()
    }
  }, [session?.user, fetchDonations, fetchNotifications, fetchRecommendations])

  // ---- Set view based on login status ----
  useEffect(() => {
    if (sessionStatus === 'loading') return // wait for session to load
    if (session?.user) {
      const role = (session.user as any)?.role || session.user.role
      if (role === 'admin') {
        // Auto-redirect admin to admin dashboard
        window.location.href = '/admin/dashboard'
        return
      } else if (role === 'donatur') {
        setView('donatur')
      }
    } else {
      setView('landing')
    }
  }, [session?.user, sessionStatus])

  // ============================================================
  // AUTH HANDLERS
  // ============================================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: loginForm.email,
        password: loginForm.password,
        redirect: false,
      })
      if (result?.ok) {
        toast.success('Berhasil masuk!')
      } else {
        toast.error('Email atau password salah')
      }
    } catch {
      toast.error('Terjadi kesalahan saat masuk')
    }
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
    try { await signOut({ redirect: false }) } catch { /* ignore */ }
    toast.success('Berhasil keluar')
  }

  // ============================================================
  // DONATION HANDLERS (Donatur)
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
  // PROPOSAL HANDLERS (Donatur)
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

  const updateProfile = async (data: { name: string; phone: string }) => {
    if (!session?.user) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast.success('Profil berhasil diperbarui')
        window.location.reload()
      } else {
        const d = await res.json()
        toast.error(d.error || 'Gagal memperbarui profil')
      }
    } catch {
      toast.error('Terjadi kesalahan')
    }
    finally { setSubmitting(false) }
  }

  const voteProposal = async (id: string) => {
    if (!session?.user) return
    try { const res = await fetch('/api/proposals/vote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proposalId: id }) }); if (res.ok) fetchProposals() } catch { /* silent */ }
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

  const filteredLandingCampaigns = campaigns.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(landingSearch.toLowerCase()) || c.description.toLowerCase().includes(landingSearch.toLowerCase())
    const matchCategory = landingCategory === 'all' || c.category === landingCategory
    return matchSearch && matchCategory
  })

  const userDonations = donations.filter(d => d.userId === session?.user?.id)

  // ============================================================
  // HANDLERS PASSED TO COMPONENTS
  // ============================================================
  const headerProps = {
    session, view, setView, setDonaturTab,
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

  // Show redirecting message if admin is logged in (before window.location.href kicks in)
  if (session?.user && ((session.user as any)?.role || session.user.role) === 'admin') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header {...headerProps} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Mengalihkan ke Dashboard Admin...</p>
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
      {/* Global Header & Footer: hidden when donatur dashboard is active */}
      {view !== 'donatur' && <Header {...headerProps} />}

      <main className="flex-1">
        {view === 'landing' && <LandingPage {...landingProps} />}
        {view === 'login' && <LoginPage {...loginProps} />}
        {view === 'register' && <RegisterPage {...registerProps} />}
        {view === 'donatur' && session?.user?.role === 'donatur' && (
          <DonaturDashboard
            donaturTab={donaturTab} setDonaturTab={setDonaturTab}
            campaigns={campaigns} userDonations={userDonations}
            proposals={proposals}
            recommendations={recommendations}
            landingSearch={landingSearch} setLandingSearch={setLandingSearch}
            landingCategory={landingCategory} setLandingCategory={setLandingCategory}
            session={session} openDonationModal={openDonationModal}
            fetchCampaignDetail={fetchCampaignDetail}
            notifications={notifications} unreadCount={unreadCount}
            markNotificationRead={markNotificationRead}
            markAllNotificationsRead={markAllNotificationsRead}
            setView={setView} handleSignOut={handleSignOut}
            notifDropdownOpen={notifDropdownOpen} setNotifDropdownOpen={setNotifDropdownOpen}
            stats={stats}
            updateProfile={updateProfile}
          />
        )}
      </main>

      {view !== 'donatur' && <Footer />}

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
      <ProposalFormModal
        open={proposalFormModalOpen} onClose={() => setProposalFormModalOpen(false)}
        proposalForm={proposalForm} setProposalForm={setProposalForm}
        submitting={submitting} onSubmit={submitProposal}
      />
    </div>
  )
}
