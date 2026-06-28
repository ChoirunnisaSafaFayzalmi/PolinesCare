'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Printer, Loader2, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react'
import type { FundUsage } from '@/components/polines/types'
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
  onAddFundUsage: (campaignId: string, payload: FundUsageSubmitPayload) => void | Promise<void>
  onEditFundUsage: (fundUsageId: string, payload: FundUsageSubmitPayload) => void | Promise<void>
  onDeleteFundUsage: (fundUsageId: string) => void | Promise<void>
}

const ROWS_PER_PAGE = 7

export function LaporanDetailView({
  campaign, fundUsages, onAddFundUsage, onEditFundUsage, onDeleteFundUsage,
}: LaporanDetailViewProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState<FundUsageSubmitPayload>({ date: '', description: '', amount: '', proofFile: null })
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)
  const [generatingPdf, setGeneratingPdf] = useState(false)

  // ── Edit state ──
  const [editTarget, setEditTarget] = useState<FundUsageWithProof | null>(null)
  const [editForm, setEditForm] = useState<FundUsageSubmitPayload>({ date: '', description: '', amount: '', proofFile: null })
  const [editSubmitting, setEditSubmitting] = useState(false)

  // ── Delete state ──
  const [deleteTarget, setDeleteTarget] = useState<FundUsageWithProof | null>(null)
  const [deleting, setDeleting] = useState(false)

  const totalUsed = (fundUsages || []).reduce((sum, f) => sum + f.amount, 0)

  // Sisa dana berjalan: total terkumpul dikurangi akumulasi nominal s.d. baris itu
  const rowsWithBalance = (fundUsages || []).reduce<Array<FundUsageWithProof & { sisaDana: number }>>((acc, f) => {
    const prevBalance = acc.length > 0 ? acc[acc.length - 1].sisaDana : campaign.collectedAmount
    return [...acc, { ...f, sisaDana: prevBalance - f.amount }]
  }, [])

  const totalPages = Math.max(1, Math.ceil(rowsWithBalance.length / ROWS_PER_PAGE))
  const pagedRows = rowsWithBalance.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await onAddFundUsage(campaign.id, form)
      setForm({ date: '', description: '', amount: '', proofFile: null })
      setModalOpen(false)
      setPage(1)
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (f: FundUsageWithProof) => {
    setEditTarget(f)
    setEditForm({
      // f.date dari API biasanya ISO string lengkap; input type="date" butuh format YYYY-MM-DD
      date: f.date ? new Date(f.date).toISOString().slice(0, 10) : '',
      description: f.description,
      amount: String(f.amount),
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
          <CardTitle className="text-base font-bold">Riwayat Laporan</CardTitle>
          <div className="flex items-center gap-2">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Tambah
            </Button>
            <Button
              variant="outline"
              className="rounded-lg text-sm"
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
        </CardHeader>
        <CardContent>
          {fundUsages.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Belum ada laporan penggunaan dana</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-teal-600 hover:bg-teal-600">
                      <TableHead className="text-white font-semibold">Tanggal</TableHead>
                      <TableHead className="text-white font-semibold">Keterangan</TableHead>
                      <TableHead className="text-white font-semibold">Nominal</TableHead>
                      <TableHead className="text-white font-semibold">Sisa Dana</TableHead>
                      <TableHead className="text-white font-semibold">Bukti</TableHead>
                      <TableHead className="text-white font-semibold text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedRows.map(f => (
                      <TableRow key={f.id}>
                        <TableCell className="text-sm text-gray-700">{formatDate(f.date)}</TableCell>
                        <TableCell className="font-medium">{f.description}</TableCell>
                        <TableCell>{formatRupiah(f.amount)}</TableCell>
                        <TableCell>{formatRupiah(f.sisaDana)}</TableCell>
                        <TableCell>
                          {f.documentUrl ? (
                            <a href={f.documentUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">
                              Image
                            </a>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-teal-600 hover:text-teal-700"
                              onClick={() => openEditModal(f)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600"
                              onClick={() => setDeleteTarget(f)}
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-4">
                  <Button
                    variant="outline" size="icon" className="rounded-lg h-8 w-8"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <Button
                      key={n}
                      variant={n === page ? 'default' : 'outline'}
                      size="icon"
                      className={`rounded-lg h-8 w-8 text-sm ${n === page ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}`}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </Button>
                  ))}
                  <Button
                    variant="outline" size="icon" className="rounded-lg h-8 w-8"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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