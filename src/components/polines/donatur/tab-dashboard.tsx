'use client'

import React from 'react'
import { HandHeart, ClipboardList, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Donation, Campaign } from '@/components/polines/types'
import { formatRupiah, formatDate, getStatusColor } from '@/components/polines/types'

interface TabDashboardProps {
  session: any
  userDonations: Donation[]
  campaigns: Campaign[]
}

export function TabDashboard({ session, userDonations, campaigns }: TabDashboardProps) {
  const approved = userDonations.filter(d => d.status === 'approved')
  const pending = userDonations.filter(d => d.status === 'pending')
  const totalNominal = approved.reduce((s, d) => s + d.amount, 0)

  // Campaign yang pernah didonasi user
  const donatedCampaignIds = [...new Set(approved.map(d => d.campaignId))]
  const activeCampaigns = campaigns.filter(c => donatedCampaignIds.includes(c.id))

  // 5 donasi terakhir
  const recentDonations = [...userDonations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h2 className="text-xl font-semibold">
          Selamat datang, {session?.user?.name?.split(' ')[0]}! 👋
        </h2>
        <p className="text-sm text-muted-foreground">Berikut ringkasan aktivitas donasi kamu</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <HandHeart className="h-4 w-4 text-teal-600" />
              <span className="text-xs text-muted-foreground">Total Donasi</span>
            </div>
            <p className="text-2xl font-bold">{userDonations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Total Nominal</span>
            </div>
            <p className="text-lg font-bold text-teal-600">{formatRupiah(totalNominal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Menunggu</span>
            </div>
            <p className="text-2xl font-bold text-amber-500">{pending.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Disetujui</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{approved.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Campaign yang diikuti */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Campaign yang Kamu Ikuti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada campaign yang diikuti
              </p>
            ) : (
              activeCampaigns.slice(0, 4).map(c => {
                const pct = c.targetAmount > 0
                  ? Math.min((c.collectedAmount / c.targetAmount) * 100, 100) : 0
                return (
                  <div key={c.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium line-clamp-1 flex-1">{c.title}</span>
                      <span className="text-teal-600 ml-2 shrink-0">{Math.round(pct)}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5 [&>div]:bg-teal-500" />
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Donasi Terakhir */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Donasi Terakhir</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDonations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Belum ada donasi
              </p>
            ) : (
              recentDonations.map(d => (
                <div key={d.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.campaign?.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="text-sm font-semibold text-teal-600">{formatRupiah(d.amount)}</p>
                    <Badge className={`text-xs ${getStatusColor(d.status)}`}>{d.status}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}