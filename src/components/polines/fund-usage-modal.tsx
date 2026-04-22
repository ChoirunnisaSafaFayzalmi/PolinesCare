'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Campaign } from './types'

interface FundUsageModalProps {
  open: boolean
  onClose: () => void
  fundUsageForm: { campaignId: string; description: string; amount: string }
  setFundUsageForm: (form: any) => void
  allCampaigns: Campaign[]
  submitting: boolean
  onSubmit: () => void
}

export function FundUsageModal({ open, onClose, fundUsageForm, setFundUsageForm, allCampaigns, submitting, onSubmit }: FundUsageModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Laporan Penggunaan Dana</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Campaign</Label>
            <Select value={fundUsageForm.campaignId} onValueChange={(v) => setFundUsageForm({ ...fundUsageForm, campaignId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {allCampaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Deskripsi Penggunaan</Label>
            <Textarea placeholder="Deskripsikan penggunaan dana..." value={fundUsageForm.description} onChange={(e) => setFundUsageForm({ ...fundUsageForm, description: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Jumlah (Rp)</Label>
            <Input type="number" placeholder="Masukkan jumlah" value={fundUsageForm.amount} onChange={(e) => setFundUsageForm({ ...fundUsageForm, amount: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
            <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" disabled={submitting} onClick={onSubmit}>
              {submitting ? 'Menyimpan...' : 'Simpan Laporan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
