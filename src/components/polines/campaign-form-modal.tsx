'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import type { Campaign } from './types'
import { CATEGORIES } from './types'

interface CampaignFormModalProps {
  open: boolean
  onClose: () => void
  editingCampaign: Campaign | null
  campaignForm: { title: string; description: string; category: string; targetAmount: string; startDate: string; endDate: string; isUrgent: boolean }
  setCampaignForm: (form: any) => void
  submitting: boolean
  onSubmit: () => void
}

export function CampaignFormModal({ open, onClose, editingCampaign, campaignForm, setCampaignForm, submitting, onSubmit }: CampaignFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'Buat Campaign Baru'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Judul</Label>
            <Input placeholder="Judul campaign" value={campaignForm.title} onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea placeholder="Deskripsi campaign..." value={campaignForm.description} onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={campaignForm.category} onValueChange={(v) => setCampaignForm({ ...campaignForm, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target Dana (Rp)</Label>
            <Input type="number" placeholder="Masukkan target" value={campaignForm.targetAmount} onChange={(e) => setCampaignForm({ ...campaignForm, targetAmount: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input type="date" value={campaignForm.startDate} onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Selesai</Label>
              <Input type="date" value={campaignForm.endDate} onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={campaignForm.isUrgent} onCheckedChange={(checked) => setCampaignForm({ ...campaignForm, isUrgent: checked === true })} />
            <Label className="cursor-pointer">Tandai sebagai Mendesak</Label>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
            <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" disabled={submitting} onClick={onSubmit}>
              {submitting ? 'Menyimpan...' : editingCampaign ? 'Perbarui' : 'Buat Campaign'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
