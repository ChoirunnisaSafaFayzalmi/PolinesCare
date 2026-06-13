'use client'

import React from 'react'
import { Search, Eye, AlertTriangle, Heart } from 'lucide-react'
import { HandHeart } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Campaign } from '@/components/polines/types'
import { formatRupiah, getCategoryColor, CATEGORIES } from '@/components/polines/types'

interface TabDonasiProps {
  campaigns: Campaign[]
  search: string
  setSearch: (v: string) => void
  category: string
  setCategory: (v: string) => void
  openDonationModal: (campaign: Campaign) => void
  fetchCampaignDetail: (id: string) => void
}

export function TabDonasi({
  campaigns, search, setSearch, category, setCategory,
  openDonationModal, fetchCampaignDetail
}: TabDonasiProps) {

  const filtered = campaigns.filter(c => {
  const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  const matchCategory = category === 'all' || c.category === category
  const isVisible = c.isPublic === true && c.status === 'active'
  return matchSearch && matchCategory && isVisible
})

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

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari campaign..." className="pl-9"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Campaign Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <p className="text-muted-foreground">Tidak ada campaign ditemukan</p>
          </Card>
        ) : (
          filtered.map(campaign => (
            <Card key={campaign.id} className="overflow-hidden hover:shadow-lg transition-shadow group p-0">
              <div className="relative">
                {campaign.images && campaign.images.length > 0 ? (
                  <img src={campaign.images[0]} alt={campaign.title} className="w-full h-50 object-cover" />
                ) : (
                  <div className="h-50 bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                    <Heart className="h-14 w-14 text-teal-300 group-hover:scale-110 transition-transform" />
                  </div>
                )}
                {campaign.isUrgent && (
                  <Badge className="absolute top-3 left-3 bg-red-500 text-white text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Mendesak
                  </Badge>
                )}
                <Badge className={`absolute top-3 right-3 text-xs ${getCategoryColor(campaign.category)}`}>
                  {campaign.category}
                </Badge>
              </div>
              <CardContent className="px-4 pt-4">
                <h3 className="font-semibold mb-1 line-clamp-1">{campaign.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{campaign.description}</p>
                {renderProgress(campaign.collectedAmount, campaign.targetAmount)}
              </CardContent>
              <CardFooter className="px-4 pb-4 pt-0 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1"
                  onClick={() => fetchCampaignDetail(campaign.id)}>
                  <Eye className="h-4 w-4 mr-1" /> Detail
                </Button>
                <Button size="sm" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => openDonationModal(campaign)}>
                  <HandHeart className="h-4 w-4 mr-1" /> Donasi
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}