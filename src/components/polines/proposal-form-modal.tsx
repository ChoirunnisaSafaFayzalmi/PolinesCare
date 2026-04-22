'use client'

import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CATEGORIES } from './types'

interface ProposalFormModalProps {
  open: boolean
  onClose: () => void
  proposalForm: { title: string; description: string; category: string; targetAmount: string }
  setProposalForm: (form: any) => void
  submitting: boolean
  onSubmit: () => void
}

export function ProposalFormModal({ open, onClose, proposalForm, setProposalForm, submitting, onSubmit }: ProposalFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajukan Proposal</DialogTitle>
          <DialogDescription>Usulkan campaign baru untuk voting warga kampus</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Judul Proposal</Label>
            <Input placeholder="Judul proposal" value={proposalForm.title} onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea placeholder="Jelaskan proposal Anda..." value={proposalForm.description} onChange={(e) => setProposalForm({ ...proposalForm, description: e.target.value })} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select value={proposalForm.category} onValueChange={(v) => setProposalForm({ ...proposalForm, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Target Dana (opsional)</Label>
            <Input type="number" placeholder="Masukkan target dana (opsional)" value={proposalForm.targetAmount} onChange={(e) => setProposalForm({ ...proposalForm, targetAmount: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Batal</Button>
            <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" disabled={submitting} onClick={onSubmit}>
              {submitting ? 'Mengirim...' : 'Ajukan Proposal'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
