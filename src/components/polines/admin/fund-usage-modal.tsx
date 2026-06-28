'use client'

import React, { useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Save, Upload, X, FileImage } from 'lucide-react'

export interface FundUsageSubmitPayload {
  date: string
  description: string
  amount: string
  proofFile: File | null
}

interface FundUsageModalProps {
  open: boolean
  onClose: () => void
  campaignTitle: string
  form: FundUsageSubmitPayload
  setForm: (form: FundUsageSubmitPayload) => void
  submitting?: boolean
  onSubmit: () => void
  /** 'create' (default) untuk tambah baru, 'edit' untuk mengubah entri yang sudah ada */
  mode?: 'create' | 'edit'
  /** URL bukti yang sudah tersimpan sebelumnya (mode edit). Ditampilkan sebagai link,
   *  tetap dipakai kalau admin tidak memilih file baru. */
  existingDocumentUrl?: string | null
}

const DEFAULT_FORM: FundUsageSubmitPayload = { date: '', description: '', amount: '', proofFile: null }

export function FundUsageModal({
  open, onClose, campaignTitle, form = DEFAULT_FORM, setForm, submitting, onSubmit,
  mode = 'create', existingDocumentUrl,
}: FundUsageModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEdit = mode === 'edit'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setForm({ ...form, proofFile: file })
  }

  const handleSubmit = () => {
    onSubmit()
  }

  const isValid = !!form.date && !!form.description && !!form.amount

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Penggunaan Dana' : 'Tambah Penggunaan Dana'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-500">Campaign</Label>
            <p className="text-sm font-medium text-gray-900">{campaignTitle}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Tanggal</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Keterangan</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Contoh: Pembelian sembako untuk korban banjir"
              rows={3}
              className="rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Nominal (Rp)</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="Contoh: 1500000"
              className="rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Upload Bukti</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {form.proofFile ? (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <span className="text-sm text-gray-700 truncate">{form.proofFile.name}</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, proofFile: null })}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Select Image
                </button>
                {isEdit && existingDocumentUrl && (
                  <a
                    href={existingDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-teal-600 hover:underline mt-1.5"
                  >
                    <FileImage className="h-3.5 w-3.5" />
                    Lihat bukti yang tersimpan saat ini
                  </a>
                )}
              </>
            )}
            {isEdit && !form.proofFile && existingDocumentUrl && (
              <p className="text-xs text-gray-400">Biarkan kosong untuk tetap memakai bukti yang sudah ada.</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1 rounded-lg" onClick={onClose}>
              Batal
            </Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
              disabled={!isValid || submitting}
              onClick={handleSubmit}
            >
              {isEdit ? <Save className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              {submitting ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}