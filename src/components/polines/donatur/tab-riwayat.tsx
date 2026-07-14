'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronLeft, ChevronRight, Eye, Printer, ArrowLeft } from 'lucide-react'
import type { Donation } from '@/components/polines/types'
import { formatRupiah, formatDate, getStatusColor } from '@/components/polines/types'
import { FundUsageReport } from '@/components/polines/donatur/fund-usage-report'

const ITEMS_PER_PAGE = 10

interface TabRiwayatProps {
  userDonations: Donation[]
  highlightDonationId?: string   // ⬅ FIX: buat auto-scroll & highlight dari klik notifikasi
}

export function TabRiwayat({ userDonations, highlightDonationId }: TabRiwayatProps) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [page, setPage] = useState(1)

  // ⬅ FIX: state & ref untuk auto-scroll + highlight baris dari notifikasi
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const rowRefs = React.useRef<Record<string, HTMLTableRowElement | null>>({})

  // State untuk swap tampilan list <-> detail laporan (in-place, tanpa ganti URL)
  const [view, setView] = useState<'list' | 'detail'>('list')
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null)
  const [autoPrint, setAutoPrint] = useState(false)

  const openReport = (campaignId: string, print = false) => {
    setActiveCampaignId(campaignId)
    setAutoPrint(print)
    setView('detail')
  }

  const backToList = () => {
    setView('list')
    setActiveCampaignId(null)
    setAutoPrint(false)
  }

  // Metode hanya relevan untuk donasi tipe "uang", jadi opsinya diambil
  // hanya dari donasi bertipe uang, dan filter ini disembunyikan total
  // kalau typeFilter sedang "barang" (karena barang tidak punya metode transfer)
  const methodOptions = useMemo(() => {
    const methods = userDonations
      .filter(d => d.type === 'uang' && d.paymentMethod)
      .map(d => d.paymentMethod as string)
    return Array.from(new Set(methods))
  }, [userDonations])

  const showMethodFilter = typeFilter !== 'barang'

  const handleTypeChange = (v: string) => {
    setTypeFilter(v)
    if (v === 'barang') setMethodFilter('all') // reset, tidak relevan lagi
    setPage(1)
  }

  const filtered = userDonations.filter(d => {
    const matchType = typeFilter === 'all' || d.type === typeFilter
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    const matchMethod = methodFilter === 'all' || (d.type === 'uang' && d.paymentMethod === methodFilter)
    const matchDate = dateFilter === '' || d.createdAt?.startsWith(dateFilter)
    return matchType && matchStatus && matchMethod && matchDate
  })

  // ⬅ FIX: begitu highlightDonationId & data donasi tersedia, lompat ke
  // halaman yang berisi donasi itu (filter default masih "all" jadi pasti ketemu)
  useEffect(() => {
    if (!highlightDonationId) return
    const idx = filtered.findIndex(d => d.id === highlightDonationId)
    if (idx === -1) return
    setPage(Math.floor(idx / ITEMS_PER_PAGE) + 1)
    setHighlightedId(highlightDonationId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightDonationId, userDonations])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // ⬅ FIX: setelah halaman yang benar ter-render, scroll ke baris & hapus
  // highlight otomatis setelah beberapa detik
  useEffect(() => {
    if (!highlightedId || view !== 'list') return
    const el = rowRefs.current[highlightedId]
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const timeout = setTimeout(() => setHighlightedId(null), 3000)
    return () => clearTimeout(timeout)
  }, [highlightedId, currentPage, view])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        {view === 'list' ? (
          <>
            <CardTitle>Riwayat Donasi ({filtered.length}/{userDonations.length})</CardTitle>

            <div className="flex items-center gap-2 flex-wrap justify-end ml-auto">
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-36 rounded-lg border-gray-200">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              {showMethodFilter && (
                <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(1) }}>
                  <SelectTrigger className="w-40 rounded-lg border-gray-200">
                    <SelectValue placeholder="Semua Metode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Metode</SelectItem>
                    {methodOptions.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={typeFilter} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-36 rounded-lg border-gray-200">
                  <SelectValue placeholder="Semua Tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tipe</SelectItem>
                  <SelectItem value="uang">Uang</SelectItem>
                  <SelectItem value="barang">Barang</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(1) }}
                className="w-auto rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </>
        ) : (
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <button
              onClick={backToList}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-teal-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Riwayat Donasi
            </button>
            <span className="text-muted-foreground">/</span>
            <span>Detail Laporan</span>
          </CardTitle>
        )}
      </CardHeader>

      <CardContent>
        {view === 'detail' && activeCampaignId ? (
          <FundUsageReport campaignId={activeCampaignId} autoPrint={autoPrint} />
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {userDonations.length === 0 ? 'Belum ada riwayat donasi' : 'Tidak ada donasi yang cocok dengan filter'}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="hidden md:table-cell">Metode</TableHead>
                    <TableHead>Nominal / Jumlah</TableHead>
                    <TableHead className="hidden md:table-cell">Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map(d => {
                    const campaignId = d.campaignId

                    return (
                      <TableRow key={d.id}
                        ref={(el) => { rowRefs.current[d.id] = el }}
                        className={d.id === highlightedId ? 'bg-teal-50 ring-2 ring-inset ring-teal-300 transition-colors' : ''}>
                        <TableCell className="font-medium max-w-45 truncate">
                          {d.campaign?.title}
                        </TableCell>

                        <TableCell>
                          <Badge variant={d.type === 'barang' ? 'secondary' : 'default'}>
                            {d.type === 'barang' ? 'Barang' : 'Uang'}
                          </Badge>
                        </TableCell>

                        <TableCell className="hidden md:table-cell">
                          {d.type === 'barang' ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <Badge variant="outline">{d.paymentMethod}</Badge>
                          )}
                        </TableCell>

                        <TableCell className="font-semibold">
                          {d.type === 'barang' ? (
                            <span className="text-orange-600">{d.itemQuantity ?? d.amount} pcs</span>
                          ) : (
                            <span className="text-teal-600">{formatRupiah(d.amount)}</span>
                          )}
                        </TableCell>

                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {formatDate(d.createdAt)}
                        </TableCell>

                        <TableCell>
                          <Badge className={getStatusColor(d.status)}>{d.status}</Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          {d.status === 'approved' && campaignId ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-teal-600 hover:text-teal-700"
                                onClick={() => openReport(campaignId, false)}
                                title="Lihat Laporan"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-gray-700"
                                onClick={() => openReport(campaignId, true)}
                                title="Cetak Laporan"
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-4">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg"
                  onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button key={p} variant={p === currentPage ? 'default' : 'outline'} size="sm"
                    className={`h-8 w-8 p-0 rounded-lg ${p === currentPage ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}`}
                    onClick={() => setPage(p)}>
                    {p}
                  </Button>
                ))}
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}