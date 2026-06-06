'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Target, CreditCard, Users, HandCoins } from 'lucide-react'
import type { Campaign, PlatformStats } from '@/components/polines/types'
import { formatRupiah } from '@/components/polines/types'

const PIE_COLORS = ['#0d9488', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899']

interface DashboardTabProps {
  stats: PlatformStats | null
  allCampaigns: Campaign[]
  onNavigateCampaign: () => void
}

export function DashboardTab({ stats, allCampaigns, onNavigateCampaign }: DashboardTabProps) {
  const chartData = stats?.categoryBreakdown?.map(c => ({ ...c, total: c.total || 0 })) || []
  const pieData = stats?.typeBreakdown?.map(t => ({ ...t, count: t.count || 0 })) || []

  const topCampaigns = [...allCampaigns]
    .sort((a, b) => b.collectedAmount - a.collectedAmount)
    .slice(0, 5)

  const statsCards = [
    { label: 'Total Campaign', value: stats?.totalCampaigns ?? 0, icon: Target, color: 'from-teal-700 to-teal-600' },
    { label: 'Total Donasi', value: formatRupiah(stats?.totalAmount ?? 0), icon: HandCoins, color: 'from-emerald-700 to-emerald-600' },
    { label: 'Total Donatur', value: stats?.totalDonors ?? 0, icon: Users, color: 'from-cyan-700 to-cyan-600' },
    { label: 'Transaksi', value: stats?.totalDonations ?? 0, icon: CreditCard, color: 'from-teal-800 to-teal-700' },
  ]

  return (
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Tipe Donasi</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData} dataKey="count" nameKey="type"
                    cx="50%" cy="50%" outerRadius={95} innerRadius={55} paddingAngle={3}
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
            <Button variant="outline" size="sm" className="text-xs" onClick={onNavigateCampaign}>
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
}