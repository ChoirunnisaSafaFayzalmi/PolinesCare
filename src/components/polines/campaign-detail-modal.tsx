'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, HandHeart, AlertTriangle, MapPin, Tag, Target } from 'lucide-react'
import type { Campaign, Donation } from './types'
import { formatRupiah, formatDate, getCategoryColor, getStatusColor } from './types'

interface CampaignDetailModalProps {
  open: boolean
  onClose: () => void
  selectedCampaign: Campaign | null
  campaignDonations: Donation[]
  onDonate: () => void
}

// DATA DUMMY — hapus ini setelah backend siap
const DUMMY: Campaign = {
  id: 'dummy-1',
  title: 'Bantu Korban Banjir Semarang',
  description:
    'Banjir besar melanda kota Semarang pada awal tahun ini. Banyak warga yang kehilangan tempat tinggal dan harta benda mereka. Mari kita bersama-sama membantu meringankan beban mereka dengan donasi terbaik kita.',
  category: 'Bencana',
  targetAmount: 50_000_000,
  collectedAmount: 32_550_000,
  startDate: '2026-01-10',
  endDate: '2026-06-30',
  status: 'active',
  isUrgent: true,
  uniqueCode: 123,
  createdBy: 'admin',
  creator: { name: 'BEM Polines' },
  _count: { donations: 87 },
}

export function CampaignDetailModal({
  open,
  onClose,
  selectedCampaign,
  campaignDonations,
  onDonate,
}: CampaignDetailModalProps) {
  // Pakai dummy jika data belum ada
  const raw = selectedCampaign ?? DUMMY

  const campaign = {
    ...raw,
    targetAmount: Number(raw.targetAmount) || 0,
    collectedAmount: Number(raw.collectedAmount) || 0,
    address: (raw as any).address ?? 'Jl. Prof. Sudarto, Tembalang, Semarang',
  }

  const progressPct =
    campaign.targetAmount > 0
      ? Math.min((campaign.collectedAmount / campaign.targetAmount) * 100, 100)
      : 0

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">

        {/* ── Header ── */}
        <DialogHeader>
          <div className="flex items-start gap-2 flex-wrap">
            <DialogTitle className="text-xl leading-snug">{campaign.title}</DialogTitle>
            {campaign.isUrgent && (
              <Badge className="bg-red-500 text-white shrink-0">
                <AlertTriangle className="h-3 w-3 mr-1" /> Mendesak
              </Badge>
            )}
          </div>
          <div className="flex gap-2 mt-1 flex-wrap">
            <Badge variant="outline" className={getCategoryColor(campaign.category)}>
              {campaign.category}
            </Badge>
            <Badge className={getStatusColor(campaign.status)}>{campaign.status}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">

          {/* ── 1. Deskripsi ── */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {campaign.description}
          </p>

          {/* ── 2. Info Grid ── */}
          <div className="grid grid-cols-2 gap-3">

            {/* Kategori */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Tag className="h-3.5 w-3.5" /> Kategori
              </div>
              <Badge className={`${getCategoryColor(campaign.category)} text-xs`}>
                {campaign.category}
              </Badge>
            </div>

            {/* Target Dana */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Target className="h-3.5 w-3.5" /> Target Dana
              </div>
              <p className="text-sm font-semibold text-teal-700">
                {formatRupiah(campaign.targetAmount)}
              </p>
            </div>

            {/* Tanggal Berakhir */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" /> Berakhir
              </div>
              <p className="text-sm font-medium">{formatDate(campaign.endDate)}</p>
            </div>

            {/* Alamat */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Lokasi
              </div>
              <p className="text-sm font-medium leading-snug">{campaign.address}</p>
            </div>

          </div>

          {/* ── 3. Progress Dana Terkumpul ── */}
          <div className="bg-teal-50/60 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Terkumpul</span>
              <span className="font-bold text-teal-600">
                {formatRupiah(campaign.collectedAmount)}
              </span>
            </div>
            <Progress value={progressPct} className="h-3 [&>div]:bg-teal-500" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>dari {formatRupiah(campaign.targetAmount)}</span>
              <span>{Math.round(progressPct)}%</span>
            </div>
          </div>

          {/* ── 4. Tombol Donasi ── */}
          <Button
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => { onClose(); onDonate() }}
          >
            <HandHeart className="h-4 w-4 mr-1" /> Donasi Sekarang
          </Button>

        </div>
      </DialogContent>
    </Dialog>
  )
}