'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  Heart, Search, AlertTriangle, Target, HandCoins, Users,
  Clock, Eye, HandHeart, UserPlus,
  Sparkles, Shield, Award, CircleDollarSign,
  FileEdit, ClipboardCheck, Megaphone, PartyPopper, Lock, LogIn,
  CheckCircle2,
} from 'lucide-react'
import { formatRupiah, formatDate, getCategoryColor, CATEGORIES } from './types'
import type { Campaign, PlatformStats, RecommendedCampaign } from './types'
import { CampaignDetailModal } from './donatur/campaign-detail-modal'
import { useInView } from '../../hooks/use-in-view'

// ══════════════════════════════════════════════
// Komponen kecil: angka yang "hidup" (count-up)
// ══════════════════════════════════════════════
function AnimatedNumber({ value, isLoading, format }: { value: number; isLoading: boolean; format?: (n: number) => string }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (isLoading) return
    let frame: number
    const duration = 900
    const start = performance.now()
    const from = 0
    const to = value

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, isLoading])

  if (isLoading) {
    return <span className="inline-block h-6 w-16 rounded-md bg-black/10 animate-pulse align-middle" />
  }
  return <>{format ? format(display) : display}</>
}

// ══════════════════════════════════════════════
// Wrapper scroll-reveal
// ══════════════════════════════════════════════
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`${inView ? 'pc-fade-up' : 'opacity-0'} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ══════════════════════════════════════════════
// Data statis
// ══════════════════════════════════════════════
const CROWDSOURCING_STEPS = [
  {
    icon: FileEdit,
    title: 'Ajukan Proposal',
    desc: 'Donatur terdaftar mengajukan ide program bantuan lewat form singkat — judul, kategori, dan target dana.',
    accent: 'from-[var(--pc-teal,#0D9488)] to-[var(--pc-teal-deep,#0B4F4A)]',
    tint: 'bg-teal-50',
  },
  {
    icon: ClipboardCheck,
    title: 'Direview Admin',
    desc: 'Tim admin Polines Care meninjau kelayakan dan kelengkapan data secara internal sebelum disetujui.',
    accent: 'from-[var(--pc-emerald,#10B981)] to-[var(--pc-teal)]',
    tint: 'bg-emerald-50',
  },
  {
    icon: Megaphone,
    title: 'Dibuka Jadi Campaign',
    desc: 'Proposal yang disetujui otomatis diterbitkan sebagai campaign donasi aktif dan tampil di beranda.',
    accent: 'from-[var(--pc-gold,#FBBF24)] to-[var(--pc-coral,#F9714E)]',
    tint: 'bg-amber-50',
  },
  {
    icon: PartyPopper,
    title: 'Dampak Nyata',
    desc: 'Donatur lain mulai berdonasi ke campaign hasil pengajuanmu — dari ide jadi bantuan yang sampai.',
    accent: 'from-[var(--pc-coral,#F9714E)] to-red-400',
    tint: 'bg-orange-50',
  },
]

const RECOMMENDATION_SIGNALS = [
  { label: 'Riwayat Kategori', desc: 'Kategori yang paling sering kamu donasikan', icon: Heart, tint: 'bg-[var(--pc-coral,#F9714E)]/10', iconColor: 'text-[var(--pc-coral,#F9714E)]' },
  { label: 'Donatur Serupa', desc: 'Disukai donatur dengan minat mirip kamu', icon: Users, tint: 'bg-[var(--pc-teal,#0D9488)]/10', iconColor: 'text-[var(--pc-teal,#0D9488)]' },
  { label: 'Progres Dana', desc: 'Campaign yang butuh dorongan terakhir', icon: Target, tint: 'bg-[var(--pc-emerald,#10B981)]/10', iconColor: 'text-[var(--pc-emerald,#10B981)]' },
  { label: 'Urgensi', desc: 'Campaign berstatus mendesak diprioritaskan', icon: AlertTriangle, tint: 'bg-[var(--pc-gold,#FBBF24)]/15', iconColor: 'text-amber-600' },
]

// ── Mini komponen: cincin persentase (match-meter) ──
function MatchRing({ percent, size = 64, color }: { percent: number; size?: number; color: string }) {
  const stroke = 6
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (percent / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle" className="fill-current" fontSize={size * 0.26} fontWeight={700}>
        {percent}%
      </text>
    </svg>
  )
}

export function LandingPage() {
  const { data: session } = useSession()
  const router = useRouter()

  // ── State ──
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<PlatformStats | null>(null) // null = belum selesai fetch
  const [personalRecommendations, setPersonalRecommendations] = useState<RecommendedCampaign[] | null>(null) // null = belum di-fetch
  const [landingSearch, setLandingSearch] = useState('')
  const [landingCategory, setLandingCategory] = useState('all')

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [campaignDetailModalOpen, setCampaignDetailModalOpen] = useState(false)
  const [campaignDonations, setCampaignDonations] = useState([])

  // ── Derived loading state (dihitung, bukan disimpan sbg state terpisah) ──
  const statsLoading = stats === null
  const recsLoading = !!session?.user && personalRecommendations === null

  // ---- Fetch Data ----
  useEffect(() => {
    fetch('/api/campaigns?status=active')
      .then(r => r.json())
      .then(d => setCampaigns(d.campaigns || []))
      .catch(() => {})

    fetch('/api/stats')
      .then(r => r.json())
      .then(d => {
        setStats({
          totalCampaigns: d.campaigns?.total ?? d.totalCampaigns ?? 0,
          totalDonations: d.donations?.total ?? d.totalDonations ?? 0,
          totalAmount: d.donations?.totalAmount ?? d.totalAmount ?? 0,
          totalDonors: d.users?.total ?? d.totalDonors ?? 0,
          categoryBreakdown: d.campaigns?.byCategory || [],
          typeBreakdown: d.donations?.byType || [],
          recentDonations: d.recentDonations || [],
        })
      })
      .catch((err) => {
        console.error('Gagal memuat statistik:', err)
        setStats({
          totalCampaigns: 0, totalDonations: 0, totalAmount: 0, totalDonors: 0,
          categoryBreakdown: [], typeBreakdown: [], recentDonations: [],
        })
      })
  }, [])

  // Rekomendasi personal — hanya jalan kalau user login
  useEffect(() => {
    if (!session?.user) return

    let ignore = false
    fetch('/api/recommendations?mode=personal')
      .then(r => r.json())
      .then(d => { if (!ignore) setPersonalRecommendations(d.recommendations || []) })
      .catch(() => { if (!ignore) setPersonalRecommendations([]) })

    return () => { ignore = true }
  }, [session])

  // ── Computed ──
  const filteredLandingCampaigns = campaigns.filter(c => {
    const matchSearch =
      c.title.toLowerCase().includes(landingSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(landingSearch.toLowerCase())
    const matchCategory = landingCategory === 'all' || c.category === landingCategory
    return matchSearch && matchCategory
  })

  // ── Handlers ──
  const fetchCampaignDetail = useCallback(async (id: string) => {
    try {
      const [campRes, donRes] = await Promise.all([
        fetch(`/api/campaigns/${id}`),
        fetch(`/api/donations?campaignId=${id}`),
      ])
      if (campRes.ok) {
        const d = await campRes.json()
        setSelectedCampaign(d.campaign)
        setCampaignDetailModalOpen(true)
      }
      if (donRes.ok) {
        const d = await donRes.json()
        setCampaignDonations(d.donations || [])
      }
    } catch {}
  }, [])

  const openDonationModal = useCallback((campaign?: Campaign) => {
    if (!session?.user) {
      const callbackUrl = campaign ? `/donasi?campaignId=${campaign.id}` : '/donasi'
      router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      return
    }
    router.push(campaign ? `/donasi?campaignId=${campaign.id}` : '/donasi')
  }, [session, router])

  return (
    <div className="min-h-screen bg-[var(--pc-sand,#FAF7F1)] font-[family-name:var(--font-body)]">

      {/* ══════════════ HERO ══════════════ */}
      <section className="relative overflow-hidden bg-[var(--pc-teal-deep,#0B4F4A)] text-white">
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="absolute -top-24 -left-16 w-96 h-96 rounded-full bg-[var(--pc-emerald,#10B981)]/30 blur-3xl pc-blob" />
        <div className="absolute -bottom-32 -right-10 w-[28rem] h-[28rem] rounded-full bg-[var(--pc-coral,#F9714E)]/20 blur-3xl pc-blob" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-[var(--pc-gold,#FBBF24)]/10 blur-3xl pc-blob" style={{ animationDelay: '6s' }} />

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden md:block">
          {[0, 1.3, 2.6].map((delay, i) => (
            <span
              key={i}
              className="pc-ripple-ring"
              style={{ width: 280, height: 280, left: -140, top: -140, animationDelay: `${delay}s` }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <div className="max-w-3xl mx-auto text-center pc-fade-up">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6 border border-white/10">
              <Heart className="h-4 w-4 text-[var(--pc-coral,#F9714E)]" />
              <span>Platform Donasi Kampus Polines</span>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-6xl font-extrabold mb-4 leading-tight tracking-tight">
              <span className="text-[var(--pc-gold,#FBBF24)]">Setiap Donasi,</span> Ada <span className="text-[var(--pc-gold,#FBBF24)]">Kebaikan</span> yang Menyebar
            </h1>
            <p className="text-lg md:text-xl text-teal-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Salurkan kepedulianmu untuk sesama di lingkungan kampus Politeknik Negeri Semarang —
              satu donasi kecil, dampaknya bisa terus menyebar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="pc-cta-glow bg-[var(--pc-gold,#FBBF24)] hover:bg-[var(--pc-gold,#FBBF24)]/90 text-white font-semibold px-8 shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5"
                onClick={() => document.getElementById('campaigns-section')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <HandHeart className="h-5 w-5 mr-2" /> Mulai Donasi
              </Button>
              {!session?.user && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white/60 text-white bg-white/5 hover:bg-white hover:text-[var(--pc-teal-deep,#0B4F4A)] px-8 font-semibold transition-colors"
                  onClick={() => router.push('/register')}
                >
                  <UserPlus className="h-5 w-5 mr-2" /> Daftar Sekarang
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--pc-sand,#FAF7F1)] to-transparent" />
      </section>

      {/* ══════════════ STATS ══════════════ */}
      <section className="container mx-auto px-4 -mt-8 relative z-20 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Target className="h-6 w-6" />, label: 'Total Campaign', value: stats?.totalCampaigns ?? 0, color: 'bg-[var(--pc-teal,#0D9488)]' },
            { icon: <HandCoins className="h-6 w-6" />, label: 'Total Donasi', value: stats?.totalDonations ?? 0, color: 'bg-[var(--pc-emerald,#10B981)]' },
            { icon: <CircleDollarSign className="h-6 w-6" />, label: 'Dana Terkumpul', value: stats?.totalAmount ?? 0, color: 'bg-[var(--pc-coral,#F9714E)]', format: formatRupiah },
            { icon: <Users className="h-6 w-6" />, label: 'Total Donatur', value: stats?.totalDonors ?? 0, color: 'bg-[var(--pc-teal-deep,#0B4F4A)]' },
          ].map((stat, i) => (
            <Reveal key={i} delay={i * 80}>
              <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow">
                <CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4">
                  <div className={`${stat.color} text-white rounded-xl p-2.5 md:p-3 shrink-0`}>{stat.icon}</div>
                  <div>
                    <p className="text-xl md:text-2xl font-bold font-[family-name:var(--font-display)]">
                      <AnimatedNumber value={stat.value} isLoading={statsLoading} format={stat.format} />
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════ ACTIVE CAMPAIGNS ══════════════ */}
      <section id="campaigns-section" className="container mx-auto px-4 py-12">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-display)]">Campaign Aktif</h2>
              <p className="text-muted-foreground mt-1">Bantu campaign yang sedang berjalan</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari campaign..."
                  className="pl-9 w-full sm:w-64"
                  value={landingSearch}
                  onChange={(e) => setLandingSearch(e.target.value)}
                />
              </div>
              <Select value={landingCategory} onValueChange={setLandingCategory}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Reveal>

        {filteredLandingCampaigns.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Tidak ada campaign yang ditemukan</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredLandingCampaigns.map((campaign, i) => (
              <Reveal key={campaign.id} delay={(i % 3) * 100}>
                <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group p-0">
                  <div className="relative">
                    {campaign.images && campaign.images.length > 0 ? (
                      <img
                        src={campaign.images[0]}
                        alt={campaign.title}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-40 bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                        <Heart className="h-16 w-16 text-teal-300 group-hover:scale-110 transition-transform" />
                      </div>
                    )}
                    {campaign.isUrgent && (
                      <Badge className="absolute top-3 left-3 bg-[var(--pc-coral,#F9714E)] text-white text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Mendesak
                      </Badge>
                    )}
                    <Badge className={`absolute top-3 right-3 text-xs ${getCategoryColor(campaign.category)}`}>
                      {campaign.category}
                    </Badge>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{campaign.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{campaign.description}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Terkumpul</span>
                        <span className="font-semibold text-[var(--pc-teal,#0D9488)]">{formatRupiah(campaign.collectedAmount)}</span>
                      </div>
                      <Progress
                        value={campaign.targetAmount > 0 ? Math.min((campaign.collectedAmount / campaign.targetAmount) * 100, 100) : 0}
                        className="h-2 [&>div]:bg-[var(--pc-teal,#0D9488)]"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Target: {formatRupiah(campaign.targetAmount)}</span>
                        <span>{campaign.targetAmount > 0 ? Math.round((campaign.collectedAmount / campaign.targetAmount) * 100) : 0}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {campaign._count?.donations ?? 0} donatur</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(campaign.endDate)}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="px-5 pb-5 pt-0 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1"
                      onClick={() => fetchCampaignDetail(campaign.id)}>
                      <Eye className="h-4 w-4 mr-1" /> Detail
                    </Button>
                    <Button size="sm" className="flex-1 bg-[var(--pc-teal,#0D9488)] hover:bg-[var(--pc-teal-deep,#0B4F4A)] text-white"
                      onClick={() => openDonationModal(campaign)}>
                      <HandHeart className="h-4 w-4 mr-1" /> Donasi
                    </Button>
                  </CardFooter>
                </Card>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════ CROWDSOURCING — bg solid teal, step kotak kartu (spt About) ══════════════ */}
      <section className="relative py-20 overflow-hidden bg-[var(--pc-teal-deep,#0B4F4A)] text-white">
        {/* dekorasi background */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '26px 26px',
          }}
        />
        <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-[var(--pc-gold,#FBBF24)]/10 blur-3xl pc-blob" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[var(--pc-coral,#F9714E)]/10 blur-3xl pc-blob" style={{ animationDelay: '4s' }} />

        <div className="container mx-auto px-4 relative z-10">
          <Reveal>
            <div className="max-w-2xl mx-auto text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-4 border border-white/10">
                <Sparkles className="h-4 w-4 text-[var(--pc-gold,#FBBF24)]" />
                <span>Crowdsourcing</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold font-[family-name:var(--font-display)] mb-3">
                Punya Ide Program Bantuan?
              </h2>
              <p className="text-teal-100/90 leading-relaxed">
                Donatur terdaftar bisa mengajukan proposal campaign. Setiap pengajuan ditinjau langsung
                oleh admin sebelum dibuka untuk umum — begini alurnya:
              </p>
            </div>
          </Reveal>

          {/* Step ditampilkan sebagai kartu kotak, senada dengan bagian "Tentang Polines Care" */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {CROWDSOURCING_STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <Reveal key={step.title} delay={i * 130}>
                  <Card className="relative h-full p-6 text-center border-0 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white">
                    <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-white text-[var(--pc-teal-deep,#0B4F4A)] text-xs font-bold flex items-center justify-center shadow-md border border-teal-100 z-10">
                      {i + 1}
                    </div>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.accent} flex items-center justify-center shadow-md mx-auto mb-4`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1 font-[family-name:var(--font-display)] text-[var(--pc-teal-deep,#0B4F4A)]">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                  </Card>
                </Reveal>
              )
            })}
          </div>

          <Reveal delay={550}>
            <div className="mt-14 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-teal-100/70">
                <CheckCircle2 className="h-4 w-4 text-[var(--pc-gold,#FBBF24)]" />
                <span>Proses review biasanya selesai dalam 1–3 hari kerja</span>
              </div>
              {session?.user ? (
                <Button className="pc-cta-glow bg-[var(--pc-coral,#F9714E)] hover:bg-[var(--pc-coral,#F9714E)]/90 text-white px-8 shadow-lg"
                  onClick={() => router.push('/donatur?tab=crowdsourcing')}>
                  <FileEdit className="h-4 w-4 mr-2" /> Ajukan Proposal Kamu
                </Button>
              ) : (
                <Button variant="outline" className="border-2 border-white/60 text-white bg-white/5 hover:bg-white hover:text-[var(--pc-teal-deep,#0B4F4A)] px-8"
                  onClick={() => router.push('/login')}>
                  <LogIn className="h-4 w-4 mr-2" /> Masuk untuk Ajukan Proposal
                </Button>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════ RECOMMENDER ══════════════ */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-white to-[var(--pc-sand,#FAF7F1)]">
        <div className="container mx-auto px-4">
          <Reveal>
            <div className="flex items-center gap-2 mb-1 justify-center md:justify-start">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-r from-[var(--pc-gold,#FBBF24)] to-[var(--pc-coral,#F9714E)]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-xs font-semibold text-[var(--pc-coral,#F9714E)] uppercase tracking-wider">Recommender System</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-center md:text-left font-[family-name:var(--font-display)]">
              Rekomendasi yang Dipersonalisasi untuk Kamu
            </h2>
          </Reveal>

          {!session?.user ? (
            <Reveal delay={100}>
              <p className="text-muted-foreground leading-relaxed mt-3 max-w-2xl">
                Sistem kami memakai AI untuk menyusun daftar campaign yang paling relevan buat kamu —
                tiap donatur bisa melihat urutan yang berbeda, tergantung kebiasaan donasinya sendiri.
              </p>

              <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
                {/* Grid kartu ikon berwarna — pengganti bullet list teks */}
                <div className="lg:col-span-3 grid grid-cols-2 gap-4">
                  {RECOMMENDATION_SIGNALS.map((sig, i) => {
                    const SigIcon = sig.icon
                    return (
                      <Reveal key={sig.label} delay={i * 90}>
                        <Card className={`h-full p-5 border-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ${sig.tint}`}>
                          <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-3 shadow-sm`}>
                            <SigIcon className={`h-5 w-5 ${sig.iconColor}`} />
                          </div>
                          <h4 className="font-semibold text-sm mb-1">{sig.label}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{sig.desc}</p>
                        </Card>
                      </Reveal>
                    )
                  })}
                </div>

                {/* Preview mockup — match-meter, bukan skeleton abu-abu */}
                <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border border-teal-100 p-6 bg-white shadow-sm flex flex-col">
                  <div className="absolute inset-0 backdrop-blur-[3px] bg-white/55 flex flex-col items-center justify-center gap-2 z-10">
                    <Lock className="h-6 w-6 text-[var(--pc-teal,#0D9488)]" />
                    <p className="text-sm font-medium text-[var(--pc-teal-deep,#0B4F4A)] text-center px-6">
                      Login untuk membuka rekomendasi personalmu
                    </p>
                    <Button size="sm" className="mt-1 bg-[var(--pc-coral,#F9714E)] hover:bg-[var(--pc-coral,#F9714E)]/90 text-white"
                      onClick={() => router.push('/login')}>
                      <LogIn className="h-3.5 w-3.5 mr-1.5" /> Masuk
                    </Button>
                  </div>

                  <p className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wide">Contoh Tampilan</p>
                  <div className="space-y-3 opacity-70">
                    {[
                      { name: 'Bantu Difabel Alat Bantu', percent: 92, color: '#0D9488' },
                      { name: 'Program Orang Tua Asuh', percent: 78, color: '#F9714E' },
                      { name: 'Bingkisan Ramadhan', percent: 61, color: '#FBBF24' },
                    ].map(item => (
                      <div key={item.name} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                        <MatchRing percent={item.percent} size={44} color={item.color} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">cocok dengan minatmu</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ) : (
            <div className="mt-8">
              {recsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-64 rounded-xl bg-white/60 animate-pulse" />)}
                </div>
              ) : !personalRecommendations || personalRecommendations.length === 0 ? (
                <Card className="p-8 text-center">
                  <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Donasi beberapa kali dulu supaya rekomendasi makin akurat!</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {personalRecommendations.slice(0, 8).map((c, i) => {
                    const progress = c.targetAmount > 0 ? Math.min((c.collectedAmount / c.targetAmount) * 100, 100) : 0
                    return (
                      <Reveal key={c.id} delay={i * 80}>
                        <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group">
                          <div className="h-28 bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center relative overflow-hidden">
                            <Sparkles className="h-8 w-8 text-teal-200 group-hover:scale-110 transition-transform" />
                            <Badge className={`absolute top-2 right-2 text-xs ${getCategoryColor(c.category)}`}>{c.category}</Badge>
                            {c.score !== undefined && c.score > 0 && (
                              <Badge className="absolute bottom-2 right-2 text-xs font-bold bg-emerald-100 text-emerald-700">
                                {c.score}% cocok
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-semibold mb-1 line-clamp-1">{c.title}</h4>
                            {c.reason && (
                              <p className="text-xs text-[var(--pc-teal,#0D9488)] bg-teal-50 rounded px-2 py-1 mb-2 line-clamp-1">{c.reason}</p>
                            )}
                            <Progress value={progress} className="h-1.5 mb-3 [&>div]:bg-[var(--pc-teal,#0D9488)]" />
                            <Button size="sm" className="w-full bg-[var(--pc-teal,#0D9488)] hover:bg-[var(--pc-teal-deep,#0B4F4A)] text-white"
                              onClick={() => fetchCampaignDetail(c.id)}>
                              <Eye className="h-3.5 w-3.5 mr-1" /> Detail & Donasi
                            </Button>
                          </CardContent>
                        </Card>
                      </Reveal>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════ ABOUT — bg gradasi turun ke warna footer di bagian paling bawah ══════════════ */}
      <section className="relative overflow-hidden pt-24 pb-18">
        {/* lapisan bawah: gradasi horizontal yg identik dgn footer (teal-800 -> emerald-900) */}
        <div className="absolute inset-0 bg-linear-to-r from-teal-800 to-emerald-900" />
        {/* lapisan atas: sand yang memudar jadi transparan, menyingkap gradasi footer di baliknya */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--pc-sand,#FAF7F1)] from-0% via-[var(--pc-sand,#FAF7F1)] via-1% to-transparent to-50%" />
        <div className="container mx-auto px-4 relative z-10">
          <Reveal>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 font-[family-name:var(--font-display)] text-teal-900">Tentang Polines Care</h2>
              <p className="text-white leading-relaxed mb-16">
                Polines Care adalah platform donasi kampus yang dikembangkan oleh Politeknik Negeri Semarang.
                Platform ini memfasilitasi penggalangan dana untuk kegiatan sosial, bantuan bencana,
                program keagamaan, dan donasi rutin di lingkungan kampus.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: <Shield className="h-8 w-8 text-[var(--pc-teal,#0D9488)]" />, title: 'Terpercaya', desc: 'Sistem verifikasi transparan untuk setiap donasi' },
                  { icon: <Users className="h-8 w-8 text-[var(--pc-emerald,#10B981)]" />, title: 'Kolaboratif', desc: 'Warga kampus bersama membangun kepedulian' },
                  { icon: <Award className="h-8 w-8 text-[var(--pc-coral,#F9714E)]" />, title: 'Berkelanjutan', desc: 'Program donasi rutin untuk dampak jangka panjang' },
                ].map((item, i) => (
                  <Card key={i} className="p-6 text-center hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-center mb-3">{item.icon}</div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CampaignDetailModal
        open={campaignDetailModalOpen}
        onClose={() => {
          setCampaignDetailModalOpen(false)
          setSelectedCampaign(null)
          setCampaignDonations([])
        }}
        selectedCampaign={selectedCampaign}
        campaignDonations={campaignDonations}
        onDonate={() => {
          setCampaignDetailModalOpen(false)
          if (selectedCampaign) openDonationModal(selectedCampaign)
        }}
      />
    </div>
  )
}