'use client'

import React from 'react'
import {
  HandHeart, ClipboardList, Star, UserCircle, Search, Eye,
  AlertTriangle, TrendingUp, Sparkles, Heart, Mail, Phone,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import type { Campaign, Donation, RecommendedCampaign } from '@/components/polines/types'
import {
  formatRupiah, formatDate, getCategoryColor, getStatusColor, CATEGORIES,
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
}

// ============================================================
// COMPONENT
// ============================================================
export function DonaturDashboard({
  donaturTab,
  setDonaturTab,
  campaigns,
  userDonations,
  recommendations,
  landingSearch,
  setLandingSearch,
  landingCategory,
  setLandingCategory,
  session,
  openDonationModal,
  fetchCampaignDetail,
}: DonaturDashboardProps) {
  // ============================================================
  // FILTERED CAMPAIGNS (Donasi Tab)
  // ============================================================
  const filteredCampaigns = campaigns.filter(c => {
    const matchSearch =
      c.title.toLowerCase().includes(landingSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(landingSearch.toLowerCase())
    const matchCategory = landingCategory === 'all' || c.category === landingCategory
    return matchSearch && matchCategory
  })

  // ============================================================
  // PROFILE STATS
  // ============================================================
  const totalDonations = userDonations.length
  const approvedDonations = userDonations.filter(d => d.status === 'approved')
  const pendingDonations = userDonations.filter(d => d.status === 'pending')
  const totalNominal = approvedDonations.reduce((s, d) => s + d.amount, 0)

  // ============================================================
  // RENDER: Campaign Progress Bar
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

  // ============================================================
  // RENDER: Mini Progress (for recommendation cards)
  // ============================================================
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

  // ============================================================
  // RENDER: Match Percentage Badge
  // ============================================================
  const renderMatchBadge = (match: number | undefined) => {
    if (match === undefined) return null
    const colorClass =
      match >= 70
        ? 'bg-emerald-100 text-emerald-700'
        : match >= 40
          ? 'bg-amber-100 text-amber-700'
          : 'bg-gray-100 text-gray-600'
    return (
      <Badge className={`absolute bottom-2 right-2 text-xs font-bold ${colorClass}`}>
        {match}% cocok
      </Badge>
    )
  }

  // ============================================================
  // RENDER: Urgency Badge
  // ============================================================
  const renderUrgencyBadge = (isUrgent: boolean) => {
    if (!isUrgent) return null
    return (
      <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" />Mendesak
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard Donatur</h1>
          <p className="text-muted-foreground">Kelola donasi dan temukan campaign yang tepat</p>
        </div>

        <Tabs value={donaturTab} onValueChange={setDonaturTab} className="space-y-6">
          {/* Tab List */}
          <TabsList className="flex-wrap h-auto gap-1 bg-white border p-1">
            <TabsTrigger value="donasi" className="text-sm">
              <HandHeart className="h-4 w-4 mr-1.5" /> Donasi
            </TabsTrigger>
            <TabsTrigger value="riwayat" className="text-sm">
              <ClipboardList className="h-4 w-4 mr-1.5" /> Riwayat
            </TabsTrigger>
            <TabsTrigger value="rekomendasi" className="text-sm">
              <Star className="h-4 w-4 mr-1.5" /> Rekomendasi
            </TabsTrigger>
            <TabsTrigger value="profil" className="text-sm">
              <UserCircle className="h-4 w-4 mr-1.5" /> Profil
            </TabsTrigger>
          </TabsList>

          {/* ================================================================ */}
          {/* TAB: DONASI                                                       */}
          {/* ================================================================ */}
          <TabsContent value="donasi">
            <div className="space-y-4">
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari campaign..."
                    className="pl-9"
                    value={landingSearch}
                    onChange={(e) => setLandingSearch(e.target.value)}
                  />
                </div>
                <Select value={landingCategory} onValueChange={setLandingCategory}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Campaign Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCampaigns.length === 0 ? (
                  <Card className="col-span-full p-12 text-center">
                    <p className="text-muted-foreground">Tidak ada campaign ditemukan</p>
                  </Card>
                ) : (
                  filteredCampaigns.map(campaign => (
                    <Card
                      key={campaign.id}
                      className="overflow-hidden hover:shadow-lg transition-shadow group"
                    >
                      {/* Image Area */}
                      <div className="relative">
                        <div className="h-36 bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                          <Heart className="h-14 w-14 text-teal-300 group-hover:scale-110 transition-transform" />
                        </div>
                        {campaign.isUrgent && (
                          <Badge className="absolute top-3 left-3 bg-red-500 text-white text-xs">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Mendesak
                          </Badge>
                        )}
                        <Badge
                          className={`absolute top-3 right-3 text-xs ${getCategoryColor(campaign.category)}`}
                        >
                          {campaign.category}
                        </Badge>
                      </div>

                      {/* Card Content */}
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1 line-clamp-1">{campaign.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {campaign.description}
                        </p>
                        {renderProgress(campaign.collectedAmount, campaign.targetAmount)}
                      </CardContent>

                      {/* Card Footer */}
                      <CardFooter className="px-4 pb-4 pt-0 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => fetchCampaignDetail(campaign.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> Detail
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                          onClick={() => openDonationModal(campaign)}
                        >
                          <HandHeart className="h-4 w-4 mr-1" /> Donasi
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* ================================================================ */}
          {/* TAB: RIWAYAT                                                      */}
          {/* ================================================================ */}
          <TabsContent value="riwayat">
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Donasi ({userDonations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {userDonations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada riwayat donasi
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Nominal</TableHead>
                          <TableHead className="hidden md:table-cell">Metode</TableHead>
                          <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userDonations.map(d => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {d.campaign?.title}
                            </TableCell>
                            <TableCell className="font-semibold text-teal-600">
                              {formatRupiah(d.amount)}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline">{d.paymentMethod}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                              {formatDate(d.createdAt)}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(d.status)}>{d.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ================================================================ */}
          {/* TAB: REKOMENDASI                                                  */}
          {/* ================================================================ */}
          <TabsContent value="rekomendasi">
            <div className="space-y-8">
              {/* AI Explanation Banner */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
                    <Sparkles className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-800">Rekomendasi Berbasis AI</p>
                    <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                      Rekomendasi dipersonalisasi berdasarkan riwayat donasi Anda, preferensi
                      kategori, dan pola donasi donatur lainnya (collaborative filtering). Semakin
                      sering Anda berdonasi, semakin akurat rekomendasinya!
                    </p>
                  </div>
                </div>
              </div>

              {/* ---- Karena Anda Suka (Collaborative Filtering) ---- */}
              {recommendations.becauseYouLiked.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-500" /> Karena Anda Suka
                    <Badge variant="outline" className="text-xs">Collaborative Filtering</Badge>
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Campaign yang disukai oleh donatur dengan minat serupa dengan Anda
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.becauseYouLiked.map(c => (
                      <Card key={c.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-28 bg-gradient-to-br from-pink-50 to-rose-50 flex items-center justify-center relative">
                          <Heart className="h-10 w-10 text-pink-300" />
                          <Badge className={`absolute top-2 right-2 text-xs ${getCategoryColor(c.category)}`}>
                            {c.category}
                          </Badge>
                          {renderUrgencyBadge(c.isUrgent)}
                          {renderMatchBadge(c.matchPercentage)}
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-1 line-clamp-1">{c.title}</h4>
                          {c.reason && (
                            <p className="text-xs text-teal-600 bg-teal-50 rounded px-2 py-1 mb-2">
                              {c.reason}
                            </p>
                          )}
                          {renderMiniProgress(c)}
                          <Button
                            size="sm"
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                            onClick={() => openDonationModal(c)}
                          >
                            <HandHeart className="h-4 w-4 mr-1" /> Donasi
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* ---- Rekomendasi Personal (Content-Based) ---- */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" /> Rekomendasi Personal
                  <Badge variant="outline" className="text-xs">Content-Based</Badge>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Campaign yang sesuai dengan minat dan preferensi Anda
                </p>
                {recommendations.personalized.length === 0 ? (
                  <Card className="p-8 text-center">
                    <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Mulai berdonasi untuk mendapatkan rekomendasi personal
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.personalized.map(c => (
                      <Card key={c.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-28 bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center relative">
                          <Star className="h-10 w-10 text-amber-300" />
                          <Badge className={`absolute top-2 right-2 text-xs ${getCategoryColor(c.category)}`}>
                            {c.category}
                          </Badge>
                          {renderUrgencyBadge(c.isUrgent)}
                          {renderMatchBadge(c.matchPercentage)}
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-1 line-clamp-1">{c.title}</h4>
                          {c.reason && (
                            <p className="text-xs text-teal-600 bg-teal-50 rounded px-2 py-1 mb-2">
                              {c.reason}
                            </p>
                          )}
                          {renderMiniProgress(c)}
                          <Button
                            size="sm"
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                            onClick={() => openDonationModal(c)}
                          >
                            <HandHeart className="h-4 w-4 mr-1" /> Donasi
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* ---- Trending di Kampus (Popularity-Based) ---- */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-teal-500" /> Trending di Kampus
                  <Badge variant="outline" className="text-xs">Popularity-Based</Badge>
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Campaign paling populer berdasarkan jumlah donatur
                </p>
                {recommendations.trending.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">Belum ada campaign trending</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.trending.map(c => (
                      <Card key={c.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className="h-28 bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center relative">
                          <TrendingUp className="h-10 w-10 text-teal-300" />
                          <Badge className={`absolute top-2 right-2 text-xs ${getCategoryColor(c.category)}`}>
                            {c.category}
                          </Badge>
                          {renderUrgencyBadge(c.isUrgent)}
                        </div>
                        <CardContent className="p-4">
                          <h4 className="font-semibold mb-1 line-clamp-1">{c.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                            {c.description}
                          </p>
                          {renderMiniProgress(c)}
                          <Button
                            size="sm"
                            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                            onClick={() => openDonationModal(c)}
                          >
                            <HandHeart className="h-4 w-4 mr-1" /> Donasi
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ================================================================ */}
          {/* TAB: PROFIL                                                       */}
          {/* ================================================================ */}
          <TabsContent value="profil">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* User Profile Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-teal-100 text-teal-700 text-xl font-bold">
                        {session?.user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold">{session?.user?.name}</h2>
                      <p className="text-muted-foreground">{session?.user?.email}</p>
                      <Badge variant="secondary" className="mt-1">
                        {session?.user?.role === 'donatur' ? 'Donatur' : 'Admin'}
                      </Badge>
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
                      <span>{session?.user?.name ? 'Terdaftar' : '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Donation Summary Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Donasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-teal-50">
                      <p className="text-2xl font-bold text-teal-600">{totalDonations}</p>
                      <p className="text-xs text-muted-foreground">Total Donasi</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-green-50">
                      <p className="text-2xl font-bold text-green-600">
                        {approvedDonations.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Disetujui</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-yellow-50">
                      <p className="text-2xl font-bold text-yellow-600">
                        {pendingDonations.length}
                      </p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-blue-50">
                      <p className="text-2xl font-bold text-blue-600">
                        {formatRupiah(totalNominal)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Nominal</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
