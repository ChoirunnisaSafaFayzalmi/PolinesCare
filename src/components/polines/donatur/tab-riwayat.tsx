'use client'

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Donation } from '@/components/polines/types'
import { formatRupiah, formatDate, getStatusColor } from '@/components/polines/types'

const ITEMS_PER_PAGE = 10

interface TabRiwayatProps {
  userDonations: Donation[]
}

export function TabRiwayat({ userDonations }: TabRiwayatProps) {
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [page, setPage] = useState(1)

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
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
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium max-w-[180px] truncate">
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
                    </TableRow>
                  ))}
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