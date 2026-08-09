'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Megaphone, Info, RefreshCw, AlertCircle,
  ChevronRight, ChevronLeft, CheckCheck, XCircle, Clock,
} from 'lucide-react'
import { formatRupiah, formatDate } from '../types'
import { AjuanFormPage } from './ajuan-form'
import { DetailAjuanPage } from './ajuan-detail'

// ============================================================
// TYPES
// ============================================================
export interface ProposalAPI {
  id: string
  title: string
  description: string
  category: string
  targetAmount: number
  status: 'pending' | 'approved' | 'rejected'
  rejectionReason: string | null
  resubmittedFrom: string | null
  votesCount: number
  startDate: string
  endDate: string
  campaignLocation: string
  officialDocUrl: string
  photoUrl: string | null
  photoUrls?: string[] | null
  proposerName?: string
  proposerEmail?: string
  proposerPhone?: string
  proposerAddress?: string
  createdAt: string
  updatedAt: string
  organizationName?: string | null
  ktmUrl?: string | null
  bankName?: string | null
  bankAccountNumber?: string | null
  bankAccountHolder?: string | null
}

export interface RiwayatAjuan {
  id: string
  judul: string
  kategori: string
  targetDana: number
  tanggalAjuan: string
  status: 'menunggu' | 'disetujui' | 'ditolak'
  catatan?: string
}

export function mapProposalToRiwayat(p: ProposalAPI): RiwayatAjuan {
  return {
    id: p.id,
    judul: p.title,
    kategori: p.category,
    targetDana: p.targetAmount,
    tanggalAjuan: p.createdAt,
    status:
      p.status === 'approved' ? 'disetujui'
        : p.status === 'rejected' ? 'ditolak'
          : 'menunggu',
    catatan: p.rejectionReason ?? undefined,
  }
}

// ============================================================
// HOOK 
// ============================================================
export function useProposals(session?: any) {
  const [proposals, setProposals] = useState<ProposalAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Menyiapkan headers, tambahkan token jika backend menggunakan Bearer auth
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`
      }

      const response = await fetch('/api/proposals/my', {
        method: 'GET',
        headers: headers,
      })

      if (!response.ok) {
        throw new Error(`Gagal memuat data (Error ${response.status}: ${response.statusText})`)
      }

      const data = await response.json()

      // Fleksibilitas membaca response json: 
      // Mengantisipasi jika backend mengembalikan { proposals: [...] } ATAU langsung array [...]
      const proposalsData = data.proposals || data;

      if (Array.isArray(proposalsData)) {
        setProposals(proposalsData)
      } else {
        setProposals([])
      }
    } catch (err) {
      console.error('Fetch Proposals Error:', err)
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data')
    } finally {
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern, aman
    fetchProposals()
  }, [fetchProposals])

  return { proposals, loading, error, refetch: fetchProposals }
}

// ============================================================
// SUB-COMPONENTS
// ============================================================
export function StatusBadge({ status }: { status: RiwayatAjuan['status'] }) {
  if (status === 'disetujui')
    return (
      <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1">
        <CheckCheck className="h-3 w-3" /> Disetujui
      </Badge>
    )
  if (status === 'ditolak')
    return (
      <Badge className="bg-red-100 text-red-700 flex items-center gap-1">
        <XCircle className="h-3 w-3" /> Ditolak
      </Badge>
    )
  return (
    <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1">
      <Clock className="h-3 w-3" /> Menunggu Review
    </Badge>
  )
}

function CardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="animate-pulse space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-200 rounded w-2/3" />
            <div className="h-5 bg-gray-100 rounded-full w-20" />
          </div>
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// PAGINATION
// ============================================================
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  // Bikin daftar nomor halaman yang ditampilkan (maks 5 nomor, sisanya "...")
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
      return pages
    }

    pages.push(1)
    if (currentPage > 3) pages.push('ellipsis')

    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)

    if (currentPage < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)

    return pages
  }

  return (
    <div className="flex items-center justify-center gap-1.5 pt-2">
      <Button
        variant="outline" size="icon" className="h-8 w-8"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {getPageNumbers().map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`ellipsis-${i}`} className="px-1.5 text-sm text-muted-foreground">…</span>
        ) : (
          <Button
            key={p}
            variant={p === currentPage ? 'default' : 'outline'}
            size="icon"
            className={`h-8 w-8 text-sm ${p === currentPage ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        )
      )}

      <Button
        variant="outline" size="icon" className="h-8 w-8"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

// ============================================================
// MAIN: TabAjuan
// ============================================================
interface TabAjuanProps {
  session: any
  initialProposalId?: string   
  proposals?: ProposalAPI[]
  loading?: boolean
  error?: string | null
  refetch?: () => void
}

type View = 'list' | 'detail' | 'form'
type StatusFilter = 'semua' | RiwayatAjuan['status']

const ITEMS_PER_PAGE = 5

export function TabAjuan({
  session,
  initialProposalId,
  proposals: proposalsProp,
  loading: loadingProp,
  error: errorProp,
  refetch: refetchProp,
}: TabAjuanProps) {
  const internal = useProposals(session)

  const usingExternalData = proposalsProp !== undefined
  const proposals = usingExternalData ? proposalsProp : internal.proposals
  const loading = usingExternalData ? (loadingProp ?? false) : internal.loading
  const error = usingExternalData ? (errorProp ?? null) : internal.error
  const refetch = usingExternalData ? (refetchProp ?? (() => {})) : internal.refetch

  // ⬅ FIX: guard supaya auto-buka detail cuma jalan sekali per proposalId,
  // ga maksa balik ke detail terus kalau user udah klik "back" ke list
  const appliedInitialIdRef = React.useRef<string | null>(null)

  // Sembunyikan proposal lama yang sudah digantikan oleh hasil resubmit
  // (data legacy dari sebelum resubmit pakai update-in-place; proposal baru
  // menyimpan resubmittedFrom = id proposal lama, jadi id itu kita filter keluar)
  const supersededIds = new Set(
    proposals.map(p => p.resubmittedFrom).filter((id): id is string => !!id)
  )
  const visibleProposals = proposals.filter(p => !supersededIds.has(p.id))
  const riwayat = visibleProposals.map(mapProposalToRiwayat)

  const [view, setView] = useState<View>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [resubmitFromId, setResubmitFromId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('semua')
  const [currentPage, setCurrentPage] = useState(1)

  const selectedProposal = visibleProposals.find(p => p.id === selectedId) ?? null

  // ⬅ FIX: kalau datang dari klik notifikasi (initialProposalId), otomatis
  // buka detail proposal itu begitu data selesai dimuat
  useEffect(() => {
    if (
      initialProposalId &&
      appliedInitialIdRef.current !== initialProposalId &&
      !loading &&
      visibleProposals.some(p => p.id === initialProposalId)
    ) {
      setSelectedId(initialProposalId)
      setView('detail')
      appliedInitialIdRef.current = initialProposalId
    }
  }, [initialProposalId, loading, visibleProposals])

  const goToForm = (resubmitId?: string) => {
    setResubmitFromId(resubmitId ?? null)
    setView('form')
  }

  const goToList = () => {
    setSelectedId(null)
    setResubmitFromId(null)
    setView('list')
    refetch()
  }

  const changeFilter = (value: StatusFilter) => {
    setFilterStatus(value)
    setCurrentPage(1) // reset ke halaman 1 tiap ganti filter
  }

  // ── Form view ──
  if (view === 'form') {
    const resubmitProposal = resubmitFromId
      ? proposals.find(p => p.id === resubmitFromId) ?? null
      : null

    return (
      <AjuanFormPage
        session={session}
        resubmitFromId={resubmitFromId}
        resubmitProposal={resubmitProposal}
        onBack={goToList}
        onSuccess={goToList}
      />
    )
  }

  // ── Detail view ──
  if (view === 'detail' && selectedProposal) {
    return (
      <DetailAjuanPage
        proposal={selectedProposal}
        onBack={() => { setSelectedId(null); setView('list') }}
        onResubmit={(id) => goToForm(id)}
      />
    )
  }

  // ── Filter helper ──
  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'semua', label: 'Semua' },
    { value: 'menunggu', label: 'Menunggu' },
    { value: 'disetujui', label: 'Disetujui' },
    { value: 'ditolak', label: 'Ditolak' },
  ]

  const countByStatus = (status: StatusFilter) =>
    status === 'semua' ? riwayat.length : riwayat.filter(r => r.status === status).length

  const filteredRiwayat =
    filterStatus === 'semua' ? riwayat : riwayat.filter(r => r.status === filterStatus)

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filteredRiwayat.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedRiwayat = filteredRiwayat.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  )

  // ── List view ──
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Ajuan Campaign Saya</h2>
          <p className="text-sm text-muted-foreground">Pantau status ajuan campaign yang telah kamu kirim</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost" size="icon"
            className="text-muted-foreground"
            onClick={refetch}
            disabled={loading}
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white"
            onClick={() => goToForm()}
          >
            <Megaphone className="h-4 w-4 mr-1.5" /> Ajukan Baru
          </Button>
        </div>
      </div>

      {/* Info cara kerja — dipindah ke atas */}
      <Card className="bg-gray-50 border-dashed">
        <CardContent className="p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-teal-600" /> Cara Kerja Pengajuan
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { step: '1', title: 'Isi Formulir', desc: 'Lengkapi data pengaju, info campaign, dan upload surat pernyataan resmi' },
              { step: '2', title: 'Review Admin', desc: 'Admin meninjau kelayakan ajuan dalam 1–3 hari kerja' },
              { step: '3', title: 'Notifikasi', desc: 'Hasil review dikirim ke email pengaju' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {step}
                </div>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
            <Button size="sm" variant="outline" onClick={refetch} className="shrink-0">
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty (belum ada ajuan sama sekali) */}
      {!loading && !error && riwayat.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center space-y-3">
            <Megaphone className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="font-medium">Belum ada ajuan</p>
            <p className="text-sm text-muted-foreground">
              Klik tombol "Ajukan Baru" untuk mengajukan campaign donasi
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filter status */}
      {!loading && !error && riwayat.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {filterOptions.map(opt => (
            <Button
              key={opt.value}
              size="sm"
              variant={filterStatus === opt.value ? 'default' : 'outline'}
              className={filterStatus === opt.value ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}
              onClick={() => changeFilter(opt.value)}
            >
              {opt.label}
              <span className="ml-1.5 text-xs opacity-75">({countByStatus(opt.value)})</span>
            </Button>
          ))}
        </div>
      )}

      {/* List (sudah difilter & dipaginasi) */}
      {!loading && !error && riwayat.length > 0 && paginatedRiwayat.length > 0 && (
        <>
          <div className="space-y-3">
            {paginatedRiwayat.map(r => (
              <Card
                key={r.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => { setSelectedId(r.id); setView('detail') }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{r.judul}</p>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>{r.kategori}</span>
                        <span>•</span>
                        <span>{formatRupiah(r.targetDana)}</span>
                        <span>•</span>
                        <span>Diajukan {formatDate(r.tanggalAjuan)}</span>
                      </div>
                      {r.status === 'ditolak' && (
                        <div className="mt-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                          <p className="text-xs text-red-600">
                            {r.catatan || 'Admin belum mencantumkan catatan alasan penolakan.'}
                          </p>
                        </div>
                      )}
                      {r.status === 'disetujui' && (
                        <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                          <p className="text-xs text-emerald-600">
                            ✅ Campaign Anda telah disetujui dan akan segera dipublikasikan.
                          </p>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Info jumlah + pagination */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <p className="text-xs text-muted-foreground">
              Menampilkan {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filteredRiwayat.length)} dari {filteredRiwayat.length} ajuan
            </p>
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}

      {/* Hasil filter kosong (ada data, tapi tidak ada yang cocok dengan filter) */}
      {!loading && !error && riwayat.length > 0 && filteredRiwayat.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Tidak ada ajuan dengan status "{filterOptions.find(f => f.value === filterStatus)?.label}"
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  )
}