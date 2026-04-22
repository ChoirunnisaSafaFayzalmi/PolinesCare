'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, Users, Building2, HandHeart, AlertTriangle } from 'lucide-react'
import type { Campaign, Donation } from './types'
import { formatRupiah, formatDate, getCategoryColor, getStatusColor } from './types'

interface CampaignDetailModalProps {
  open: boolean
  onClose: () => void
  selectedCampaign: Campaign | null
  campaignDonations: Donation[]
  onDonate: () => void
}

export function CampaignDetailModal({ open, onClose, selectedCampaign, campaignDonations, onDonate }: CampaignDetailModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        {selectedCampaign && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-xl">{selectedCampaign.title}</DialogTitle>
                {selectedCampaign.isUrgent && <Badge className="bg-red-500 text-white"><AlertTriangle className="h-3 w-3 mr-1" />Mendesak</Badge>}
              </div>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className={getCategoryColor(selectedCampaign.category)}>{selectedCampaign.category}</Badge>
                <Badge className={getStatusColor(selectedCampaign.status)}>{selectedCampaign.status}</Badge>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedCampaign.description}</p>

              <div className="bg-teal-50/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Terkumpul</span>
                  <span className="font-bold text-teal-600">{formatRupiah(selectedCampaign.collectedAmount)}</span>
                </div>
                <Progress value={selectedCampaign.targetAmount > 0 ? Math.min((selectedCampaign.collectedAmount / selectedCampaign.targetAmount) * 100, 100) : 0} className="h-3 [&>div]:bg-teal-500" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Target: {formatRupiah(selectedCampaign.targetAmount)}</span>
                  <span>{selectedCampaign.targetAmount > 0 ? Math.round((selectedCampaign.collectedAmount / selectedCampaign.targetAmount) * 100) : 0}%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" /> {formatDate(selectedCampaign.startDate)} - {formatDate(selectedCampaign.endDate)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" /> {selectedCampaign._count?.donations ?? 0} donatur
                </div>
              </div>

              {selectedCampaign.creator && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Dibuat oleh: <span className="font-medium text-foreground">{selectedCampaign.creator.name}</span></span>
                </div>
              )}

              {campaignDonations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Donasi Terbaru</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {campaignDonations.slice(0, 10).map(d => (
                      <div key={d.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div>
                          <p className="font-medium">{d.donorName}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(d.createdAt)} &bull; {d.paymentMethod}</p>
                        </div>
                        <span className="font-semibold text-teal-600">{formatRupiah(d.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={() => { onClose(); onDonate() }}>
                <HandHeart className="h-4 w-4 mr-1" /> Donasi Sekarang
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
