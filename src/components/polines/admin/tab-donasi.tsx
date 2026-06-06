'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Campaign, Donation } from '@/components/polines/types'
import { formatRupiah, formatDate, getStatusColor, formatUniqueCode } from '@/components/polines/types'

const ITEMS_PER_PAGE = 10

interface DonasiTabProps {
  donations: Donation[]
  allCampaigns: Campaign[]
  onSelectDonation: (d: Donation) => void
}

export function DonasiTab({ donations, allCampaigns, onSelectDonation }: DonasiTabProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [page, setPage] = useState(1)

  const filtered = (donations || []).filter(d => {
    const matchSearch = search === '' ||
      d.donorName.toLowerCase().includes(search.toLowerCase()) ||
      d.campaign?.title?.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || d.type === typeFilter
    const matchDate = dateFilter === '' || d.createdAt?.startsWith(dateFilter)
    return matchSearch && matchType && matchDate
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

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
              placeholder="Cari donatur atau campaign..."
              className="pl-9 rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); setPage(1) }}
            className="w-auto rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
            <SelectTrigger className="w-40 rounded-lg border-gray-200"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="uang">Uang</SelectItem>
              <SelectItem value="barang">Barang</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Tidak ada donasi ditemukan</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-teal-600 hover:bg-teal-600">
                  <TableHead className="text-white font-semibold">Donatur</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Tanggal</TableHead>
                  <TableHead className="text-white font-semibold">Campaign</TableHead>
                  <TableHead className="text-white font-semibold hidden lg:table-cell">Kode Unik</TableHead>
                  <TableHead className="text-white font-semibold hidden lg:table-cell">Akhir 3 Digit</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Tipe</TableHead>
                  <TableHead className="text-white font-semibold hidden md:table-cell">Nominal</TableHead>
                  <TableHead className="text-white font-semibold">Status</TableHead>
                  <TableHead className="text-white font-semibold text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map(d => {
                  const camp = allCampaigns.find(c => c.id === d.campaignId)
                  const last3 = String(d.amount % 1000).padStart(3, '0')
                  const match = camp && (d.amount % 1000) === camp.uniqueCode
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.donorName}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-500">{formatDate(d.createdAt)}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-sm">{d.campaign?.title}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {camp ? (
                          <Badge className="bg-violet-100 text-violet-700 border-violet-200">
                            {formatUniqueCode(camp.uniqueCode)}
                          </Badge>
                        ) : <span className="text-xs text-gray-400">-</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                          match ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {last3}
                          {match && <Check className="h-3 w-3 ml-1" />}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          d.type === 'uang' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {d.type}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm font-medium text-gray-700">
                        {formatRupiah(d.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(d.status)}>{d.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => onSelectDonation(d)}
                          className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          Detail
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })}
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