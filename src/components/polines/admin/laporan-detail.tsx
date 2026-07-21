'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Printer, Loader2, ChevronLeft, ChevronRight, Pencil, Trash2, PackageCheck } from 'lucide-react'
import type { FundUsage, Donation } from '@/components/polines/types'
import { formatRupiah, formatDate, getCategoryColor } from '@/components/polines/types'
import type { LaporanCampaign } from './tab-laporan'
import { FundUsageModal, type FundUsageSubmitPayload } from './fund-usage-modal'
import { DeleteFundUsageDialog } from './delete-modal'
import { downloadLaporanPdf } from './download-laporan-pdf'

// Field 'documentUrl' adalah nama kolom bukti di Prisma schema (model FundUsage).
type FundUsageWithProof = FundUsage & { documentUrl?: string | null }

interface LaporanDetailViewProps {
  campaign: LaporanCampaign
  fundUsages: FundUsageWithProof[]
  /** Semua donasi (barang & uang) untuk campaign ini - dipakai buat nampilin
   *  ringkasan "Barang Diterima dari Donatur" (cuma yang type=barang & approved). */
  donations: Donation[]
  onAddFundUsage: (campaignId: string, payload: FundUsageSubmitPayload) => void | Promise<void>
  onEditFundUsage: (fundUsageId: string, payload: FundUsageSubmitPayload) => void | Promise<void>
  onDeleteFundUsage: (fundUsageId: string) => void | Promise<void>
}

const ROWS_PER_PAGE = 7

const EMPTY_FORM: FundUsageSubmitPayload = {
  type: 'uang', date: '', description: '', amount: '', itemName: '', itemQuantity: '', proofFile: null,
}

export function LaporanDetailView({
  campaign, fundUsages, donations, onAddFundUsage, onEditFundUsage, onDeleteFundUsage,
}: LaporanDetailViewProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FundUsageSubmitPayload>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  // ── Edit state ──
  const [editTarget, setEditTarget] = useState<FundUsageWithProof | null>(null)
  const [editForm, setEditForm] = useState<FundUsageSubmitPayload>(EMPTY_FORM)
  const [editSubmitting, setEditSubmitting] = useState(false)

  // ── Delete state ──
  const [deleteTarget, setDeleteTarget] = useState<FundUsageWithProof | null>(null)
  const [deleting, setDeleting] = useState(false)

  // totalUsed HANYA menjumlahkan entri bertipe "uang" - entri "barang"
  // tidak punya nilai Rupiah yang applicable.
  const totalUsed = (fundUsages || []).reduce(
    (sum, f) => (f.type === 'uang' ? sum + (f.amount ?? 0) : sum),
    0
  )

  // Sisa dana berjalan: cuma entri "uang" yang mengurangi saldo Rupiah.
  // Entri "barang" tidak mempengaruhi saldo - baris itu cuma "numpang" di
  // timeline yang sama, saldo dibawa apa adanya dari baris sebelumnya.
  const rowsWithBalance = (fundUsages || []).reduce<Array<FundUsageWithProof & { sisaDana: number }>>((acc, f) => {
    const prevBalance = acc.length > 0 ? acc[acc.length - 1].sisaDana : campaign.collectedAmount
    const sisaDana = f.type === 'uang' ? prevBalance - (f.amount ?? 0) : prevBalance
    return [...acc, { ...f, sisaDana }]
  }, [])

  const totalPages = Math.max(1, Math.ceil(rowsWithBalance.length / ROWS_PER_PAGE))
  const pagedRows = rowsWithBalance.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)

  // Barang yang DITERIMA dari donatur (bukan yang disalurkan). Ini cuma log
  // sederhana - satu baris per donasi barang approved, tanpa hitung stok/sisa,
  // karena satu donasi bisa berisi beberapa jenis barang sekaligus (itemName
  // sudah berupa deskripsi gabungan, mis. "buku (1), baju (1)").
  const barangDiterima = (donations || []).filter(d => d.type === 'barang' && d.status === 'approved')

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onAddFundUsage(campaign.id, form)
      setForm(EMPTY_FORM)
      setModalOpen(false)
      setPage(1)
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (f: FundUsageWithProof) => {
    setEditTarget(f)
    setEditForm({
      type: (f.type as 'uang' | 'barang') ?? 'uang',
      // f.date dari API biasanya ISO string lengkap; input type="date" butuh format YYYY-MM-DD
      date: f.date ? new Date(f.date).toISOString().slice(0, 10) : '',
      description: f.description,
      amount: f.amount != null ? String(f.amount) : '',
      itemName: f.itemName ?? '',
      itemQuantity: f.itemQuantity != null ? String(f.itemQuantity) : '',
      proofFile: null,
    })
  }

  const handleEditSubmit = async () => {
    if (!editTarget) return
    setEditSubmitting(true)
    try {
      await onEditFundUsage(editTarget.id, editForm)
      setEditTarget(null)
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await onDeleteFundUsage(deleteTarget.id)
      setDeleteTarget(null)
      setPage(1)
    } finally {
      setDeleting(false)
    }
  }

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true)
    try {
      await downloadLaporanPdf({
        campaignTitle: campaign.title,
        collectedAmount: campaign.collectedAmount,
        fundUsages,
      })
    } finally {
      setGeneratingPdf(false)
    }
  }

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

      {/* Barang Diterima dari Donatur */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader className="flex flex-row items-center gap-2">
          <PackageCheck className="h-4 w-4 text-teal-600" />
          <CardTitle className="text-base font-bold">Barang Diterima dari Donatur</CardTitle>
        </CardHeader>
        <CardContent>
          {barangDiterima.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">
              Belum ada donasi barang yang diterima untuk campaign ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Donatur</TableHead>
                    <TableHead>Jenis Barang</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barangDiterima.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="text-sm text-gray-700">{formatDate(d.createdAt)}</TableCell>
                      <TableCell className="text-sm">{d.donorName}</TableCell>
                      <TableCell className="text-sm">{d.itemName || '—'}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-orange-600">
                        {d.itemQuantity ?? d.amount} pcs
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
        {/* ⬅ FIX: flex-col di HP (judul & tombol ditumpuk), flex-row mulai sm:
      supaya tombol "Cetak Laporan" nggak lagi nembus keluar card */}
        <CardHeader className="flex flex-col gap-3">
          <CardTitle className="text-base font-bold">Riwayat Laporan Penggunaan / Penyaluran</CardTitle>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto sm:self-end">
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm w-full sm:w-auto"
              onClick={() => setModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" /> Tambah
            </Button>
            <Button
              variant="outline"
              className="rounded-lg text-sm w-full sm:w-auto"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
            >
              {generatingPdf ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Printer className="h-4 w-4 mr-1" />
              )}
              {generatingPdf ? 'Menyiapkan PDF...' : 'Cetak Laporan'}
            </Button>
          </div>
        </CardHeader></Card>

      <FundUsageModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        campaignTitle={campaign.title}
        form={form}
        setForm={setForm}
        submitting={submitting}
        onSubmit={handleSubmit}
      />

      <FundUsageModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        campaignTitle={campaign.title}
        form={editForm}
        setForm={setEditForm}
        submitting={editSubmitting}
        onSubmit={handleEditSubmit}
        mode="edit"
        existingDocumentUrl={editTarget?.documentUrl}
      />

      <DeleteFundUsageDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        description={deleteTarget?.description ?? ''}
        deleting={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}