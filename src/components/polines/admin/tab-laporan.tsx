'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Eye, Printer, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Campaign, FundUsage } from '@/components/polines/types'
import { formatRupiah } from '@/components/polines/types'
import { downloadLaporanPdf } from './download-laporan-pdf'

const ITEMS_PER_PAGE = 10

export type LaporanCampaign = Campaign & {
  totalUsed: number
  sisaDana: number
  laporanStatus: 'Selesai' | 'Progress'
}

interface LaporanTabProps {
  allCampaigns: Campaign[]
  fundUsages: FundUsage[]
  onViewDetail: (c: LaporanCampaign) => void
}

export function LaporanTab({ allCampaigns, fundUsages, onViewDetail }: LaporanTabProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [printingId, setPrintingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const laporanData: LaporanCampaign[] = allCampaigns.map(c => {
    const usages = (fundUsages || []).filter(f => f.campaignId === c.id)
    // totalUsed HANYA menjumlahkan entri bertipe "uang" - entri "barang"
    // tidak punya nilai Rupiah yang applicable jadi tidak ikut dijumlah.
    const totalUsed = usages.reduce((sum, f) => (f.type === 'uang' ? sum + (f.amount ?? 0) : sum), 0)
    return {
      ...c,
      totalUsed,
      sisaDana: c.collectedAmount - totalUsed,
      laporanStatus: c.collectedAmount >= c.targetAmount ? 'Selesai' : 'Progress',
    }
  })

  const filtered = laporanData.filter(c => {
    const matchSearch = search === '' || c.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.laporanStatus === statusFilter
    return matchSearch && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const handlePrint = async (c: LaporanCampaign) => {
    setPrintingId(c.id)
    try {
      await downloadLaporanPdf({
        campaignTitle: c.title,
        collectedAmount: c.collectedAmount,
        fundUsages: (fundUsages || []).filter(f => f.campaignId === c.id),
      })
    } finally {
      setPrintingId(null)
    }
  }

  return (
    <Card className="shadow-sm border-gray-100">
      <CardContent className="p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Cari campaign..."
              className="pl-9 rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-40 rounded-lg border-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Selesai">Selesai</SelectItem>
              <SelectItem value="Progress">Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Tidak ada campaign ditemukan</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-600 hover:bg-teal-600">
                  <TableHead className="text-white font-semibold">Campaign</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Terkumpul</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Sisa Dana</TableHead>
                  <TableHead className="text-white font-semibold">Status</TableHead>
                  <TableHead className="text-white font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{c.title}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-700">
                      {formatRupiah(c.collectedAmount)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-700">
                      {formatRupiah(c.sisaDana)}
                    </TableCell>
                    <TableCell>
                      <Badge className={c.laporanStatus === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                        {c.laporanStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-teal-600 hover:text-teal-700"
                          onClick={() => onViewDetail(c)} title="Lihat & Edit">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-teal-600 hover:text-teal-700"
                          onClick={() => handlePrint(c)}
                          disabled={printingId === c.id}
                          title="Download Laporan PDF"
                        >
                          {printingId === c.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Printer className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 mt-4">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg"
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm"
                className={`h-8 w-8 p-0 rounded-lg ${p === page ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}`}
                onClick={() => setPage(p)}>
                {p}
              </Button>
            ))}
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}