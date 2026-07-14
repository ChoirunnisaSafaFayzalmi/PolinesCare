'use client'

import React from 'react'
import { Heart, Star, Sparkles, AlertTriangle, HandHeart, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { RecommendedCampaign, Campaign } from '@/components/polines/types'
import { formatRupiah, getCategoryColor } from '@/components/polines/types'

interface TabRekomendasiProps {
  recommendations: {
    personalized: RecommendedCampaign[]
    becauseYouLiked: RecommendedCampaign[]
    collaborative: RecommendedCampaign[]
  }
  openDonationModal: (campaign: Campaign) => void
  fetchCampaignDetail: (id: string) => void
}

export function TabRekomendasi({ recommendations, openDonationModal, fetchCampaignDetail }: TabRekomendasiProps) {

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

  const renderMatchBadge = (match: number | undefined) => {
    if (match === undefined) return null
    const colorClass =
      match >= 70 ? 'bg-emerald-100 text-emerald-700'
      : match >= 40 ? 'bg-amber-100 text-amber-700'
      : 'bg-gray-100 text-gray-600'
    return (
      <Badge className={`absolute bottom-2 right-2 text-xs font-bold ${colorClass}`}>
        {match}% cocok
      </Badge>
    )
  }

  const renderUrgencyBadge = (isUrgent: boolean) => {
    if (!isUrgent) return null
    return (
      <Badge className="absolute top-2 left-2 bg-red-500 text-white text-xs">
        <AlertTriangle className="h-3 w-3 mr-1" /> Mendesak
      </Badge>
    )
  }

  const RekomCard = ({
    c,
    gradient,
    icon,
  }: {
    c: RecommendedCampaign
    gradient: string
    icon: React.ReactNode
  }) => (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow p-0 cursor-pointer"
      onClick={() => fetchCampaignDetail(c.id)}
    >
      <div
        className={`h-28 relative overflow-hidden${
          !(c as any).image ? ` ${gradient} flex items-center justify-center` : ''
        }`}
      >
        {(c as any).image ? (
          <img
            src={(c as any).image}
            alt={c.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          icon
        )}
        <Badge className={`absolute top-2 right-2 text-xs ${getCategoryColor(c.category)}`}>
          {c.category}
        </Badge>
        {renderUrgencyBadge(c.isUrgent)}
        {renderMatchBadge(c.matchPercentage)}
      </div>
      <CardContent className="p-4">
        <h4 className="font-semibold mb-1 line-clamp-1">{c.title}</h4>
        {c.reason && (
          <p className="text-xs text-teal-600 bg-teal-50 rounded px-2 py-1 mb-2">{c.reason}</p>
        )}
        {renderMiniProgress(c)}
        <Button
          size="sm"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          onClick={(e) => {
            e.stopPropagation()
            openDonationModal(c as unknown as Campaign)
          }}
        >
          <HandHeart className="h-4 w-4 mr-1" /> Donasi
        </Button>
      </CardContent>
    </Card>
  )

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
          <Card className="p-8 text-center">
            <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Mulai berdonasi untuk mendapatkan rekomendasi personal
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(recommendations?.personalized || []).map(c => (
              <RekomCard
                key={c.id} c={c}
                gradient="bg-gradient-to-br from-purple-50 to-indigo-50"
                icon={<Star className="h-10 w-10 text-purple-300" />}
              />
            ))}
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(recommendations?.becauseYouLiked || []).map(c => (
              <RekomCard
                key={c.id} c={c}
                gradient="bg-gradient-to-br from-pink-50 to-rose-50"
                icon={<Heart className="h-10 w-10 text-pink-300" />}
              />
            ))}
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(recommendations?.collaborative || []).map(c => (
              <RekomCard
                key={c.id} c={c}
                gradient="bg-gradient-to-br from-blue-50 to-cyan-50"
                icon={<Users className="h-10 w-10 text-blue-300" />}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}