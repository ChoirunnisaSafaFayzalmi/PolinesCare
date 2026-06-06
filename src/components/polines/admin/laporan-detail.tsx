'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit, Plus, Printer, FileText, Heart } from 'lucide-react'
import type { FundUsage } from '@/components/polines/types'
import { formatRupiah, formatDate, getCategoryColor } from '@/components/polines/types'
import type { LaporanCampaign } from './tab-laporan'

const inputCls = 'rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'

interface LaporanDetailViewProps {
  campaign: LaporanCampaign
  fundUsages: FundUsage[]
  initialMode?: 'view' | 'edit' | 'print'
  onAddFundUsage: (campaignId: string, description: string, amount: string) => void
}

export function LaporanDetailView({
  campaign, fundUsages, initialMode = 'view', onAddFundUsage,
}: LaporanDetailViewProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'print'>(initialMode)
  const [form, setForm] = useState({ description: '', amount: '' })

  const totalUsed = (fundUsages || []).reduce((sum, f) => sum + f.amount, 0)

  // ── PRINT ──────────────────────────────────────────────────
  if (mode === 'print') {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2 pb-4 border-b-2 border-teal-600">
          <div className="flex items-center justify-center gap-2">
            <Heart className="h-6 w-6 text-teal-600" />
            <h1 className="text-xl font-bold text-gray-900">Polines Care</h1>
          </div>
          <h2 className="text-lg font-bold text-gray-800">Laporan Penggunaan Dana</h2>
          <p className="text-sm text-gray-500">{campaign.title}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Terkumpul', value: formatRupiah(campaign.collectedAmount), color: 'text-teal-600' },
            { label: 'Total Digunakan', value: formatRupiah(totalUsed), color: 'text-orange-600' },
            { label: 'Sisa Dana', value: formatRupiah(campaign.collectedAmount - totalUsed), color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="border rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500 mb-1">{s.label}</p>
              <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-base font-bold">Rincian Penggunaan Dana</CardTitle>
          </CardHeader>
          <CardContent>
            {fundUsages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Belum ada laporan penggunaan dana</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-100 hover:bg-gray-100">
                      <TableHead className="font-semibold">No</TableHead>
                      <TableHead className="font-semibold">Deskripsi</TableHead>
                      <TableHead className="font-semibold">Tanggal</TableHead>
                      <TableHead className="font-semibold text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fundUsages.map((f, idx) => (
                      <TableRow key={f.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell className="font-medium">{f.description}</TableCell>
                        <TableCell className="text-sm text-gray-500">{formatDate(f.date)}</TableCell>
                        <TableCell className="text-right font-semibold text-orange-600">{formatRupiah(f.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 font-bold">
                      <TableCell colSpan={3} className="text-right">TOTAL</TableCell>
                      <TableCell className="text-right text-orange-600">{formatRupiah(totalUsed)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" className="rounded-lg" onClick={() => setMode('view')}>
            Kembali
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Cetak Laporan
          </Button>
        </div>
      </div>
    )
  }

  // ── EDIT ──────────────────────────────────────────────────
  if (mode === 'edit') {
    return (
      <div className="space-y-6">
        <Card className="shadow-sm border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h3 className="text-lg font-bold text-gray-800">{campaign.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <Badge variant="outline" className={getCategoryColor(campaign.category)}>{campaign.category}</Badge>
                  <span className="ml-2">Terkumpul: <span className="font-semibold text-teal-600">{formatRupiah(campaign.collectedAmount)}</span></span>
                </p>
              </div>
              <Button variant="outline" className="rounded-lg" onClick={() => setMode('view')}>
                Kembali
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-base font-bold">Tambah Penggunaan Dana</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Deskripsi Penggunaan Dana</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Contoh: Pembelian sembako untuk korban banjir"
                  rows={3}
                  className={inputCls}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Jumlah (Rp)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Contoh: 1500000"
                  className={inputCls}
                />
              </div>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
                disabled={!form.description || !form.amount}
                onClick={() => {
                  onAddFundUsage(campaign.id, form.description, form.amount)
                  setForm({ description: '', amount: '' })
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Simpan Penggunaan Dana
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-base font-bold">Riwayat Penggunaan Dana</CardTitle>
          </CardHeader>
          <CardContent>
            {fundUsages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Belum ada laporan penggunaan dana</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-teal-600 hover:bg-teal-600">
                      <TableHead className="text-white font-semibold">Deskripsi</TableHead>
                      <TableHead className="text-white font-semibold hidden md:table-cell">Tanggal</TableHead>
                      <TableHead className="text-white font-semibold text-right">Jumlah</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fundUsages.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.description}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-gray-500">{formatDate(f.date)}</TableCell>
                        <TableCell className="text-right font-semibold text-orange-600">{formatRupiah(f.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── VIEW (default) ─────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Terkumpul', value: formatRupiah(campaign.collectedAmount), color: 'from-teal-600 to-teal-700' },
          { label: 'Total Digunakan', value: formatRupiah(totalUsed), color: 'from-orange-500 to-orange-600' },
          { label: 'Sisa Dana', value: formatRupiah(campaign.collectedAmount - totalUsed), color: 'from-emerald-600 to-emerald-700' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-xl p-5 text-white shadow-md`}>
            <p className="text-sm text-white/80 mb-1">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <CardTitle className="text-base font-bold">Detail Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-w-2xl">
            {[
              { label: 'Judul', value: campaign.title },
              { label: 'Tanggal', value: `${formatDate(campaign.startDate)} — ${formatDate(campaign.endDate)}` },
              { label: 'Target Dana', value: formatRupiah(campaign.targetAmount) },
            ].map(({ label, value }, i, arr) => (
              <div key={label}>
                <div className="flex items-start">
                  <span className="text-gray-500 w-36 flex-shrink-0 text-sm">{label}</span>
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
                {i < arr.length - 1 && <Separator className="mt-3" />}
              </div>
            ))}
            <Separator />
            <div className="flex items-start">
              <span className="text-gray-500 w-36 flex-shrink-0 text-sm">Kategori</span>
              <Badge variant="outline" className={getCategoryColor(campaign.category)}>{campaign.category}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold">Riwayat Penggunaan Dana</CardTitle>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm" onClick={() => setMode('edit')}>
            <Edit className="h-4 w-4 mr-1" /> Edit Laporan
          </Button>
        </CardHeader>
        <CardContent>
          {fundUsages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Belum ada laporan penggunaan dana</p>
          ) : (
            <div className="space-y-3">
              {fundUsages.map(f => (
                <div key={f.id} className="p-4 rounded-lg border border-gray-100 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{f.description}</p>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(f.date)}</p>
                  </div>
                  <p className="font-semibold text-orange-600 whitespace-nowrap">{formatRupiah(f.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-teal-100 rounded-lg p-2.5">
                <FileText className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Laporan Penggunaan Dana</p>
                <p className="text-xs text-gray-500">
                  {fundUsages.length} catatan · {formatRupiah(totalUsed)} total digunakan
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-lg text-sm" onClick={() => setMode('print')}>
              <Printer className="h-4 w-4 mr-1" /> Print Laporan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}