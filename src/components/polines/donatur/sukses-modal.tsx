'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Send } from 'lucide-react'
import type { Campaign } from '../types'
import { formatRupiah, formatUniqueCode, calculateTransferAmount, ADMIN_WHATSAPP } from '../types'

interface SuksesModalProps {
  open: boolean
  onClose: () => void
  donationForm: { campaignId: string; type: string; amount: string; paymentMethod: string; message: string; proofUrl: string }
  campaigns: Campaign[]
  session: any
  uniqueCode: number
  barangItems: { name: string; qty: string }[]
}

export function SuksesModal({ open, onClose, donationForm, campaigns, session, uniqueCode, barangItems }: SuksesModalProps) {
  const campTitle = campaigns.find(c => c.id === donationForm.campaignId)?.title ?? 'Donasi Polines Care'

  const handleWA = () => {
    const itemList = barangItems.filter(i => i.name).map(i => `- ${i.name}${i.qty ? ` (${i.qty})` : ''}`).join('\n')
    const waMsg = encodeURIComponent(
      `Assalamualaikum, saya ingin konfirmasi donasi:\n` +
      `📦 Campaign: ${campTitle}\n` +
      `🏷 Tipe: ${donationForm.type}\n` +
      (donationForm.type === 'barang'
        ? `📋 Barang:\n${itemList}\n`
        : `💰 Nominal: ${formatRupiah(Number(donationForm.amount))}\n💳 Metode: ${donationForm.paymentMethod}\n`
      ) +
      `👤 Nama: ${session?.user?.name}\n📧 Email: ${session?.user?.email}\n\nMohon konfirmasi. Terima kasih 🙏`
    )
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${waMsg}`, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>🎉 Donasi Berhasil!</DialogTitle>
          <DialogDescription>Terima kasih atas kebaikan Anda</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-center">
          {/* Icon sukses */}
          <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-lg text-green-700">Donasi Berhasil Terkirim! 🎉</p>
            <p className="text-sm text-muted-foreground mt-1">Sedang menunggu verifikasi admin</p>
          </div>

          {/* ── Ringkasan: UANG ── */}
          {donationForm.type === 'uang' && (
            <Card className="p-4 bg-green-50/50 border-green-100 text-left space-y-2">
              <h4 className="font-semibold text-green-700 text-sm">📄 Detail Donasi</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Campaign</span>
                  <span className="font-medium text-right max-w-[180px] truncate">{campTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Donatur</span>
                  <span className="font-medium">{session?.user?.name ?? '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nominal</span>
                  <span className="font-bold text-teal-600">{formatRupiah(Number(donationForm.amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode</span>
                  <span className="font-medium">
                    {donationForm.paymentMethod === 'qris' ? '📱 QRIS' : donationForm.paymentMethod === 'transfer' ? '🏦 Transfer Bank' : '💵 Tunai'}
                  </span>
                </div>
                {donationForm.paymentMethod === 'transfer' && uniqueCode > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Kode Unik</span>
                      <Badge className="bg-violet-600 text-white text-xs font-mono">{formatUniqueCode(uniqueCode)}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Transfer</span>
                      <span className="font-bold text-violet-600 font-mono">
                        {formatRupiah(calculateTransferAmount(Number(donationForm.amount) || 0, uniqueCode))}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* ── Ringkasan: BARANG ── */}
          {donationForm.type === 'barang' && (
            <Card className="p-4 bg-green-50/50 border-green-100 text-left space-y-2">
              <h4 className="font-semibold text-green-700 text-sm">📄 Detail Donasi Barang</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Campaign</span>
                  <span className="font-medium text-right max-w-[180px] truncate">{campTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Donatur</span>
                  <span className="font-medium">{session?.user?.name ?? '-'}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">Barang</span>
                  <span className="font-medium text-right max-w-[180px]">
                    {barangItems.filter(i => i.name).map(i => `${i.name}${i.qty ? ` (${i.qty})` : ''}`).join(', ')}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Konfirmasi WA */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-left">
            <p className="font-semibold text-green-700 mb-1">Konfirmasi via WhatsApp (Opsional)</p>
            <p className="text-xs text-green-600 mb-3">Kirim bukti konfirmasi donasi ke admin via WhatsApp</p>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={handleWA}>
              <Send className="h-4 w-4 mr-1" /> Konfirmasi via WhatsApp
            </Button>
          </div>

          {/* Status */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-700">
              ⏳ <strong>Status: Menunggu Verifikasi</strong> — Cek di tab <strong>Riwayat</strong> pada Dashboard.
            </p>
          </div>

          <Button variant="outline" className="w-full" onClick={onClose}>Tutup</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}