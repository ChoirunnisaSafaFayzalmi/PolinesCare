'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import {
  Check, ThumbsUp, ThumbsDown,
  User, Mail, Phone, MapPin, FileText, Target, Calendar,
  FileCheck, Camera, AlignLeft, Hash, Globe, Lock,
} from 'lucide-react'
import type { Proposal } from '@/components/polines/types'
import {
  formatRupiah, getCategoryColor, getStatusColor,
  PROPOSAL_CRITERIA, getAverageCriteria, isProposalEligible, getCriteriaScoreColor,
} from '@/components/polines/types'

interface AjuanDetailViewProps {
  proposal: Proposal
  onSaveCriteria: (id: string, criteria: Record<string, number>) => void
  onUpdateStatus: (id: string, status: 'approved' | 'rejected', meta?: { isPublic?: boolean; rejectionReason?: string }) => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="h-8 w-1 rounded-full bg-teal-600" />
      <h3 className="text-base font-bold text-gray-800">{children}</h3>
    </div>
  )
}

function InfoRow({
  icon: Icon, label, value, full = false,
}: {
  icon?: React.ElementType; label: string; value?: string | number | null; full?: boolean
}) {
  return (
    <div className={`space-y-1 ${full ? 'col-span-2' : ''}`}>
      <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </p>
      <p className="text-sm font-medium text-gray-700 whitespace-pre-wrap">
        {value ? String(value) : <span className="text-gray-300 italic">Tidak diisi</span>}
      </p>
    </div>
  )
}

export function AjuanDetailView({ proposal: initialProposal, onSaveCriteria, onUpdateStatus }: AjuanDetailViewProps) {
  const [proposal, setProposal] = useState(initialProposal)
  const [scores, setScores] = useState<Record<string, number>>({
    kejelasanTujuan:   initialProposal.kejelasanTujuan   ?? 0,
    kelayakanAnggaran: initialProposal.kelayakanAnggaran ?? 0,
    urgensi:           initialProposal.urgensi           ?? 0,
    keterkaitanKampus: initialProposal.keterkaitanKampus ?? 0,
    kontribusiSosial:  initialProposal.kontribusiSosial  ?? 0,
  })
  const [isPublic, setIsPublic] = useState(true)
  const [rejectionReason, setRejectionReason] = useState(initialProposal.rejectionReason ?? '')
  const [showRejectInput, setShowRejectInput] = useState(false)

  const effectiveProposal = { ...proposal, ...scores } as Proposal
  const avgScore = getAverageCriteria(effectiveProposal)
  const eligible = isProposalEligible(effectiveProposal)

  const handleSave = () => {
    onSaveCriteria(proposal.id, scores)
    setProposal({ ...proposal, ...scores } as Proposal)
  }

  const handleApprove = () => {
    handleSave()
    onUpdateStatus(proposal.id, 'approved', { isPublic })
    setProposal({ ...proposal, status: 'approved' })
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      setShowRejectInput(true)
      return
    }
    handleSave()
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

      {/* ── Section 1: Informasi Pengaju ── */}
      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-6">
          <SectionTitle>Informasi Pengaju</SectionTitle>
          <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-800">{proposal.title}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={getCategoryColor(proposal.category)}>
                  {proposal.category}
                </Badge>
                <span className="text-xs text-gray-400">#{proposal.id?.slice(0, 8)}</span>
              </div>
            </div>
            <Badge className={`${getStatusColor(proposal.status)} text-sm px-3 py-1`}>
              {proposal.status}
            </Badge>
          </div>
          <Separator className="mb-4" />
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow icon={User}   label="Nama Pengaju"   value={proposal.proposer?.name} />
              <InfoRow icon={Mail}   label="Email"          value={proposal.proposer?.email ?? proposal.proposerEmail} />
              <InfoRow icon={Phone}  label="No. Telepon"    value={proposal.proposer?.phone ?? proposal.proposerPhone} />
              <InfoRow icon={MapPin} label="Alamat Pengaju" value={proposal.proposer?.address ?? proposal.proposerAddress} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Data Campaign ── */}
      <Card className="shadow-sm border-gray-100">
        <CardContent className="p-6">
          <SectionTitle>Data Campaign</SectionTitle>
          <div className="space-y-4">

            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <InfoRow icon={AlignLeft} label="Deskripsi Campaign" value={proposal.description} full />
            </div>

            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow icon={Hash}     label="Kategori"              value={proposal.category} />
                <InfoRow icon={Target}   label="Target Dana"           value={proposal.targetAmount ? formatRupiah(proposal.targetAmount) : null} />
                <InfoRow icon={Calendar} label="Tanggal Buka"          value={proposal.startDate} />
                <InfoRow icon={Calendar} label="Tanggal Tutup"         value={proposal.endDate} />
                {durasiHari !== null && (
                  <InfoRow label="Durasi Campaign" value={`${durasiHari} hari`} />
                )}
                <InfoRow icon={MapPin}   label="Alamat Lokasi Campaign" value={proposal.campaignLocation} />
                <InfoRow icon={ThumbsUp} label="Jumlah Suara"          value={`${proposal.votesCount ?? 0} suara`} />
              </div>
            </div>

            {/* Foto Keadaan */}
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                <Camera className="h-3.5 w-3.5" /> Foto Keadaan / Bukti
              </p>
              {proposal.photoUrl ? (
                <div className="rounded-xl overflow-hidden border border-gray-200 max-w-sm">
                  <img src={proposal.photoUrl} alt="Foto bukti" className="w-full object-cover max-h-64" />
                </div>
              ) : (
                <p className="text-sm text-gray-300 italic">Tidak ada foto</p>
              )}
            </div>

            {/* Surat Pernyataan */}
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                <FileCheck className="h-3.5 w-3.5" /> Surat Pernyataan Resmi
              </p>
              {proposal.officialDocUrl ? (
                <a href={proposal.officialDocUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Lihat Surat Pernyataan</p>
                    <p className="text-xs text-emerald-600">Klik untuk membuka dokumen ↗</p>
                  </div>
                </a>
              ) : (
                <p className="text-sm text-gray-300 italic">Tidak ada surat pernyataan</p>
              )}
            </div>

          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Penilaian ── */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-teal-600" />
            <div>
              <CardTitle className="text-base font-bold">Alur Penilaian Proposal</CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Proposal dinilai berdasarkan 5 kriteria (skor 0–100). Rata-rata ≥ 70 memenuhi syarat.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {PROPOSAL_CRITERIA.map(criterion => {
            const score = scores[criterion.key] ?? 0
            return (
              <div key={criterion.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">{criterion.label}</Label>
                    <p className="text-xs text-gray-400 mt-0.5">{criterion.description}</p>
                  </div>
                  <span className={`inline-flex items-center justify-center w-12 h-7 rounded-md text-sm font-bold ${getCriteriaScoreColor(score)}`}>
                    {score}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-6">0</span>
                  <input
                    type="range" min={0} max={100} step={5} value={score}
                    onChange={(e) => setScores(prev => ({ ...prev, [criterion.key]: Number(e.target.value) }))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
                  />
                  <span className="text-xs text-gray-400 w-8">100</span>
                </div>
              </div>
            )
          })}

          {/* Score Summary */}
          <div className={`mt-4 p-4 rounded-lg border-2 ${eligible ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-800">Rata-rata Skor</p>
                <p className="text-2xl font-bold mt-1">
                  <span className={eligible ? 'text-emerald-600' : 'text-red-600'}>{avgScore}</span>
                  <span className="text-sm text-gray-400 ml-2">/ 100</span>
                </p>
              </div>
              <div className="text-right">
                <Badge className={`text-sm px-3 py-1 ${eligible ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                  {eligible ? 'MEMENUHI SYARAT' : 'TIDAK MEMENUHI SYARAT'}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">
                  {eligible ? 'Proposal dapat disetujui' : 'Rata-rata skor harus ≥ 70'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Visibilitas Campaign (hanya saat approve) ── */}
{proposal.status === 'pending' && (
  <div className="p-4 bg-white rounded-xl border border-gray-100 space-y-3">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700">Publik</p>
        <p className="text-xs text-gray-400 mt-0.5">Campaign tampil di beranda donatur</p>
      </div>
      <button
        type="button"
        onClick={() => setIsPublic(!isPublic)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer flex-shrink-0 ${
          isPublic ? 'bg-teal-500' : 'bg-gray-300'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
          isPublic ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  </div>
)}

          {/* ── Input Alasan Penolakan ── */}
          {(showRejectInput || proposal.status === 'rejected') && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Alasan Penolakan <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Jelaskan alasan penolakan proposal ini..."
                className="rounded-lg border-gray-200 focus:border-red-400 focus:ring-1 focus:ring-red-400 min-h-[80px]"
                disabled={proposal.status === 'rejected'}
              />
              {proposal.status !== 'rejected' && (
                <p className="text-xs text-red-500">Wajib diisi sebelum menolak proposal.</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg" onClick={handleSave}>
              <Check className="h-4 w-4 mr-1" /> Simpan Penilaian
            </Button>
            {proposal.status === 'pending' && (
              <>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  disabled={!eligible}
                  title={eligible ? 'Setujui proposal' : 'Skor rata-rata harus ≥ 70'}
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
              </>
            )}
          </div>

        </CardContent>
      </Card>

    </div>
  )
}