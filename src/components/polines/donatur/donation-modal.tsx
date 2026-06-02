'use client'

import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, Send, DollarSign, Gift, Banknote, QrCode, CreditCard, Copy, CheckCheck, Plus, Trash2, Upload, X, ImageIcon } from 'lucide-react'
import type { Campaign } from '../types'
import { formatRupiah, formatUniqueCode, calculateTransferAmount } from '../types'
import { QRCodeSVG } from './qr-code'
import { SuksesModal } from './sukses-modal'

interface DonationModalProps {
  open: boolean
  onClose: () => void
  donationStep: number
  setDonationStep: (step: number) => void
  donationForm: { campaignId: string; type: string; amount: string; paymentMethod: string; message: string; proofUrl: string }
  setDonationForm: (form: any) => void
  campaigns: Campaign[]
  submitting: boolean
  submitDonation: () => void
  session: any
}

interface BarangItem { name: string; qty: string }

// ── Data dummy rekening bank ──
const BANK_ACCOUNTS: Record<string, { norek: string; atas: string } | null> = {
  bri: { norek: '1234-5678-9012-3456', atas: 'Yayasan Polines Care' },
  bca: { norek: '8765-4321-0987-6543', atas: 'Yayasan Polines Care' },
  mandiri: { norek: '1100-2200-3300-4400', atas: 'Yayasan Polines Care' },
  bni: null,
  bsi: { norek: '7788-9900-1122-3344', atas: 'Yayasan Polines Care' },
  cimb: null,
  dana: { norek: '0812-3456-7890', atas: 'Polines Care' },
  gopay: null,
  ovo: null,
}

const BANK_LABELS: Record<string, string> = {
  bri: 'BRI', bca: 'BCA', mandiri: 'Mandiri', bni: 'BNI', bsi: 'BSI',
  cimb: 'CIMB Niaga', dana: 'DANA', gopay: 'GoPay', ovo: 'OVO',
}

// ── Komponen Upload Foto ──
function UploadFoto({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    onChange(url)
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <Label>{label} <span className="text-muted-foreground text-xs">(opsional)</span></Label>
      {!preview ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <Upload className="h-5 w-5 text-gray-400" />
          </div>
          <p className="text-sm text-muted-foreground">Klik untuk upload foto</p>
          <p className="text-xs text-muted-foreground">JPG, PNG, maks 5MB</p>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border">
          <img src={preview} alt="preview" className="w-full h-36 object-cover" />
          <button
            type="button"
            className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80"
            onClick={handleRemove}
          >
            <X className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

// ── Komponen Info Rekening ──
function InfoRekening({ selectedBank, setSelectedBank }: { selectedBank: string; setSelectedBank: (v: string) => void }) {
  const [copiedNorek, setCopiedNorek] = useState(false)
  const account = selectedBank ? BANK_ACCOUNTS[selectedBank] : undefined

  const handleCopy = () => {
    if (account?.norek) {
      navigator.clipboard.writeText(account.norek).then(() => {
        setCopiedNorek(true)
        setTimeout(() => setCopiedNorek(false), 2000)
      })
    }
  }

  return (
    <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
      <p className="text-sm font-semibold">Info Rekening Tujuan</p>

      {/* Pilih Bank */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Pilih Bank</Label>
        <Select value={selectedBank} onValueChange={setSelectedBank}>
          <SelectTrigger className="bg-white">
            <SelectValue placeholder="Pilih bank tujuan" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(BANK_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Info Rekening */}
      {selectedBank && (
        account ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white border rounded-lg px-3 py-2">
              <div>
                <p className="text-xs text-muted-foreground">{BANK_LABELS[selectedBank]}</p>
                <p className="font-mono font-semibold text-sm tracking-wider">{account.norek}</p>
                <p className="text-xs text-muted-foreground">a.n. {account.atas}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 ml-2"
                onClick={handleCopy}
              >
                {copiedNorek ? <CheckCheck className="h-3.5 w-3.5 text-teal-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
            {copiedNorek && (
              <p className="text-xs text-teal-600 text-center">✓ Nomor rekening tersalin!</p>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <p className="text-sm text-amber-700">
              😔 Maaf, bank tidak tersedia. Silahkan pilih bank lain.
            </p>
          </div>
        )
      )}
    </div>
  )
}

export function DonationModal({
  open, onClose, donationStep, setDonationStep,
  donationForm, setDonationForm, campaigns, submitting,
  submitDonation, session
}: DonationModalProps) {
  const selectedCampaign = campaigns.find(c => c.id === donationForm.campaignId)
  const uniqueCode = selectedCampaign?.uniqueCode ?? 0
  const [copied, setCopied] = useState(false)
  const [barangItems, setBarangItems] = useState<BarangItem[]>([{ name: '', qty: '' }])
  const [alamatPengirim, setAlamatPengirim] = useState('')
  const [nohpPengirim, setNohpPengirim] = useState('')
  const [selectedBank, setSelectedBank] = useState('')

  const handleClose = () => {
    setBarangItems([{ name: '', qty: '' }])
    setAlamatPengirim('')
    setNohpPengirim('')
    setSelectedBank('')
    onClose()
  }

  const handleCopyUniqueCode = () => {
    const total = calculateTransferAmount(Number(donationForm.amount) || 0, uniqueCode)
    navigator.clipboard.writeText(`Kode Unik: ${formatUniqueCode(uniqueCode)}\nTotal Transfer: ${formatRupiah(total)}`)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  const addBarangItem = () => setBarangItems(prev => [...prev, { name: '', qty: '' }])
  const removeBarangItem = (i: number) => setBarangItems(prev => prev.filter((_, idx) => idx !== i))
  const updateBarangItem = (i: number, field: keyof BarangItem, val: string) =>
    setBarangItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  if (donationStep === 3) {
    return (
      <SuksesModal
        open={open}
        onClose={handleClose}
        donationForm={donationForm}
        campaigns={campaigns}
        session={session}
        uniqueCode={uniqueCode}
        barangItems={barangItems}
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose() }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{donationStep === 1 ? 'Donasi' : 'Isi Detail Donasi'}</DialogTitle>
          <DialogDescription>
            {donationStep === 1 && 'Pilih campaign dan tipe donasi'}
            {donationStep === 2 && donationForm.type === 'uang' && 'Masukkan nominal dan metode pembayaran, lalu kirim donasi'}
            {donationStep === 2 && donationForm.type === 'barang' && 'Masukkan jenis barang dan jumlah, lalu kirim donasi'}
          </DialogDescription>
        </DialogHeader>

        {/* ── STEP 1 ── */}
        {donationStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign</Label>
              <Select value={donationForm.campaignId} onValueChange={(v) => setDonationForm({ ...donationForm, campaignId: v })}>
                <SelectTrigger><SelectValue placeholder="Pilih campaign" /></SelectTrigger>
                <SelectContent>
                  {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipe Donasi</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={donationForm.type === 'uang' ? 'default' : 'outline'} className={donationForm.type === 'uang' ? 'bg-teal-600 hover:bg-teal-700' : ''} onClick={() => setDonationForm({ ...donationForm, type: 'uang' })}>
                  <DollarSign className="h-4 w-4 mr-1" /> Uang
                </Button>
                <Button type="button" variant={donationForm.type === 'barang' ? 'default' : 'outline'} className={donationForm.type === 'barang' ? 'bg-teal-600 hover:bg-teal-700' : ''} onClick={() => setDonationForm({ ...donationForm, type: 'barang' })}>
                  <Gift className="h-4 w-4 mr-1" /> Barang
                </Button>
              </div>
            </div>
            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" disabled={!donationForm.campaignId} onClick={() => setDonationStep(2)}>
              Selanjutnya <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* ── STEP 2: UANG ── */}
        {donationStep === 2 && donationForm.type === 'uang' && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto pr-1 space-y-4 flex-1">

              {/* Nominal */}
              <div className="space-y-2">
                <Label>Nominal Donasi (Rp)</Label>
                <Input type="number" placeholder="Masukkan nominal" value={donationForm.amount} onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })} />
                <div className="flex gap-2 flex-wrap">
                  {[50000, 100000, 200000, 500000, 1000000].map(a => (
                    <Button key={a} variant="outline" size="sm" className="text-xs" onClick={() => setDonationForm({ ...donationForm, amount: String(a) })}>
                      {formatRupiah(a)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Metode Pembayaran */}
              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'transfer', icon: <Banknote className="h-4 w-4 mr-1" />, label: 'Transfer' },
                    { val: 'qris', icon: <QrCode className="h-4 w-4 mr-1" />, label: 'QRIS' },
                    { val: 'tunai', icon: <CreditCard className="h-4 w-4 mr-1" />, label: 'Tunai' },
                  ].map(({ val, icon, label }) => (
                    <Button key={val} type="button" variant={donationForm.paymentMethod === val ? 'default' : 'outline'} className={`text-xs ${donationForm.paymentMethod === val ? 'bg-teal-600 hover:bg-teal-700' : ''}`} onClick={() => setDonationForm({ ...donationForm, paymentMethod: val })}>
                      {icon} {label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Info Rekening — hanya saat transfer */}
              {donationForm.paymentMethod === 'transfer' && (
                <>
                  <InfoRekening selectedBank={selectedBank} setSelectedBank={setSelectedBank} />

                  {/* Kode Unik */}
                  {donationForm.amount && (
                    <div className="rounded-lg border-2 border-violet-200 bg-violet-50 p-4 space-y-3">
                      <Badge className="bg-violet-600 text-white text-xs font-bold">Kode Unik Transfer</Badge>
                      <p className="text-sm text-violet-800">Transfer tepat nominal berikut agar mudah diverifikasi admin:</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="border-violet-300 text-violet-700 font-mono text-xs">{formatRupiah(Number(donationForm.amount) || 0)}</Badge>
                        <span className="text-violet-500 font-bold">+</span>
                        <Badge variant="outline" className="border-violet-300 text-violet-700 font-mono text-xs">Kode: {formatUniqueCode(uniqueCode)}</Badge>
                        <span className="text-violet-500 font-bold">=</span>
                        <Badge className="bg-violet-600 text-white font-mono text-sm font-bold">{formatRupiah(calculateTransferAmount(Number(donationForm.amount) || 0, uniqueCode))}</Badge>
                      </div>
                      <Button type="button" variant="outline" size="sm" className="w-full border-violet-300 text-violet-700 hover:bg-violet-100 text-xs" onClick={handleCopyUniqueCode}>
                        {copied ? <CheckCheck className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        {copied ? 'Tersalin!' : 'Salin Kode Unik & Total Transfer'}
                      </Button>
                    </div>
                  )}
                </>
              )}

              {donationForm.paymentMethod === 'qris' && (
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Scan QR Code untuk Pembayaran</p>
                  <QRCodeSVG />
                  <p className="text-xs text-muted-foreground mt-2">Gunakan aplikasi e-wallet untuk scan</p>
                </div>
              )}

              {/* Upload Bukti */}
              <UploadFoto
                label="Upload Bukti Pembayaran"
                value={donationForm.proofUrl}
                onChange={(v) => setDonationForm({ ...donationForm, proofUrl: v })}
              />

              {/* Keterangan */}
              <div className="space-y-2">
                <Label>Keterangan / Pesan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                <Textarea
                  placeholder="Tulis pesan atau keterangan donasi..."
                  value={donationForm.message}
                  onChange={(e) => setDonationForm({ ...donationForm, message: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>

            </div>

            {/* Tombol sticky */}
            <div className="flex gap-2 pt-4 border-t mt-2 shrink-0">
              <Button variant="outline" className="flex-1" onClick={() => setDonationStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
              </Button>
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" disabled={submitting || !donationForm.amount} onClick={submitDonation}>
                {submitting ? 'Mengirim...' : 'Kirim Donasi'} <Send className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: BARANG ── */}
        {donationStep === 2 && donationForm.type === 'barang' && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto pr-1 space-y-5 flex-1">

              {/* Jenis Barang */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold">Jenis Barang</Label>
                  <Button type="button" variant="outline" size="sm" className="h-8 w-8 p-0" onClick={addBarangItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {barangItems.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input placeholder="Masukkan jenis barang" value={item.name} onChange={(e) => updateBarangItem(i, 'name', e.target.value)} className="flex-1" />
                      <Input placeholder="jumlah" value={item.qty} onChange={(e) => updateBarangItem(i, 'qty', e.target.value)} className="w-24" />
                      {barangItems.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="h-9 w-9 p-0 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => removeBarangItem(i)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Pengiriman */}
              <div className="space-y-3">
                <Label className="text-base font-bold">Info Pengiriman</Label>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Alamat</Label>
                  <Input placeholder="Alamat pengirim" value={alamatPengirim} onChange={(e) => setAlamatPengirim(e.target.value)} />
                </div>
                <div className="grid grid-cols-[80px_1fr] items-center gap-2">
                  <Label className="text-sm text-muted-foreground">No HP</Label>
                  <Input placeholder="Nomor HP pengirim" value={nohpPengirim} onChange={(e) => setNohpPengirim(e.target.value)} />
                </div>
              </div>

              {/* Upload Foto Barang */}
              <UploadFoto
                label="Upload Foto Barang"
                value={donationForm.proofUrl}
                onChange={(v) => setDonationForm({ ...donationForm, proofUrl: v })}
              />

              {/* Keterangan */}
              <div className="space-y-2">
                <Label>Keterangan / Pesan <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                <Textarea
                  placeholder="Tulis pesan atau keterangan donasi barang..."
                  value={donationForm.message}
                  onChange={(e) => setDonationForm({ ...donationForm, message: e.target.value })}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Info Tujuan */}
              <Card className="p-4 bg-gray-50 space-y-1">
                <p className="font-bold text-sm">Kirim ke</p>
                <p className="text-sm text-muted-foreground">{(selectedCampaign as any)?.address ?? 'Jl. Tembalang Baru no 32'}</p>
                <p className="font-bold text-sm mt-2">*Apabila sudah dikirim harap konfirmasi</p>
                <p className="text-sm text-muted-foreground">{(selectedCampaign as any)?.contactPhone ?? '08123123123'}</p>
              </Card>

            </div>

            {/* Tombol sticky */}
            <div className="flex gap-2 pt-4 border-t mt-2 shrink-0">
              <Button variant="outline" className="flex-1" onClick={() => setDonationStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
              </Button>
              <Button
                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                disabled={submitting || barangItems.every(i => !i.name)}
                onClick={() => {
  const totalQty = barangItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
  setDonationForm({ 
    ...donationForm, 
    amount: String(totalQty || 1),  // fallback 1 kalau qty kosong semua
    paymentMethod: 'tunai' 
  })
  submitDonation()
}}
              >
                {submitting ? 'Mengirim...' : 'Kirim Donasi'} <Send className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}