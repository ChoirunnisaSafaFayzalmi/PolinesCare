'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Vote, Plus, Edit, Trash2, AlertTriangle, ThumbsUp, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Campaign, Proposal } from '@/components/polines/types'
import { formatRupiah, getCategoryColor, getStatusColor, formatUniqueCode, CATEGORIES } from '@/components/polines/types'

const campaignSubTabs = [
  { id: 'campaigns', label: 'Campaign' },
  { id: 'ajuan', label: 'Ajuan' },
]

const ITEMS_PER_PAGE = 10

interface CampaignTabProps {
  allCampaigns: Campaign[]
  filteredAdminCampaigns: Campaign[]
  proposals: Proposal[]
  adminCampaignFilter: string
  setAdminCampaignFilter: (v: string) => void
  adminCampaignStatus: string
  setAdminCampaignStatus: (v: string) => void
  adminCampaignSubTab: string
  setAdminCampaignSubTab: (v: string) => void
  onNavigateCampaignSubTab?: (subTab: string) => void
  onNewCampaign: () => void
  onEditCampaign: (c: Campaign) => void
  onCompleteFromProposal: (c: Campaign) => void
  onDeleteCampaign: (id: string) => void
  onProposalDetail: (p: Proposal) => void
}

export function CampaignTab({
  allCampaigns, filteredAdminCampaigns, proposals,
  adminCampaignFilter, setAdminCampaignFilter,
  adminCampaignStatus, setAdminCampaignStatus,
  adminCampaignSubTab, setAdminCampaignSubTab,
  onNavigateCampaignSubTab,
  onNewCampaign, onEditCampaign, onCompleteFromProposal, onDeleteCampaign, onProposalDetail,
}: CampaignTabProps) {
  const [search, setSearch] = useState('')
  const [ajuanStatus, setAjuanStatus] = useState('all')
  const [ajuanCategory, setAjuanCategory] = useState('all')

  const filteredCampaigns = search === ''
    ? filteredAdminCampaigns
    : filteredAdminCampaigns.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
    )

  const filteredProposals = proposals.filter(p => {
    const matchSearch = search === '' ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.proposer?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    const matchStatus = ajuanStatus === 'all' || p.status === ajuanStatus
    const matchCategory = ajuanCategory === 'all' || p.category === ajuanCategory
    return matchSearch && matchStatus && matchCategory
  })

  return (
    <div className="space-y-4">

      {/* Row 1: Sub-tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {campaignSubTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setAdminCampaignSubTab(tab.id)
              setSearch('')
              setAjuanStatus('all')
              setAjuanCategory('all')
              onNavigateCampaignSubTab?.(tab.id)
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all cursor-pointer ${adminCampaignSubTab === tab.id
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {tab.id === 'ajuan' && <Vote className="h-4 w-4 inline mr-1.5 -mt-0.5" />}
            {tab.label}
            {tab.id === 'ajuan' && (
              <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1.5">
                {filteredProposals.length}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Row 2: Search + Filters (+ Buat Campaign button jika tab campaigns) */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={adminCampaignSubTab === 'campaigns' ? 'Cari campaign...' : 'Cari proposal atau pengaju...'}
            className="pl-9 rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Campaign filters */}
        {adminCampaignSubTab === 'campaigns' && (
          <>
            <Select value={adminCampaignStatus} onValueChange={setAdminCampaignStatus}>
              <SelectTrigger className="w-36 rounded-lg border-gray-200">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="awaiting_completion">Menunggu Kelengkapan</SelectItem>   {/* ⬅ tambah */}
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                {/* <SelectItem value="closed">Ditutup</SelectItem> */}
              </SelectContent>
            </Select>
            <Select value={adminCampaignFilter} onValueChange={setAdminCampaignFilter}>
              <SelectTrigger className="w-36 rounded-lg border-gray-200">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg ml-auto" onClick={onNewCampaign}>
              <Plus className="h-4 w-4 mr-1" /> Buat Campaign
            </Button>
          </>
        )}

        {/* Ajuan filters */}
        {adminCampaignSubTab === 'ajuan' && (
          <>
            <Select value={ajuanStatus} onValueChange={setAjuanStatus}>
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
            <Select value={ajuanCategory} onValueChange={setAjuanCategory}>
              <SelectTrigger className="w-36 rounded-lg border-gray-200">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Row 3: Table content */}
      {adminCampaignSubTab === 'campaigns' ? (
        <CampaignList
          allCampaigns={allCampaigns}
          filteredAdminCampaigns={filteredCampaigns}
          onEditCampaign={onEditCampaign}
          onCompleteFromProposal={onCompleteFromProposal}
          onDeleteCampaign={onDeleteCampaign}
        />
      ) : (
        <AjuanList proposals={filteredProposals} onProposalDetail={onProposalDetail} />
      )}
    </div>
  )
}

// ── Pagination (reusable, generic) ──────────────────────────────
function PaginationBar({
  page, totalPages, onPageChange,
}: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg"
        onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
        <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm"
          className={`h-8 w-8 p-0 rounded-lg ${p === page ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}`}
          onClick={() => onPageChange(p)}>
          {p}
        </Button>
      ))}
      <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ── Delete Campaign Dialog ───────────────────────────────────────
function DeleteCampaignDialog({
  campaign, onClose, onConfirm,
}: {
  campaign: Campaign | null
  onClose: () => void
  onConfirm: (id: string) => void
}) {
  return (
    <AlertDialog open={!!campaign} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus campaign ini?</AlertDialogTitle>
          <AlertDialogDescription>
            Campaign &quot;{campaign?.title}&quot; akan dihapus permanen beserta seluruh data donasi yang terkait. Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => { if (campaign) onConfirm(campaign.id) }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ── Campaign List ──────────────────────────────────────────────
function CampaignList({
  allCampaigns, filteredAdminCampaigns, onEditCampaign, onCompleteFromProposal, onDeleteCampaign,
}: {
  allCampaigns: Campaign[]
  filteredAdminCampaigns: Campaign[]
  onEditCampaign: (c: Campaign) => void
  onCompleteFromProposal: (c: Campaign) => void
  onDeleteCampaign: (id: string) => void
}) {
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null)
  const totalPages = Math.max(1, Math.ceil(filteredAdminCampaigns.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filteredAdminCampaigns.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleConfirmDelete = (id: string) => {
    onDeleteCampaign(id)
    setDeleteTarget(null)
  }

  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-gray-800">
          Kelola Campaign ({filteredAdminCampaigns.length}/{allCampaigns.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredAdminCampaigns.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Tidak ada campaign ditemukan</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-teal-600 hover:bg-teal-600">
                    <TableHead className="text-white font-semibold">Judul</TableHead>
                    <TableHead className="text-white font-semibold hidden md:table-cell">Kode</TableHead>
                    <TableHead className="text-white font-semibold hidden md:table-cell">Kategori</TableHead>
                    <TableHead className="text-white font-semibold">Status</TableHead>
                    <TableHead className="text-white font-semibold hidden md:table-cell">Terkumpul</TableHead>
                    <TableHead className="text-white font-semibold hidden md:table-cell">Donatur</TableHead>
                    <TableHead className="text-white font-semibold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium max-w-[200px]">
                        <div className="flex items-center gap-2">
                          {c.isUrgent && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                          <span className="truncate">{c.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge className="bg-violet-100 text-violet-700 border-violet-200">
                          {formatUniqueCode(c.uniqueCode)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={getCategoryColor(c.category)}>{c.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {c.status === 'awaiting_completion' ? (
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                            Menunggu Kelengkapan
                          </Badge>
                        ) : (
                          <Badge className={getStatusColor(c.status)}>{c.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {formatRupiah(c.collectedAmount)} / {formatRupiah(c.targetAmount)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{c._count?.donations ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {c.status === 'awaiting_completion' ? (
                            <Button
                              size="sm"
                              className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg h-8"
                              onClick={() => onCompleteFromProposal(c)}
                            >
                              <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Lengkapi
                            </Button>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditCampaign(c)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => setDeleteTarget(c)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationBar page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </CardContent>

      <DeleteCampaignDialog
        campaign={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </Card>
  )
}

// ── Ajuan List ─────────────────────────────────────────────────
function AjuanList({ proposals, onProposalDetail }: { proposals: Proposal[]; onProposalDetail: (p: Proposal) => void }) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(proposals.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginated = proposals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <Card className="shadow-sm border-gray-100">
      <CardHeader className="pb-3">
        <div>
          <CardTitle className="text-base font-bold text-gray-800">Proposal / Ajuan Crowdsourcing</CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">Kelola proposal yang diajukan oleh warga kampus</p>
        </div>
      </CardHeader>
      <CardContent>
        {proposals.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Tidak ada proposal ditemukan</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-teal-600 hover:bg-teal-600">
                    <TableHead className="text-white font-semibold">Nama Proposal</TableHead>
                    <TableHead className="text-white font-semibold hidden md:table-cell">Diajukan Oleh</TableHead>
                    <TableHead className="text-white font-semibold hidden md:table-cell">Kategori</TableHead>
                    <TableHead className="text-white font-semibold">Status</TableHead>
                    <TableHead className="text-white font-semibold text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-gray-500">
                        {p.proposer?.name ?? 'Anonim'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={getCategoryColor(p.category)}>{p.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(p.status)}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={() => onProposalDetail(p)}
                          className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors cursor-pointer"
                        >
                          Detail
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PaginationBar page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </CardContent>
    </Card>
  )
}