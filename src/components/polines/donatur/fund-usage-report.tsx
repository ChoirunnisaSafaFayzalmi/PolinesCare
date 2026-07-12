// LOKASI: components/polines/fund-usage-report.tsx
//
// Komponen ini terima campaignId, fetch data laporan penggunaan dana
// sendiri (client-side), lalu render ringkasan + rinciannya.
// Dipanggil dari TabRiwayat saat icon Lihat/Cetak diklik - tampil
// in-place (gak pindah URL), sama seperti pola /admin/laporan.

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Printer, FileText, Loader2 } from 'lucide-react'
import { formatRupiah, formatDate } from '@/components/polines/types'

interface FundUsageItem {
  id: string
  type: string // 'uang' | 'barang'
  description: string
  amount: number | null
  itemName?: string | null
  itemQuantity?: number | null
  date: string
  documentUrl?: string | null
}

// Cuma field yang dibutuhkan buat ditampilkan - SENGAJA tidak menyertakan
// nama donatur karena halaman ini publicly accessible (gak ada auth gate),
// jadi identitas donatur individual tidak ditampilkan di sini.
interface BarangDiterimaItem {
  id: string
  itemName?: string | null
  itemQuantity?: number | null
  createdAt: string
}

interface CampaignSummary {
  id: string
  title: string
  targetAmount: number
  collectedAmount: number
  status: string
}

interface FundUsageReportProps {
  campaignId: string
  autoPrint?: boolean
}

export function FundUsageReport({ campaignId, autoPrint = false }: FundUsageReportProps) {
  const [campaign, setCampaign] = useState<CampaignSummary | null>(null)
  const [fundUsages, setFundUsages] = useState<FundUsageItem[]>([])
  const [barangDiterima, setBarangDiterima] = useState<BarangDiterimaItem[]>([])
  const [totalUsed, setTotalUsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [campaignRes, fundUsageRes, donationsRes] = await Promise.all([
          // GANTI URL INI kalau endpoint detail campaign kamu bukan /api/campaigns/[id]
          fetch(`/api/campaigns/${campaignId}`),
          fetch(`/api/fund-usage?campaignId=${campaignId}`),
          // GANTI URL/PARAM INI kalau endpoint donasi kamu beda (mis. bukan query ?campaignId=)
          fetch(`/api/donations?campaignId=${campaignId}`),
        ])

        if (!campaignRes.ok || !fundUsageRes.ok) {
          throw new Error('Gagal memuat laporan')
        }

        const campaignData = await campaignRes.json()
        const fundUsageData = await fundUsageRes.json()

        if (cancelled) return

        // Sesuaikan kalau bentuk response API kamu beda -
        // contoh: { campaign: {...} } atau langsung objek campaign-nya
        setCampaign(campaignData.campaign ?? campaignData)
        setFundUsages(fundUsageData.fundUsages ?? [])
        // totalUsed dari API sudah dihitung khusus tipe "uang" saja
        setTotalUsed(fundUsageData.totalUsed ?? 0)

        // Donasi barang bersifat opsional buat halaman ini - kalau endpoint-nya
        // gagal/beda struktur, jangan sampai bikin seluruh laporan gagal tampil,
        // cukup section "Barang Diterima" aja yang kosong.
        if (donationsRes.ok) {
          const donationsData = await donationsRes.json()
          const allDonations = donationsData.donations ?? donationsData ?? []
          const barang = (allDonations as Array<{
            id: string; type: string; status: string
            itemName?: string | null; itemQuantity?: number | null; createdAt: string
          }>).filter(d => d.type === 'barang' && d.status === 'approved')
          setBarangDiterima(barang)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [campaignId])

  // Kalau dibuka lewat icon Print, otomatis panggil window.print()
  // begitu data selesai dimuat
  useEffect(() => {
    if (!loading && !error && campaign && autoPrint) {
      const timer = setTimeout(() => window.print(), 300)
      return () => clearTimeout(timer)
    }
  }, [loading, error, campaign, autoPrint])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Memuat laporan...
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <p className="text-center text-red-500 py-8">
        {error ?? 'Laporan tidak ditemukan'}
      </p>
    )
  }

  const remaining = campaign.collectedAmount - totalUsed
  const usedPercentage =
    campaign.collectedAmount > 0
      ? Math.min(100, Math.round((totalUsed / campaign.collectedAmount) * 100))
      : 0

  return (
    <div id="laporan-print-area" className="space-y-6 print:space-y-4">
      {/* Pas mode print, sembunyikan SEMUA elemen di halaman (navbar, footer,
          tab lain, dll) lalu munculin balik cuma area laporan ini. Ini perlu
          karena window.print() nge-print apa adanya yang keliatan di layar,
          sedangkan navbar/footer itu di luar komponen ini (bukan children-nya). */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #laporan-print-area, #laporan-print-area * { visibility: visible; }
          #laporan-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      <Card className="print:shadow-none print:border-none">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">{campaign.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Laporan Transparansi Penggunaan Dana
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="print:hidden"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 mr-2" />
            Cetak / Unduh
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Terkumpul</p>
              <p className="font-semibold text-teal-600">
                {formatRupiah(campaign.collectedAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Terpakai</p>
              <p className="font-semibold text-orange-600">
                {formatRupiah(totalUsed)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sisa Dana</p>
              <p className="font-semibold text-gray-700">
                {formatRupiah(remaining)}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progress penggunaan dana</span>
              <span>{usedPercentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all"
                style={{ width: `${usedPercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Progress ini hanya menghitung penggunaan dana (Rupiah). Distribusi barang dicatat terpisah di bawah.
            </p>
          </div>
        </CardContent>
      </Card>

      {barangDiterima.length > 0 && (
        <Card className="print:shadow-none print:border-none">
          <CardHeader>
            <CardTitle className="text-base">Barang Diterima dari Donatur</CardTitle>
            <p className="text-xs text-muted-foreground">
              Daftar donasi barang yang sudah diverifikasi untuk campaign ini.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {barangDiterima.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 border-b pb-2 last:border-none">
                  <div>
                    <p className="text-sm">{b.itemName || '—'}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(b.createdAt)}</p>
                  </div>
                  <Badge variant="outline" className="whitespace-nowrap text-orange-600">
                    {b.itemQuantity ?? 0} pcs
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="print:shadow-none print:border-none">
        <CardHeader>
          <CardTitle className="text-base">Rincian Penggunaan Dana & Penyaluran Barang</CardTitle>
        </CardHeader>
        <CardContent>
          {fundUsages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada laporan penggunaan dana untuk campaign ini.
            </p>
          ) : (
            <div className="space-y-3">
              {fundUsages.map((f) => (
                <div
                  key={f.id}
                  className="flex items-start justify-between gap-3 border-b pb-3 last:border-none"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{f.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(f.date)}
                    </p>
                    {f.documentUrl && (
                      <a
                        href={f.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline print:hidden"
                      >
                        <FileText className="h-3 w-3" />
                        Lihat bukti
                      </a>
                    )}
                  </div>
                  <Badge variant="outline" className="whitespace-nowrap">
                    {f.type === 'barang'
                      ? `${f.itemQuantity ?? ''} ${f.itemName ?? ''}`.trim()
                      : formatRupiah(f.amount ?? 0)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}