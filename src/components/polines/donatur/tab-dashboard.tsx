'use client'

import React from 'react'
import { HandHeart, ClipboardList, Clock, CheckCircle, Megaphone } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { Donation, Campaign } from '@/components/polines/types'
import { formatRupiah, formatDate, getStatusColor } from '@/components/polines/types'
import { type ProposalAPI, mapProposalToRiwayat, StatusBadge, useProposals } from '@/components/polines/donatur/tab-ajuan'

interface TabDashboardProps {
  session: any
  userDonations: Donation[]
  campaigns: Campaign[]
  proposals?: ProposalAPI[]
  proposalsLoading?: boolean
  onViewProposal?: (id: string) => void
}

export function TabDashboard({
  session,
  userDonations,
  proposals: proposalsProp,
  proposalsLoading: proposalsLoadingProp,
}: TabDashboardProps) {
  const internal = useProposals(session)
  const usingExternalData = proposalsProp !== undefined
  const proposals = usingExternalData ? proposalsProp : internal.proposals
  const proposalsLoading = usingExternalData ? (proposalsLoadingProp ?? false) : internal.loading

  const approved = userDonations.filter(d => d.status === 'approved')
  const pending = userDonations.filter(d => d.status === 'pending')
  const totalNominal = approved.reduce((s, d) => s + d.amount, 0)

  // 5 donasi terakhir
  const recentDonations = [...userDonations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // ── Riwayat Ajuan: 5 ajuan campaign terbaru milik user ──
  // Sembunyikan proposal lama yang sudah digantikan hasil resubmit (sama seperti di TabAjuan)
  const supersededIds = new Set(
    proposals.map(p => p.resubmittedFrom).filter((id): id is string => !!id)
  )
  const recentProposals = [...proposals]
    .filter(p => !supersededIds.has(p.id))
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
        {/* Riwayat Ajuan (pengajuan campaign) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riwayat Ajuan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proposalsLoading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Memuat...</p>
            ) : recentProposals.length === 0 ? (
              <div className="text-center py-4 space-y-1">
                <Megaphone className="h-6 w-6 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">Belum ada ajuan campaign</p>
              </div>
            ) : (
              recentProposals.map(p => {
                const r = mapProposalToRiwayat(p)
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.judul}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(r.tanggalAjuan)}</p>
                    </div>
                    <StatusBadge status={r.status} />
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