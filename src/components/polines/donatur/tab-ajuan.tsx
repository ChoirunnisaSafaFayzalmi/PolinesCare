'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Megaphone, Info, RefreshCw, AlertCircle,
  ChevronRight, CheckCheck, XCircle, Clock,
} from 'lucide-react'
import { formatRupiah, formatDate } from '../types'
import { AjuanFormPage } from './ajuan-form'

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
  createdAt: string
  updatedAt: string
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
// HOOK (Updated with Real API Fetch)
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

// Detail view — ditampilkan inline di tab
function DetailAjuan({
  ajuan,
  onBack,
  onResubmit,
}: {
  ajuan: RiwayatAjuan
  onBack: () => void
  onResubmit: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      <Button
        variant="ghost" size="sm"
        className="p-0 h-auto text-muted-foreground hover:text-foreground"
        onClick={onBack}
      >
        ← Kembali ke Riwayat
      </Button>

      {ajuan.status === 'disetujui' && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
          <CheckCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">
            Campaign Anda telah disetujui dan akan segera dipublikasikan.
          </p>
        </div>
      )}
      {ajuan.status === 'ditolak' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700 font-medium">Ajuan ditolak</p>
          </div>
          {ajuan.catatan && (
            <p className="text-xs text-red-600 pl-6">Catatan admin: {ajuan.catatan}</p>
          )}
        </div>
      )}
      {ajuan.status === 'menunggu' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">Ajuan sedang dalam proses review admin (1–3 hari kerja).</p>
        </div>
      )}

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Informasi Ajuan</p>
            <StatusBadge status={ajuan.status} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Judul Campaign</p>
              <p className="font-medium">{ajuan.judul}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Kategori</p>
              <p className="font-medium">{ajuan.kategori}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Target Dana</p>
              <p className="font-medium text-teal-600">{formatRupiah(ajuan.targetDana)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Tanggal Diajukan</p>
              <p className="font-medium">{formatDate(ajuan.tanggalAjuan)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {ajuan.status === 'ditolak' && (
        <Card className="border-dashed border-red-200 bg-red-50/30">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-red-700">Ingin mengajukan ulang?</p>
              <p className="text-xs text-red-600 mt-0.5">Perbaiki sesuai catatan admin lalu kirim kembali</p>
            </div>
            <Button
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white shrink-0"
              onClick={() => onResubmit(ajuan.id)}
            >
              <Megaphone className="h-4 w-4 mr-1" /> Ajukan Ulang
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ============================================================
// MAIN: TabAjuan
// ============================================================
interface TabAjuanProps {
  session: any
}

type View = 'list' | 'detail' | 'form'

export function TabAjuan({ session }: TabAjuanProps) {
  // Meneruskan session ke hook untuk antisipasi autentikasi token API
  const { proposals, loading, error, refetch } = useProposals(session)
  const riwayat = proposals.map(mapProposalToRiwayat)

  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<RiwayatAjuan | null>(null)
  const [resubmitFromId, setResubmitFromId] = useState<string | null>(null)

  const goToForm = (resubmitId?: string) => {
    setResubmitFromId(resubmitId ?? null)
    setView('form')
  }

  const goToList = () => {
    setSelected(null)
    setResubmitFromId(null)
    setView('list')
    refetch()
  }

  // ── Form view ──
  if (view === 'form') {
    return (
      <AjuanFormPage
        session={session}
        resubmitFromId={resubmitFromId}
        onBack={goToList}
        onSuccess={goToList}
      />
    )
  }

  // ── Detail view ──
  if (view === 'detail' && selected) {
    return (
      <DetailAjuan
        ajuan={selected}
        onBack={() => { setSelected(null); setView('list') }}
        onResubmit={(id) => goToForm(id)}
      />
    )
  }

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

      {/* Empty */}
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

      {/* List */}
      {!loading && !error && riwayat.length > 0 && (
        <div className="space-y-3">
          {riwayat.map(r => (
            <Card
              key={r.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setSelected(r); setView('detail') }}
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
                    {r.status === 'ditolak' && r.catatan && (
                      <div className="mt-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-xs text-red-600">
                          <span className="font-semibold">Catatan admin:</span> {r.catatan}
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
      )}

      {/* Info cara kerja */}
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

    </div>
  )
}