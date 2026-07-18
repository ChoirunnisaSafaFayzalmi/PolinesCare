'use client'

import React, { useRef } from 'react'
import { Heart, Star, Sparkles, AlertTriangle, HandHeart, Users, Eye, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { RecommendedCampaign, Campaign } from '@/components/polines/types'
import { formatRupiah, formatDate, getCategoryColor, parseImages } from '@/components/polines/types'

interface TabRekomendasiProps {
  recommendations: {
    personalized: RecommendedCampaign[]
    becauseYouLiked: RecommendedCampaign[]
    collaborative: RecommendedCampaign[]
  }
  meta?: {
    hasDonationHistory: boolean
    hasNeighbors: boolean
  }
  openDonationModal: (campaign: Campaign) => void
  fetchCampaignDetail: (id: string) => void
}

// ── Horizontal scroll row (ala Vidio) ──────────────────────
// Dipisah jadi komponen sendiri supaya tiap section (Hybrid,
// Content-Based, Collaborative) punya scroll & tombol panah
// masing-masing, independen satu sama lain.
function ScrollRow({ children }: { children: React.ReactNode }) {
  const rowRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    const el = rowRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' })
  }

  return (
    <div className="relative group/row">
      {/* Tombol kiri */}
      <button
        onClick={() => scroll('left')}
        className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center
                   w-9 h-9 rounded-full bg-white shadow-md border border-gray-200
                   opacity-0 group-hover/row:opacity-100 transition-opacity -translate-x-3
                   hover:bg-gray-50"
        aria-label="Geser ke kiri"
      >
        <ChevronLeft className="h-5 w-5 text-gray-700" />
      </button>

      {/* Row scrollable */}
      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2
                   [scrollbar-width:none] [-ms-overflow-style:none]
                   [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {/* Tombol kanan */}
      <button
        onClick={() => scroll('right')}
        className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center
                   w-9 h-9 rounded-full bg-white shadow-md border border-gray-200
                   opacity-0 group-hover/row:opacity-100 transition-opacity translate-x-3
                   hover:bg-gray-50"
        aria-label="Geser ke kanan"
      >
        <ChevronRight className="h-5 w-5 text-gray-700" />
      </button>
    </div>
  )
}

export function TabRekomendasi({ recommendations, meta, openDonationModal, fetchCampaignDetail }: TabRekomendasiProps) {

  const renderProgress = (collected: number, target: number) => {
    const pct = target > 0 ? Math.min((collected / target) * 100, 100) : 0
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Terkumpul</span>
          <span className="font-semibold text-teal-600">{formatRupiah(collected)}</span>
        </div>
        <Progress value={pct} className="h-2 [&>div]:bg-teal-500" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatRupiah(target)}</span>
          <span>{target > 0 ? Math.round(pct) : 0}%</span>
        </div>
      </div>
    )
  }

  const renderMatchBadge = (match: number | undefined) => {
    if (match === undefined) return null
    const colorClass =
      match >= 70 ? 'bg-emerald-500'
      : match >= 40 ? 'bg-amber-500'
      : 'bg-gray-400'
    return (
      <Badge className={`absolute bottom-3 right-3 text-white text-xs font-bold ${colorClass}`}>
        {match}% cocok
      </Badge>
    )
  }

  const getImages = (c: RecommendedCampaign): string[] => {
    if (Array.isArray(c.images)) return c.images
    if (typeof c.images === 'string') return parseImages(c.images)
    return []
  }

  const RekomCard = ({ c }: { c: RecommendedCampaign }) => {
    const imgs = getImages(c)
    return (
      // ⬅ Card lebar tetap (bukan full-width grid) supaya bisa disusun
      // menyamping dalam ScrollRow. Sesuaikan w-* kalau mau lebih
      // lebar/sempit.
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group p-0 flex-shrink-0 w-64 sm:w-72">
        <div className="relative">
          {imgs.length > 0 ? (
            <img
              src={imgs[0]}
              alt={c.title}
              className="w-full h-40 object-cover"
            />
          ) : (
            <div className="h-40 bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
              <Star className="h-12 w-12 text-purple-300 group-hover:scale-110 transition-transform" />
            </div>
          )}
          {c.isUrgent && (
            <Badge className="absolute top-3 left-3 bg-red-500 text-white text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" /> Mendesak
            </Badge>
          )}
          <Badge className={`absolute top-3 right-3 text-xs ${getCategoryColor(c.category)}`}>
            {c.category}
          </Badge>
          {renderMatchBadge(c.matchPercentage)}
        </div>
        <CardContent className="px-4 pt-4">
          <h3 className="font-semibold mb-1 line-clamp-1">{c.title}</h3>
          {c.reason && (
            <p className="text-xs text-teal-600 bg-teal-50 rounded px-2 py-1 mb-2 inline-block line-clamp-1">
              {c.reason}
            </p>
          )}
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{c.description}</p>
          {renderProgress(c.collectedAmount, c.targetAmount)}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 mt-1 border-t border-gray-100">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {c._count?.donations ?? 0} donatur
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatDate(c.endDate)}
            </span>
          </div>
        </CardContent>
        <CardFooter className="px-4 pb-4 pt-0 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1"
            onClick={() => fetchCampaignDetail(c.id)}>
            <Eye className="h-4 w-4 mr-1" /> Detail
          </Button>
          <Button size="sm" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => openDonationModal(c as unknown as Campaign)}>
            <HandHeart className="h-4 w-4 mr-1" /> Donasi
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const renderPersonalizedEmptyState = () => {
    const hasDonationHistory = meta?.hasDonationHistory ?? false
    const hasNeighbors = meta?.hasNeighbors ?? false

    let message = 'Mulai berdonasi untuk mendapatkan rekomendasi personal'
    if (hasDonationHistory && !hasNeighbors) {
      message =
        'Rekomendasi hybrid muncul saat ada donatur lain dengan minat kategori serupa dengan Anda. Untuk sekarang, cek rekomendasi berdasarkan kategori favorit Anda di bawah ini.'
    } else if (hasDonationHistory && hasNeighbors) {
      message =
        'Belum ada campaign baru yang cocok dengan pola donasi Anda dan donatur serupa saat ini. Cek rekomendasi lain di bawah ini.'
    }

    return (
      <Card className="p-8 text-center">
        <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">{message}</p>
      </Card>
    )
  }

  return (
    <div className="space-y-8">

      {/* ── AI Banner ── */}
      <div className="p-4 bg-linear-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mt-0.5">
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Rekomendasi Berbasis AI</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Dipersonalisasi berdasarkan riwayat donasi, preferensi kategori, dan pola donatur lainnya.
              Semakin sering berdonasi, semakin akurat rekomendasinya!
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: HYBRID ── */}
      <div>
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-500" /> Rekomendasi Personal
          <Badge variant="outline" className="text-xs font-semibold text-purple-700 border-purple-300">
            Hybrid
          </Badge>
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Gabungan preferensi kategori Anda dan pola donatur dengan minat serupa
        </p>
        {(!recommendations?.personalized || recommendations.personalized.length === 0) ? (
          renderPersonalizedEmptyState()
        ) : (
          <ScrollRow>
            {recommendations.personalized.map(c => (
              <RekomCard key={c.id} c={c} />
            ))}
          </ScrollRow>
        )}
      </div>

      {/* ── SECTION 2: CONTENT-BASED ── */}
      {recommendations?.becauseYouLiked?.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" /> Karena Anda Suka
            <Badge variant="outline" className="text-xs font-semibold text-pink-700 border-pink-300">
              Content-Based
            </Badge>
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Campaign sesuai kategori minat Anda berdasarkan riwayat donasi
          </p>
          <ScrollRow>
            {recommendations.becauseYouLiked.map(c => (
              <RekomCard key={c.id} c={c} />
            ))}
          </ScrollRow>
        </div>
      )}

      {/* ── SECTION 3: COLLABORATIVE FILTERING ── */}
      {recommendations?.collaborative?.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" /> Pengguna Serupa Juga Donasi
            <Badge variant="outline" className="text-xs font-semibold text-blue-700 border-blue-300">
              Collaborative Filtering
            </Badge>
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Campaign yang populer di antara donatur dengan kebiasaan donasi mirip Anda
          </p>
          <ScrollRow>
            {recommendations.collaborative.map(c => (
              <RekomCard key={c.id} c={c} />
            ))}
          </ScrollRow>
        </div>
      )}

    </div>
  )
}