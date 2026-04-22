'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  Heart, Search, AlertTriangle, Target, HandCoins, Users,
  Clock, Eye, HandHeart, ThumbsUp, Star, UserPlus, Plus,
  Sparkles, Trophy, Activity, Shield, Award, CircleDollarSign,
} from 'lucide-react'
import { formatRupiah, formatDate, getCategoryColor, CATEGORIES } from './types'
import type { Campaign, PlatformStats, RecommendedCampaign, Proposal } from './types'

interface LandingPageProps {
  campaigns: Campaign[]
  stats: PlatformStats | null
  publicRecommendations: RecommendedCampaign[]
  proposals: Proposal[]
  landingSearch: string
  setLandingSearch: (v: string) => void
  landingCategory: string
  setLandingCategory: (v: string) => void
  session: any
  setSelectedCampaign: (c: Campaign | null) => void
  fetchCampaignDetail: (id: string) => void
  openDonationModal: (c?: Campaign) => void
  setProposalFormModalOpen: (v: boolean) => void
  voteProposal: (id: string) => void
  setView: (v: string) => void
}

export function LandingPage({
  campaigns, stats, publicRecommendations, proposals,
  landingSearch, setLandingSearch, landingCategory, setLandingCategory,
  session, setSelectedCampaign, fetchCampaignDetail, openDonationModal,
  setProposalFormModalOpen, voteProposal, setView,
}: LandingPageProps) {
  const filteredLandingCampaigns = campaigns.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(landingSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(landingSearch.toLowerCase())
    const matchCategory = landingCategory === 'all' || c.category === landingCategory
    return matchSearch && matchCategory
  })

  const approvedProposals = proposals.filter(p => p.status === 'approved')

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
              <Heart className="h-4 w-4" />
              <span>Platform Donasi Kampus Polines</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight">
              Polines <span className="text-emerald-300">Care</span>
            </h1>
            <p className="text-lg md:text-xl text-teal-100 mb-8 max-w-2xl mx-auto leading-relaxed">
              Berbagi kepedulian, membangun kebersamaan. Salurkan donasi Anda untuk membantu sesama di lingkungan kampus Politeknik Negeri Semarang.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50 font-semibold px-8" onClick={() => {
                document.getElementById('campaigns-section')?.scrollIntoView({ behavior: 'smooth' })
              }}>
                <HandHeart className="h-5 w-5 mr-2" /> Mulai Donasi
              </Button>
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8" onClick={() => setView('register')}>
                <UserPlus className="h-5 w-5 mr-2" /> Daftar Sekarang
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 -mt-8 relative z-20 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Target className="h-6 w-6" />, label: 'Total Campaign', value: stats?.totalCampaigns ?? 0, color: 'bg-teal-500' },
            { icon: <HandCoins className="h-6 w-6" />, label: 'Total Donasi', value: stats?.totalDonations ?? 0, color: 'bg-emerald-500' },
            { icon: <CircleDollarSign className="h-6 w-6" />, label: 'Dana Terkumpul', value: formatRupiah(stats?.totalAmount ?? 0), color: 'bg-cyan-500' },
            { icon: <Users className="h-6 w-6" />, label: 'Total Donatur', value: stats?.totalDonors ?? 0, color: 'bg-teal-600' },
          ].map((stat, i) => (
            <Card key={i} className="shadow-lg border-0">
              <CardContent className="p-4 md:p-6 flex items-center gap-3 md:gap-4">
                <div className={`${stat.color} text-white rounded-xl p-2.5 md:p-3 flex-shrink-0`}>{stat.icon}</div>
                <div>
                  <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Active Campaigns */}
      <section id="campaigns-section" className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Campaign Aktif</h2>
            <p className="text-muted-foreground mt-1">Bantu campaign yang sedang berjalan</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Cari campaign..." className="pl-9 w-full sm:w-64" value={landingSearch} onChange={(e) => setLandingSearch(e.target.value)} />
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

        {filteredLandingCampaigns.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Tidak ada campaign yang ditemukan</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredLandingCampaigns.map(campaign => (
              <Card key={campaign.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="relative">
                  <div className="h-40 bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                    <Heart className="h-16 w-16 text-teal-300 group-hover:scale-110 transition-transform" />
                  </div>
                  {campaign.isUrgent && (
                    <Badge className="absolute top-3 left-3 bg-red-500 text-white text-xs">
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
                      <span className="font-semibold text-teal-600">{formatRupiah(campaign.collectedAmount)}</span>
                    </div>
                    <Progress value={campaign.targetAmount > 0 ? Math.min((campaign.collectedAmount / campaign.targetAmount) * 100, 100) : 0} className="h-2 [&>div]:bg-teal-500" />
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
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => fetchCampaignDetail(campaign.id)}>
                    <Eye className="h-4 w-4 mr-1" /> Detail
                  </Button>
                  <Button size="sm" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => openDonationModal(campaign)}>
                    <HandHeart className="h-4 w-4 mr-1" /> Donasi
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Crowdsourcing Section */}
      <section className="bg-teal-50/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Crowdsourcing</h2>
              <p className="text-muted-foreground mt-1">Proposal dari warga kampus</p>
            </div>
            {session?.user && (
              <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => setProposalFormModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Ajukan Proposal
              </Button>
            )}
          </div>
          {approvedProposals.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Belum ada proposal yang disetujui</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedProposals.map(p => (
                <Card key={p.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={getCategoryColor(p.category)}>{p.category}</Badge>
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <ThumbsUp className="h-3.5 w-3.5" /> {p.votesCount}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Diajukan oleh: {p.proposer?.name ?? 'Anonim'}</span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => voteProposal(p.id)}>
                      <ThumbsUp className="h-3 w-3 mr-1" /> Dukung
                    </Button>
                  </div>
                  {p.targetAmount && (
                    <p className="text-sm font-medium text-teal-600 mt-2">Target: {formatRupiah(p.targetAmount)}</p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Rekomendasi Section - Powered by Recommender System */}
      <section className="bg-gradient-to-b from-teal-50/50 to-white py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Recommender System</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">Rekomendasi untuk Anda</h2>
              <p className="text-muted-foreground mt-1">Campaign yang dipilih berdasarkan popularitas, urgensi, dan minat komunitas</p>
            </div>
          </div>

          {publicRecommendations.length === 0 ? (
            <Card className="p-8 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Memuat rekomendasi...</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {publicRecommendations.slice(0, 8).map((c, i) => {
                const progress = c.targetAmount > 0 ? Math.min((c.collectedAmount / c.targetAmount) * 100, 100) : 0
                const isTop = i === 0
                return (
                  <Card key={c.id} className={`overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group relative ${isTop ? 'ring-2 ring-amber-400' : ''}`}>
                    {isTop && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-semibold text-center py-1 z-10 flex items-center justify-center gap-1">
                        <Trophy className="h-3 w-3" /> Top Rekomendasi
                      </div>
                    )}
                    <div className={`h-28 flex items-center justify-center relative ${isTop ? 'bg-gradient-to-br from-amber-50 to-orange-50' : 'bg-gradient-to-br from-teal-50/50 to-emerald-50/50'}`}>
                      {isTop ? (
                        <Trophy className="h-10 w-10 text-amber-300 group-hover:scale-110 transition-transform" />
                      ) : (
                        <Star className={`h-8 w-8 ${i < 3 ? 'text-amber-300' : 'text-teal-200'} group-hover:scale-110 transition-transform`} />
                      )}
                      <Badge className={`absolute top-2 right-2 text-xs ${getCategoryColor(c.category)}`}>{c.category}</Badge>
                      {c.isUrgent && <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Mendesak</Badge>}
                      {c.score !== undefined && c.score > 0 && (
                        <Badge className={`absolute bottom-2 right-2 text-xs font-bold ${c.score >= 70 ? 'bg-emerald-100 text-emerald-700' : c.score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                          {c.score}% cocok
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-1 line-clamp-1">{c.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{c.description}</p>
                      {c.reason && (
                        <p className="text-xs text-teal-600 bg-teal-50 rounded px-2 py-1 mb-2 line-clamp-1">{c.reason}</p>
                      )}
                      <Progress value={progress} className="h-1.5 mb-1 [&>div]:bg-teal-500" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>{formatRupiah(c.collectedAmount)}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={() => { setSelectedCampaign(c); fetchCampaignDetail(c.id) }}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Detail & Donasi
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <div className="mt-8 p-4 bg-white rounded-lg border border-dashed border-teal-200">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mt-0.5">
                <Activity className="h-4 w-4 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-teal-800">Bagaimana sistem rekomendasi ini bekerja?</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Algoritma kami menggabungkan <strong>5 sinyal</strong>: kesesuaian kategori dengan riwayat donasi Anda,
                  popularitas di kalangan donatur lain (collaborative filtering), progres penggalangan dana,
                  urgensi campaign, dan tingkat popularitas. Login untuk mendapatkan rekomendasi yang lebih personal!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Tentang Polines Care</h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Polines Care adalah platform donasi kampus yang dikembangkan oleh Politeknik Negeri Semarang.
            Platform ini bertujuan memfasilitasi penggalangan dana untuk kegiatan sosial, bantuan bencana,
            program keagamaan, dan donasi rutin di lingkungan kampus. Dengan sistem yang transparan dan
            terverifikasi, setiap donasi yang Anda berikan akan sampai kepada pihak yang membutuhkan.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Shield className="h-8 w-8 text-teal-600" />, title: 'Terpercaya', desc: 'Sistem verifikasi transparan untuk setiap donasi' },
              { icon: <Users className="h-8 w-8 text-emerald-600" />, title: 'Kolaboratif', desc: 'Warga kampus bersama membangun kepedulian' },
              { icon: <Award className="h-8 w-8 text-cyan-600" />, title: 'Berkelanjutan', desc: 'Program donasi rutin untuk dampak jangka panjang' },
            ].map((item, i) => (
              <Card key={i} className="p-6 text-center">
                <div className="flex justify-center mb-3">{item.icon}</div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
