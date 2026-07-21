'use client'

import React, { useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Save, Upload, X, FileImage } from 'lucide-react'

export interface FundUsageSubmitPayload {
  type: 'uang' | 'barang'
  date: string
  description: string
  amount: string        // dipakai kalau type === 'uang'
  itemName: string       // dipakai kalau type === 'barang'
  itemQuantity: string   // dipakai kalau type === 'barang'
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

const DEFAULT_FORM: FundUsageSubmitPayload = {
  type: 'uang',
  date: '',
  description: '',
  amount: '',
  itemName: '',
  itemQuantity: '',
  proofFile: null,
}

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

  const isValid =
    !!form.date &&
    !!form.description &&
    (form.type === 'uang' ? !!form.amount : !!form.itemName && !!form.itemQuantity)

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      {/* FIX: max-h + overflow-y-auto supaya form panjang bisa discroll di HP,
          bukan kepotong/nggak kejangkau di luar viewport */}
      <DialogContent className="sm:max-w-md w-[95vw] max-h-[85vh] overflow-y-auto rounded-xl">
        <DialogHeader className="sticky top-0 bg-white z-10 pb-2">
          <DialogTitle>{isEdit ? 'Edit Penggunaan Dana' : 'Tambah Penggunaan Dana'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm text-gray-500">Campaign</Label>
            <p className="text-sm font-medium text-gray-900">{campaignTitle}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Tipe</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'uang' })}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  form.type === 'uang'
                    ? 'border-teal-600 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Uang
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, type: 'barang' })}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  form.type === 'barang'
                    ? 'border-teal-600 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                Barang
              </button>
            </div>
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
              placeholder={
                form.type === 'uang'
                  ? 'Contoh: Pembelian sembako untuk korban banjir'
                  : 'Contoh: Beras dibagikan ke 100 KK terdampak banjir'
              }
              rows={3}
              className="rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {form.type === 'uang' ? (
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
          ) : (
            // FIX: grid-cols-1 di HP paling sempit, balik grid-cols-2 mulai breakpoint sm
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Nama Barang</Label>
                <Input
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  placeholder="Contoh: Beras"
                  className="rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Jumlah</Label>
                <Input
                  value={form.itemQuantity}
                  onChange={(e) => setForm({ ...form, itemQuantity: e.target.value })}
                  placeholder="Contoh: 50 kg"
                  className="rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          )}

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
                {isEdit && existingDocumentUrl ? (
                  <a
                    href={existingDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-teal-600 hover:underline mt-1.5"
                  >
                    <FileImage className="h-3.5 w-3.5" />
                    Lihat bukti yang tersimpan saat ini
                  </a>
                ) : null}
              </>
            )}
            {isEdit && !form.proofFile && existingDocumentUrl && (
              <p className="text-xs text-gray-400">Biarkan kosong untuk tetap memakai bukti yang sudah ada.</p>
            )}
          </div>

          {/* FIX: sticky di bawah supaya tombol aksi tetap kejangkau saat konten di-scroll */}
          <div className="flex gap-2 pt-2 sticky bottom-0 bg-white pb-1">
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