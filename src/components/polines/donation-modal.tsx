'use client'

import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Check, ArrowLeft, ArrowRight, Send, DollarSign, Gift, Banknote, QrCode, CreditCard } from 'lucide-react'
import type { Campaign } from './types'
import { formatRupiah, ADMIN_WHATSAPP } from './types'
import { QRCodeSVG } from './qr-code'

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

export function DonationModal({
  open, onClose, donationStep, setDonationStep,
  donationForm, setDonationForm, campaigns, submitting,
  submitDonation, session
}: DonationModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {donationStep === 3 ? '🎉 Donasi Berhasil!' : donationStep === 1 ? 'Donasi' : 'Isi Detail Donasi'}
          </DialogTitle>
          <DialogDescription>
            {donationStep === 1 && 'Pilih campaign dan tipe donasi'}
            {donationStep === 2 && 'Masukkan nominal dan metode pembayaran, lalu kirim donasi'}
            {donationStep === 3 && 'Terima kasih atas kebaikan Anda'}
          </DialogDescription>
        </DialogHeader>

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

        {donationStep === 2 && (
          <div className="space-y-4">
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
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button type="button" variant={donationForm.paymentMethod === 'transfer' ? 'default' : 'outline'} className={donationForm.paymentMethod === 'transfer' ? 'bg-teal-600 hover:bg-teal-700 text-xs' : 'text-xs'} onClick={() => setDonationForm({ ...donationForm, paymentMethod: 'transfer' })}>
                  <Banknote className="h-4 w-4 mr-1" /> Transfer
                </Button>
                <Button type="button" variant={donationForm.paymentMethod === 'qris' ? 'default' : 'outline'} className={donationForm.paymentMethod === 'qris' ? 'bg-teal-600 hover:bg-teal-700 text-xs' : 'text-xs'} onClick={() => setDonationForm({ ...donationForm, paymentMethod: 'qris' })}>
                  <QrCode className="h-4 w-4 mr-1" /> QRIS
                </Button>
                <Button type="button" variant={donationForm.paymentMethod === 'tunai' ? 'default' : 'outline'} className={donationForm.paymentMethod === 'tunai' ? 'bg-teal-600 hover:bg-teal-700 text-xs' : 'text-xs'} onClick={() => setDonationForm({ ...donationForm, paymentMethod: 'tunai' })}>
                  <CreditCard className="h-4 w-4 mr-1" /> Tunai
                </Button>
              </div>
            </div>
            {donationForm.paymentMethod === 'qris' && (
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-2">Scan QR Code untuk Pembayaran</p>
                <QRCodeSVG />
                <p className="text-xs text-muted-foreground mt-2">Gunakan aplikasi e-wallet untuk scan</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDonationStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
              </Button>
              <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" disabled={submitting || !donationForm.amount} onClick={submitDonation}>
                {submitting ? 'Mengirim...' : 'Kirim Donasi'} <Send className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {donationStep === 3 && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center animate-bounce">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-lg text-green-700">Donasi Berhasil Terkirim! 🎉</p>
              <p className="text-sm text-muted-foreground mt-2">Donasi Anda telah diterima dan sedang menunggu verifikasi admin</p>
            </div>

            {/* Ringkasan Donasi */}
            <Card className="p-4 bg-green-50/50 border-green-100 text-left">
              <h4 className="font-semibold mb-3 text-green-700 text-sm">📄 Detail Donasi</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Campaign</span>
                  <span className="font-medium text-right max-w-[180px] truncate">{campaigns.find(c => c.id === donationForm.campaignId)?.title ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama Donatur</span>
                  <span className="font-medium">{session?.user?.name ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipe Donasi</span>
                  <span className="font-medium">{donationForm.type === 'uang' ? '💵 Uang' : '📦 Barang'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nominal</span>
                  <span className="font-bold text-teal-600">{formatRupiah(Number(donationForm.amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode Pembayaran</span>
                  <span className="font-medium capitalize">{donationForm.paymentMethod === 'qris' ? '📱 QRIS' : donationForm.paymentMethod === 'transfer' ? '🏦 Transfer Bank' : '💵 Tunai'}</span>
                </div>
              </div>
            </Card>

            {/* QR Code for QRIS */}
            {donationForm.paymentMethod === 'qris' && (
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border">
                <p className="text-xs font-medium mb-2 text-muted-foreground">📱 Scan QR Code untuk pembayaran</p>
                <QRCodeSVG />
                <p className="text-xs text-muted-foreground mt-2">QRIS Payment</p>
              </div>
            )}

            {/* WhatsApp Verification - Opsional */}
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 justify-center mb-2">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Send className="h-4 w-4 text-white" />
                </div>
                <p className="font-semibold text-green-700">Konfirmasi via WhatsApp (Opsional)</p>
              </div>
              <p className="text-xs text-green-600 mb-3">
                Ingin mengirim bukti konfirmasi donasi ke admin via WhatsApp? Klik tombol di bawah:
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold" onClick={() => {
                const campTitle = campaigns.find(c => c.id === donationForm.campaignId)?.title ?? 'Donasi Polines Care'
                const waMsg = encodeURIComponent(
                  `Assalamualaikum, saya ingin konfirmasi donasi:\n` +
                  `📦 Campaign: ${campTitle}\n` +
                  `💰 Nominal: ${formatRupiah(Number(donationForm.amount))}\n` +
                  `💳 Metode: ${donationForm.paymentMethod}\n` +
                  `🏷 Tipe: ${donationForm.type}\n` +
                  `👤 Nama: ${session?.user?.name}\n` +
                  `📧 Email: ${session?.user?.email}\n\n` +
                  `Mohon konfirmasi dan verifikasi donasi saya. Terima kasih 🙏`
                )
                window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${waMsg}`, '_blank')
              }}>
                <Send className="h-4 w-4 mr-1" /> Konfirmasi via WhatsApp
              </Button>
            </div>

            {/* Status info */}
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-700">
                ⏳ <strong>Status: Menunggu Verifikasi</strong> — Admin akan memverifikasi donasi Anda.
                Anda bisa melihat status di tab <strong>&quot;Riwayat&quot;</strong> pada Dashboard.
              </p>
            </div>

            <Button variant="outline" className="w-full" onClick={onClose}>
              Tutup
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
