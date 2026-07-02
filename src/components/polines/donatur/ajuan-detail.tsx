'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  User, Mail, Phone, MapPin, FileText, Target, Calendar,
  FileCheck, ExternalLink, CheckCheck, XCircle, Clock, Megaphone, X, FileWarning, ImageOff,
} from 'lucide-react'
import { formatRupiah, formatDate } from '../types'
import { ProposalAPI, StatusBadge, RiwayatAjuan } from './tab-ajuan'

function mapStatus(status: ProposalAPI['status']): RiwayatAjuan['status'] {
  return status === 'approved' ? 'disetujui' : status === 'rejected' ? 'ditolak' : 'menunggu'
}

function isPdfUrl(url: string) {
  return url.toLowerCase().split('?')[0].endsWith('.pdf')
}

function InfoItem({
  icon: Icon, label, value, colored,
}: { icon: any; label: string; value: React.ReactNode; colored?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className={`font-medium break-words ${colored ? 'text-teal-600' : ''}`}>{value || '-'}</p>
    </div>
  )
}

// ============================================================
// LIGHTBOX (preview gambar penuh)
// ============================================================
function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
        onClick={onClose}
      >
        <X className="h-5 w-5 text-white" />
      </button>
      <img
        src={url}
        alt="Preview"
        className="max-w-full max-h-full rounded-lg object-contain"
        onClick={e => e.stopPropagation()}
      />
    </div>
  )
}

// ============================================================
// FOTO THUMBNAIL — dengan fallback kalau gagal dimuat
// ============================================================
function FotoThumbnail({ url, onClick }: { url: string; onClick: () => void }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="aspect-square rounded-lg border bg-gray-50 flex flex-col items-center justify-center gap-1 text-muted-foreground">
        <ImageOff className="h-5 w-5" />
        <span className="text-[10px]">Gagal dimuat</span>
      </div>
    )
  }

  return (
    <button type="button" onClick={onClick} className="aspect-square rounded-lg overflow-hidden border block">
      <img
        src={url}
        alt="Foto bukti"
        className="w-full h-full object-cover hover:scale-105 transition-transform"
        onError={() => setFailed(true)}
      />
    </button>
  )
}

// ============================================================
// DOKUMEN PREVIEW — cek validitas dulu sebelum render, biar gak nampilin error 404 mentah
// ============================================================
function DokumenPreview({ url }: { url: string }) {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking')
  const isPdf = isPdfUrl(url)

  useEffect(() => {
    let active = true
    setStatus('checking')

    fetch(url, { method: 'HEAD' })
      .then(res => {
        if (!active) return
        setStatus(res.ok ? 'ok' : 'error')
      })
      .catch(() => {
        if (active) setStatus('error')
      })

    return () => { active = false }
  }, [url])

  if (status === 'checking') {
    return (
      <div className="border rounded-lg p-6 flex items-center justify-center bg-gray-50">
        <p className="text-xs text-muted-foreground">Memeriksa dokumen...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/50 flex items-center gap-3">
        <FileWarning className="h-5 w-5 text-amber-600 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-700">Dokumen tidak dapat dimuat</p>
          <p className="text-xs text-amber-600">File mungkin sudah dihapus atau linknya tidak valid</p>
        </div>
      </div>
    )
  }

  if (isPdf) {
    return (
      <div className="border rounded-lg overflow-hidden bg-gray-50">
        <iframe src={url} title="Surat Pernyataan" className="w-full h-72" />
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 p-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-t"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Buka di tab baru
        </a>
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
    >
      <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
        <FileCheck className="h-5 w-5 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-emerald-700">Buka Dokumen</p>
        <p className="text-xs text-emerald-600 truncate">{url}</p>
      </div>
      <ExternalLink className="h-4 w-4 text-emerald-600 shrink-0" />
    </a>
  )
}

export function DetailAjuanPage({
  proposal,
  onBack,
  onResubmit,
}: {
  proposal: ProposalAPI
  onBack: () => void
  onResubmit: (id: string) => void
}) {
  const status = mapStatus(proposal.status)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  // Normalisasi foto jadi array string, apapun bentuk data dari API
  // (kadang backend mengembalikan JSON string, null, atau bukan array)
  const normalizePhotoUrls = (raw: unknown): string[] => {
    if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string')
    if (typeof raw === 'string' && raw.trim().length > 0) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) return parsed.filter((v): v is string => typeof v === 'string')
      } catch {
        // Bukan JSON, anggap sebagai satu URL tunggal
        return [raw]
      }
    }
    return []
  }

  const fotoFromArray = normalizePhotoUrls(proposal.photoUrls)
  const foto = fotoFromArray.length > 0
    ? fotoFromArray
    : proposal.photoUrl
    ? [proposal.photoUrl]
    : []

  return (
    <div className="w-full space-y-5">

      <Button
        variant="ghost" size="sm"
        className="p-0 h-auto text-muted-foreground hover:text-foreground"
        onClick={onBack}
      >
        ← Kembali ke Riwayat
      </Button>

      {/* Banner status */}
      {status === 'disetujui' && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
          <CheckCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">
            Campaign Anda telah disetujui dan akan segera dipublikasikan.
          </p>
        </div>
      )}
      {status === 'ditolak' && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-1">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600 shrink-0" />
            <p className="text-sm text-red-700 font-medium">Ajuan ditolak</p>
          </div>
          {proposal.rejectionReason && (
            <p className="text-xs text-red-600 pl-6">Catatan admin: {proposal.rejectionReason}</p>
          )}
        </div>
      )}
      {status === 'menunggu' && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700">Ajuan sedang dalam proses review admin (1–3 hari kerja).</p>
        </div>
      )}

      {/* Info Pengaju */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Informasi Pengaju</p>
            <StatusBadge status={status} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <InfoItem icon={User} label="Nama Lengkap" value={proposal.proposerName} />
            <InfoItem icon={Mail} label="Email" value={proposal.proposerEmail} />
            <InfoItem icon={Phone} label="No. Telepon" value={proposal.proposerPhone} />
            <InfoItem icon={MapPin} label="Alamat Pengaju" value={proposal.proposerAddress} />
          </div>
        </CardContent>
      </Card>

      {/* Info Campaign */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <p className="font-semibold">Informasi Campaign</p>

          <InfoItem icon={FileText} label="Judul Campaign" value={proposal.title} />

          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Deskripsi</p>
            <p className="text-sm leading-relaxed whitespace-pre-line">{proposal.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <InfoItem icon={FileText} label="Kategori" value={proposal.category} />
            <InfoItem icon={Target} label="Target Dana" value={formatRupiah(proposal.targetAmount)} colored />
            <InfoItem icon={Calendar} label="Tanggal Buka" value={formatDate(proposal.startDate)} />
            <InfoItem icon={Calendar} label="Tanggal Tutup" value={formatDate(proposal.endDate)} />
          </div>

          <InfoItem icon={MapPin} label="Lokasi Campaign" value={proposal.campaignLocation} />

          <div className="pt-1 text-xs text-muted-foreground">
            Diajukan pada {formatDate(proposal.createdAt)}
            {proposal.resubmittedFrom && ' · merupakan ajuan ulang'}
          </div>
        </CardContent>
      </Card>

      {/* Dokumen & Foto — full width di bawah */}
      {(proposal.officialDocUrl || foto.length > 0) && (
        <Card>
          <CardContent className="p-5 space-y-5">
            <p className="font-semibold">Dokumen & Foto</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Surat Pernyataan */}
              {proposal.officialDocUrl && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Surat Pernyataan Resmi</p>
                  <DokumenPreview url={proposal.officialDocUrl} />
                </div>
              )}

              {/* Foto Bukti */}
              {foto.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Foto Keadaan / Bukti</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {foto.map((url, i) => (
                      <FotoThumbnail key={i} url={url} onClick={() => setLightboxUrl(url)} />
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Klik foto untuk memperbesar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA resubmit */}
      {status === 'ditolak' && (
        <Card className="border-dashed border-red-200 bg-red-50/30">
          <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-medium text-red-700">Ingin mengajukan ulang?</p>
              <p className="text-xs text-red-600 mt-0.5">Perbaiki sesuai catatan admin lalu kirim kembali</p>
            </div>
            <Button
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white shrink-0"
              onClick={() => onResubmit(proposal.id)}
            >
              <Megaphone className="h-4 w-4 mr-1" /> Ajukan Ulang
            </Button>
          </CardContent>
        </Card>
      )}

      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  )
}