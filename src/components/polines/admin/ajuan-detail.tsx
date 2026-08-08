'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  ThumbsUp, ThumbsDown,
  User, Mail, Phone, MapPin, Target, Calendar,
  FileCheck, Camera, AlignLeft, Hash,
  Building2, Landmark, CreditCard,
} from 'lucide-react'
import type { Proposal } from '@/components/polines/types'
import {
  formatRupiah, formatDate, getCategoryColor, getStatusColor, calculateProposalScore,
} from '@/components/polines/types'

interface AjuanDetailViewProps {
  proposal: Proposal
  onSaveCriteria: (id: string, criteria: Record<string, number>) => void
  onUpdateStatus: (id: string, status: 'approved' | 'rejected', meta?: { rejectionReason?: string }) => void
}

// Score bar item
function ScoreRow({ label, score, max, hint }: { label: string; score: number; max: number; hint?: string }) {
  const pct = max > 0 ? (score / max) * 100 : 0
  const color = pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-bold text-gray-800">{score}<span className="text-gray-400 font-normal">/{max}</span></span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-8 w-1 rounded-full bg-teal-600" />
      <h3 className="text-base font-bold text-gray-800">{children}</h3>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: {
  icon?: React.ElementType; label: string; value?: string | number | null
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
        {Icon && <Icon className="h-3.5 w-3.5" />}{label}
      </p>
      <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap">
        {value ? String(value) : <span className="text-gray-300 italic">Tidak diisi</span>}
      </p>
    </div>
  )
}

export function AjuanDetailView({ proposal: initialProposal, onSaveCriteria, onUpdateStatus }: AjuanDetailViewProps) {
  const [proposal, setProposal] = useState(initialProposal)
  const [rejectionReason, setRejectionReason] = useState(initialProposal.rejectionReason ?? '')
  const [showRejectInput, setShowRejectInput] = useState(false)

  // Hitung skor otomatis
  const score = calculateProposalScore(proposal)

  const handleApprove = () => {
    onUpdateStatus(proposal.id, 'approved')
    setProposal({ ...proposal, status: 'approved' })
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) { setShowRejectInput(true); return }
    onUpdateStatus(proposal.id, 'rejected', { rejectionReason })
    setProposal({ ...proposal, status: 'rejected', rejectionReason })
    setShowRejectInput(false)
  }

  const durasiHari = proposal.startDate && proposal.endDate
    ? Math.round(
      (new Date(proposal.endDate).getTime() - new Date(proposal.startDate).getTime())
      / (1000 * 60 * 60 * 24)
    )
    : null

  return (
    <div className="space-y-6">

      {/* Section 1: Informasi Pengaju */}
      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-6">
          <SectionTitle>Informasi Pengaju</SectionTitle>
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-800">{proposal.title}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={getCategoryColor(proposal.category)}>{proposal.category}</Badge>
                <span className="text-xs text-gray-400">#{proposal.id?.slice(0, 8)}</span>
              </div>
            </div>
            <Badge className={`${getStatusColor(proposal.status)} text-sm px-3 py-1`}>{proposal.status}</Badge>
          </div>
          <Separator className="mb-4" />
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow icon={User} label="Nama Pengaju"
                value={proposal.proposerName ?? proposal.proposer?.name} />
              <InfoRow icon={Building2} label="Organisasi / Lembaga"
                value={proposal.organizationName} />
              <InfoRow icon={Mail} label="Email Kontak"
                value={proposal.proposerEmail ?? proposal.proposer?.email} />
              <InfoRow icon={Phone} label="No. Telepon"
                value={proposal.proposerPhone ?? proposal.proposer?.phone} />
              <InfoRow icon={MapPin} label="Alamat Pengaju"
                value={proposal.proposerAddress ?? proposal.proposer?.address} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Data Campaign */}
      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-6">
          <SectionTitle>Data Campaign</SectionTitle>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <InfoRow icon={AlignLeft} label="Deskripsi Campaign" value={proposal.description} />
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow icon={Hash} label="Kategori" value={proposal.category} />
                <InfoRow icon={Target} label="Target Dana" value={proposal.targetAmount ? formatRupiah(proposal.targetAmount) : null} />
                <InfoRow icon={Calendar} label="Tanggal Buka"
                  value={proposal.startDate ? formatDate(proposal.startDate) : null} />
                <InfoRow icon={Calendar} label="Tanggal Tutup"
                  value={proposal.endDate ? formatDate(proposal.endDate) : null} />
                {durasiHari !== null && <InfoRow label="Durasi Campaign" value={`${durasiHari} hari`} />}
                <InfoRow icon={MapPin} label="Alamat Lokasi Campaign" value={proposal.campaignLocation} />
              </div>
            </div>

            {/* Foto */}
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                <Camera className="h-3.5 w-3.5" /> Foto Keadaan / Bukti
              </p>
              {(() => {
                const photos = proposal.photoUrls
                  ? (Array.isArray(proposal.photoUrls)
                    ? proposal.photoUrls
                    : JSON.parse(proposal.photoUrls as string))
                  : []
                return photos.length > 0
                  ? <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {photos.map((url: string, i: number) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-gray-200 aspect-square">
                        <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  : <p className="text-sm text-gray-300 italic">Tidak ada foto</p>
              })()}
            </div>

            {/* Surat */}
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                <FileCheck className="h-3.5 w-3.5" /> Surat Pernyataan Resmi
              </p>
              {proposal.officialDocUrl
                ? <a href={proposal.officialDocUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Lihat Surat Pernyataan</p>
                    <p className="text-xs text-emerald-600">Klik untuk membuka dokumen ↗</p>
                  </div>
                </a>
                : <p className="text-sm text-gray-300 italic">Tidak ada surat pernyataan</p>
              }
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Rekening Pencairan Dana */}
      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-6">
          <SectionTitle>Rekening Pencairan Dana</SectionTitle>
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoRow icon={Landmark} label="Nama Bank" value={proposal.bankName} />
              <InfoRow icon={CreditCard} label="Nomor Rekening" value={proposal.bankAccountNumber} />
              <InfoRow icon={User} label="Nama Pemilik Rekening" value={proposal.bankAccountHolder} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Penilaian Otomatis */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-teal-600" />
            <div>
              <CardTitle className="text-base font-bold">Penilaian Kelayakan Proposal</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Skor dihitung otomatis berdasarkan kelengkapan data. Minimum 70/100 + surat resmi wajib ada.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Score breakdown */}
          <div className="space-y-3">
            <ScoreRow label="Kelengkapan Data Pengaju" score={score.dataPengaju} max={15} hint="Nama, email, no. telp, alamat" />
            <ScoreRow label="Kejelasan Judul" score={score.kejelasanJudul} max={10} hint="Judul ≥ 20 karakter = sempurna" />
            <ScoreRow label="Kualitas Deskripsi" score={score.kualitasDeskripsi} max={20} hint="≥ 300 karakter = sempurna" />
            <ScoreRow label="Kewajaran Target & Durasi" score={score.kewajaranTarget} max={20} hint="Durasi 7–90 hari, target ≤ 100jt = sempurna" />
            <ScoreRow label="Kelengkapan Lokasi" score={score.kelengkapanLokasi} max={10} hint="Alamat lokasi campaign" />
            <ScoreRow label="Foto Bukti" score={score.fotoBukti} max={10} hint="Opsional tapi menambah skor" />
            <ScoreRow label="Surat Pernyataan Resmi" score={score.suratResmi} max={15} hint="Wajib ada untuk bisa disetujui" />
          </div>

          {/* Total score */}
          <div className={`p-4 rounded-xl border-2 ${score.isEligible ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">Total Skor</p>
                <p className="text-3xl font-bold mt-1">
                  <span className={score.isEligible ? 'text-emerald-600' : 'text-red-600'}>{score.total}</span>
                  <span className="text-base text-gray-400 font-normal ml-1">/ 100</span>
                </p>
              </div>
              <div className="text-right space-y-1">
                <Badge className={`text-sm px-3 py-1 ${score.isEligible
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-red-100 text-red-700 border-red-200'}`}>
                  {score.isEligible ? 'MEMENUHI SYARAT' : 'TIDAK MEMENUHI SYARAT'}
                </Badge>
                <p className="text-xs text-gray-500">
                  {!score.suratResmi
                    ? 'Surat pernyataan wajib ada'
                    : score.isEligible
                      ? 'Proposal dapat disetujui'
                      : 'Skor minimum 70 diperlukan'}
                </p>
              </div>
            </div>
          </div>

          {/* Alasan penolakan: tampilan berbeda tergantung status */}
          {proposal.status === 'rejected' ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Alasan Penolakan</Label>
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-gray-700 whitespace-pre-wrap min-h-[80px]">
                {proposal.rejectionReason
                  ? proposal.rejectionReason
                  : <span className="text-gray-400 italic">Alasan tidak tercatat</span>}
              </div>
            </div>
          ) : showRejectInput ? (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Alasan Penolakan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Jelaskan alasan penolakan proposal ini..."
                className="rounded-lg border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-400 min-h-[80px]"
              />
              <p className="text-xs text-red-500">Wajib diisi sebelum menolak proposal.</p>
            </div>
          ) : null}

          {/* Actions */}
          {proposal.status === 'approved' && (
            <div className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50">
              <p className="text-sm font-semibold text-amber-800">
                ✅ Proposal disetujui
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Campaign sudah dibuat tapi belum tayang ke publik. Buka tab <strong>Campaign</strong> dan klik tombol <strong>"Lengkapi"</strong> untuk menambahkan metode pembayaran dan alamat donasi barang sebelum dipublikasikan.
              </p>
            </div>
          )}
          {proposal.status === 'pending' && (
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                disabled={!score.isEligible}
                title={!score.suratResmi ? 'Surat pernyataan wajib ada' : !score.isEligible ? 'Skor minimum 70 diperlukan' : ''}
                onClick={handleApprove}
              >
                <ThumbsUp className="h-4 w-4 mr-1" /> Setujui
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
                onClick={handleReject}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                {showRejectInput ? 'Konfirmasi Tolak' : 'Tolak'}
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}