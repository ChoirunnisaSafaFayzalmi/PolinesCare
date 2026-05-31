'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, HandHeart, AlertTriangle, MapPin, Tag, Target, Heart } from 'lucide-react'
import type { Campaign, Donation } from '../types'
import { formatRupiah, formatDate, getCategoryColor, getStatusColor } from '../types'

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

// ── Komponen Carousel terpisah agar useState tidak melanggar Rules of Hooks ──
interface CampaignCarouselProps {
  image?: string
  title: string
}

function CampaignCarousel({ image, title }: CampaignCarouselProps) {
  // Nanti bisa diganti dengan images[] dari backend
  const images = image ? [image] : []
  const [activeIdx, setActiveIdx] = React.useState(0)

  if (images.length === 0) {
    return (
      <div className="relative mb-4 h-36 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center overflow-hidden border border-teal-100">
        <Heart className="h-16 w-16 text-teal-300" />
      </div>
    )
  }

  return (
    <div className="relative mb-4 rounded-xl overflow-hidden border border-gray-100">
      {/* Gambar */}
      <div className="relative h-48">
        <img
          src={images[activeIdx]}
          alt={`${title} ${activeIdx + 1}`}
          className="w-full h-full object-cover"
        />
        {/* Overlay gelap tipis di bawah untuk dots */}
        {images.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/30 to-transparent" />
        )}
      </div>

      {/* Tombol prev/next — hanya muncul jika > 1 gambar */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center"
            onClick={() => setActiveIdx(i => (i - 1 + images.length) % images.length)}
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center"
            onClick={() => setActiveIdx(i => (i + 1) % images.length)}
          >
            ›
          </button>
        </>
      )}

      {/* Dots indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeIdx ? 'bg-white' : 'bg-white/50'
                }`}
              onClick={() => setActiveIdx(i)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Komponen Utama ──
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
    location: raw.location ?? '-',
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

        {/* ── Gambar Campaign (Carousel) ── */}
        <CampaignCarousel image={(campaign as any).image} title={campaign.title} />

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
              <p className="text-sm font-medium leading-snug">{campaign.location}</p>
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