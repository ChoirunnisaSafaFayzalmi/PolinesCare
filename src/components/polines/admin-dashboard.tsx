'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import {
  Target, CreditCard, FileText, BarChart3, Bell, Vote, Plus, Edit, Trash2,
  Check, X, AlertTriangle, Search, TrendingUp, CircleDollarSign, ThumbsUp, ThumbsDown,
} from 'lucide-react'
import type {
  Campaign, Donation, Proposal, AppNotification, PlatformStats, FundUsage,
} from '@/components/polines/types'
import {
  formatRupiah, formatDate, getCategoryColor, getStatusColor, CATEGORIES,
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
}

// ============================================================
// COMPONENT
// ============================================================
export function AdminDashboard(props: AdminDashboardProps) {
  const {
    adminTab,
    setAdminTab,
    allCampaigns,
    filteredAdminCampaigns,
    filteredDonations,
    proposals,
    notifications,
    stats,
    fundUsages,
    reportCampaignId,
    setReportCampaignId,
    unreadCount,
    adminCampaignFilter,
    setAdminCampaignFilter,
    adminCampaignStatus,
    setAdminCampaignStatus,
    donationFilter,
    setDonationFilter,
    openCampaignForm,
    deleteCampaign,
    verifyDonation,
    updateProposalStatus,
    markNotificationRead,
    markAllNotificationsRead,
    setFundUsageForm,
    setFundUsageModalOpen,
  } = props

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard Admin</h1>
          <p className="text-muted-foreground">Kelola campaign, donasi, dan laporan platform</p>
        </div>

        <Tabs value={adminTab} onValueChange={setAdminTab} className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1 bg-white border p-1">
            <TabsTrigger value="campaign" className="text-sm">
              <Target className="h-4 w-4 mr-1.5" /> Campaign
            </TabsTrigger>
            <TabsTrigger value="donasi" className="text-sm">
              <CreditCard className="h-4 w-4 mr-1.5" /> Donasi
            </TabsTrigger>
            <TabsTrigger value="laporan" className="text-sm">
              <FileText className="h-4 w-4 mr-1.5" /> Laporan
            </TabsTrigger>
            <TabsTrigger value="statistik" className="text-sm">
              <BarChart3 className="h-4 w-4 mr-1.5" /> Statistik
            </TabsTrigger>
            <TabsTrigger value="crowdsourcing" className="text-sm">
              <Vote className="h-4 w-4 mr-1.5" /> Crowdsourcing
            </TabsTrigger>
            <TabsTrigger value="notifikasi" className="text-sm relative">
              <Bell className="h-4 w-4 mr-1.5" /> Notifikasi
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white font-bold">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/* Tab: Campaign                                                  */}
          {/* ============================================================ */}
          <TabsContent value="campaign">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                <CardTitle>Kelola Campaign ({allCampaigns.length})</CardTitle>
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
                  <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => openCampaignForm()}>
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
                        <TableRow>
                          <TableHead>Judul</TableHead>
                          <TableHead className="hidden md:table-cell">Kategori</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Terkumpul</TableHead>
                          <TableHead className="hidden md:table-cell">Donatur</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
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
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCampaignForm(c)}>
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
          </TabsContent>

          {/* ============================================================ */}
          {/* Tab: Donasi                                                    */}
          {/* ============================================================ */}
          <TabsContent value="donasi">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                <CardTitle>Verifikasi Donasi ({filteredDonations.length})</CardTitle>
                <Select value={donationFilter} onValueChange={setDonationFilter}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Disetujui</SelectItem>
                    <SelectItem value="rejected">Ditolak</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {filteredDonations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Tidak ada donasi ditemukan</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Donatur</TableHead>
                          <TableHead className="hidden md:table-cell">Email</TableHead>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Nominal</TableHead>
                          <TableHead className="hidden md:table-cell">Tipe</TableHead>
                          <TableHead className="hidden md:table-cell">Metode</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDonations.map(d => (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">{d.donorName}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{d.donorEmail}</TableCell>
                            <TableCell className="max-w-[150px] truncate text-sm">{d.campaign?.title}</TableCell>
                            <TableCell className="font-medium text-teal-600">{formatRupiah(d.amount)}</TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline">{d.type}</Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline">{d.paymentMethod}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(d.status)}>{d.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {d.status === 'pending' && (
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-green-600 border-green-300 hover:bg-green-50"
                                    onClick={() => verifyDonation(d.id, 'approved')}
                                  >
                                    <Check className="h-3 w-3 mr-1" /> Setujui
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs text-red-600 border-red-300 hover:bg-red-50"
                                    onClick={() => verifyDonation(d.id, 'rejected')}
                                  >
                                    <X className="h-3 w-3 mr-1" /> Tolak
                                  </Button>
                                </div>
                              )}
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

          {/* ============================================================ */}
          {/* Tab: Laporan                                                   */}
          {/* ============================================================ */}
          <TabsContent value="laporan">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
                <CardTitle>Laporan Penggunaan Dana</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Select value={reportCampaignId} onValueChange={setReportCampaignId}>
                    <SelectTrigger className="w-56"><SelectValue placeholder="Pilih campaign" /></SelectTrigger>
                    <SelectContent>
                      {allCampaigns.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={() => {
                      setFundUsageForm({ campaignId: reportCampaignId, description: '', amount: '' })
                      setFundUsageModalOpen(true)
                    }}
                    disabled={!reportCampaignId}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Tambah Laporan
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!reportCampaignId ? (
                  <p className="text-center text-muted-foreground py-8">Pilih campaign untuk melihat laporan penggunaan dana</p>
                ) : (
                  <>
                    {(() => {
                      const camp = allCampaigns.find(c => c.id === reportCampaignId)
                      const totalUsed = fundUsages.reduce((sum, f) => sum + f.amount, 0)
                      return camp ? (
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-4">
                            <Card className="p-4 flex-1 min-w-[200px]">
                              <p className="text-sm text-muted-foreground">Total Terkumpul</p>
                              <p className="text-lg font-bold text-teal-600">{formatRupiah(camp.collectedAmount)}</p>
                            </Card>
                            <Card className="p-4 flex-1 min-w-[200px]">
                              <p className="text-sm text-muted-foreground">Total Digunakan</p>
                              <p className="text-lg font-bold text-orange-600">{formatRupiah(totalUsed)}</p>
                            </Card>
                            <Card className="p-4 flex-1 min-w-[200px]">
                              <p className="text-sm text-muted-foreground">Sisa Dana</p>
                              <p className="text-lg font-bold text-emerald-600">{formatRupiah(camp.collectedAmount - totalUsed)}</p>
                            </Card>
                          </div>
                          {fundUsages.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">Belum ada laporan penggunaan dana</p>
                          ) : (
                            <div className="space-y-2">
                              {fundUsages.map(f => (
                                <Card key={f.id} className="p-4 flex items-start justify-between gap-4">
                                  <div>
                                    <p className="font-medium">{f.description}</p>
                                    <p className="text-sm text-muted-foreground">{formatDate(f.date)}</p>
                                  </div>
                                  <p className="font-semibold text-orange-600 whitespace-nowrap">{formatRupiah(f.amount)}</p>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">Campaign tidak ditemukan</p>
                      )
                    })()}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* Tab: Statistik                                                 */}
          {/* ============================================================ */}
          <TabsContent value="statistik">
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-teal-100 rounded-lg p-2.5">
                      <CircleDollarSign className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Dana</p>
                      <p className="text-xl font-bold">{stats ? formatRupiah(stats.totalAmount) : '-'}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 rounded-lg p-2.5">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transaksi</p>
                      <p className="text-xl font-bold">{stats?.totalDonations ?? 0}</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="bg-cyan-100 rounded-lg p-2.5">
                      <TrendingUp className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rata-rata Donasi</p>
                      <p className="text-xl font-bold">
                        {stats && stats.totalDonations > 0
                          ? formatRupiah(Math.round(stats.totalAmount / stats.totalDonations))
                          : '-'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar Chart: Donations by Category */}
                <Card>
                  <CardHeader><CardTitle className="text-lg">Donasi per Kategori</CardTitle></CardHeader>
                  <CardContent>
                    {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.categoryBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${Math.round(v / 1000000)}jt`} />
                          <Tooltip formatter={(value: number) => formatRupiah(value)} />
                          <Bar dataKey="total" fill="#0d9488" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Belum ada data</p>
                    )}
                  </CardContent>
                </Card>

                {/* Pie Chart: Donation Types */}
                <Card>
                  <CardHeader><CardTitle className="text-lg">Tipe Donasi</CardTitle></CardHeader>
                  <CardContent>
                    {stats?.typeBreakdown && stats.typeBreakdown.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={stats.typeBreakdown}
                            dataKey="count"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ name, count }: { name: string; count: number }) => `${name}: ${count}`}
                          >
                            {stats.typeBreakdown.map((_, index: number) => (
                              <Cell key={`cell-${index}`} fill={['#0d9488', '#f59e0b'][index] ?? '#0d9488'} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">Belum ada data</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Top Campaigns */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Top Campaigns</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allCampaigns
                      .sort((a, b) => b.collectedAmount - a.collectedAmount)
                      .slice(0, 5)
                      .map((c, i) => (
                        <div key={c.id} className="flex items-center gap-4">
                          <span className="text-lg font-bold text-muted-foreground w-6">{i + 1}.</span>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium truncate max-w-[300px]">{c.title}</span>
                              <span className="font-semibold text-teal-600 ml-2 whitespace-nowrap">
                                {formatRupiah(c.collectedAmount)}
                              </span>
                            </div>
                            <Progress
                              value={c.targetAmount > 0 ? Math.min((c.collectedAmount / c.targetAmount) * 100, 100) : 0}
                              className="h-2 [&>div]:bg-teal-500"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* Tab: Crowdsourcing                                             */}
          {/* ============================================================ */}
          <TabsContent value="crowdsourcing">
            <Card>
              <CardHeader><CardTitle>Daftar Proposal ({proposals.length})</CardTitle></CardHeader>
              <CardContent>
                {proposals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Belum ada proposal</p>
                ) : (
                  <div className="space-y-3">
                    {proposals.map(p => (
                      <Card key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-medium">{p.title}</h3>
                            <Badge variant="outline" className={getCategoryColor(p.category)}>{p.category}</Badge>
                            <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">{p.description}</p>
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                            <span>Diajukan: {p.proposer?.name ?? 'Anonim'}</span>
                            <span className="flex items-center gap-1">
                              <ThumbsUp className="h-3 w-3" /> {p.votesCount} suara
                            </span>
                            {p.targetAmount && <span>Target: {formatRupiah(p.targetAmount)}</span>}
                          </div>
                        </div>
                        {p.status === 'pending' && (
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-green-600 border-green-300 hover:bg-green-50"
                              onClick={() => updateProposalStatus(p.id, 'approved')}
                            >
                              <Check className="h-3 w-3 mr-1" /> Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs text-red-600 border-red-300 hover:bg-red-50"
                              onClick={() => updateProposalStatus(p.id, 'rejected')}
                            >
                              <X className="h-3 w-3 mr-1" /> Tolak
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* Tab: Notifikasi                                                */}
          {/* ============================================================ */}
          <TabsContent value="notifikasi">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Notifikasi ({notifications.length})</CardTitle>
                {unreadCount > 0 && (
                  <Button variant="outline" size="sm" onClick={markAllNotificationsRead}>
                    Tandai semua dibaca
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Tidak ada notifikasi</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          !n.isRead ? 'bg-teal-50 border-teal-100' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => markNotificationRead(n.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                          </div>
                          {!n.isRead && <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(n.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
