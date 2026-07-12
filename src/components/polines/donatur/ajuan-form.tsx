'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  User, Mail, Phone, MapPin, FileText, Target, Calendar,
  Upload, X, ArrowLeft, ArrowRight, Send, CheckCircle2,
  ShieldCheck, Info, Camera, Megaphone, FileCheck, AlertCircle,
} from 'lucide-react'
import { CATEGORIES, formatRupiah } from '../types'
import type { ProposalAPI } from './tab-ajuan'

// ============================================================
// TYPES
// ============================================================
interface AjuanForm {
  nama: string; email: string; telp: string; alamatPengaju: string
  judul: string; deskripsi: string; kategori: string; targetDana: string
  tanggalBuka: string; tanggalTutup: string; alamatCampaign: string
  fotoBukti: string[]; suratPernyataan: string; suratPernyataanName: string
  pernyataan: boolean[]
}

// ============================================================
// CONSTANTS
// ============================================================
const INITIAL_FORM: AjuanForm = {
  nama: '', email: '', telp: '', alamatPengaju: '',
  judul: '', deskripsi: '', kategori: '', targetDana: '',
  tanggalBuka: '', tanggalTutup: '', alamatCampaign: '',
  fotoBukti: [], suratPernyataan: '', suratPernyataanName: '',
  pernyataan: [false, false, false, false],
}

const PERNYATAAN_LIST = [
  'Saya menyatakan seluruh data yang diisi adalah benar dan dapat dipertanggungjawabkan.',
  'Dana yang terkumpul akan digunakan sesuai tujuan campaign yang tertera.',
  'Saya bersedia memberikan laporan penggunaan dana kepada admin jika diminta.',
  'Saya memahami bahwa pemalsuan data dapat dikenakan sanksi sesuai ketentuan.',
]

// ============================================================
// STEP INDICATOR
// ============================================================
function StepIndicator({ step }: { step: number }) {
  const steps = ['Info Pengaju', 'Data Campaign', 'Pernyataan']
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-0.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${i + 1 < step ? 'bg-teal-600 text-white' : i + 1 === step ? 'bg-teal-600 text-white ring-2 ring-teal-200' : 'bg-gray-100 text-gray-400'}`}
            >
              {i + 1 < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`text-[10px] hidden sm:block whitespace-nowrap
                ${i + 1 === step ? 'text-teal-600 font-semibold' : 'text-muted-foreground'}`}
            >
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mb-3 transition-colors ${i + 1 < step ? 'bg-teal-600' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ============================================================
// UPLOAD FOTO BUKTI
// ============================================================
// Komponen UploadFoto baru — support multiple
function UploadFoto({ values, onChange }: { 
  values: string[]
  onChange: (v: string[]) => void 
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (files: FileList) => {
    setUploading(true)
    try {
      const uploaded: string[] = []
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) throw new Error(`Gagal upload ${file.name}`)
        const data = await res.json()
        uploaded.push(data.url)
      }
      onChange([...values, ...uploaded])
    } catch {
      alert('Gagal mengupload foto. Coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Camera className="h-4 w-4 text-muted-foreground" /> Foto Keadaan / Bukti
        <span className="text-xs text-muted-foreground">(opsional, bisa lebih dari 1)</span>
      </Label>

      {/* Preview grid */}
      {values.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {values.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
              <img src={url} alt={`foto ${i + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                onClick={() => handleRemove(i)}
              >
                <X className="h-3 w-3 text-white" />
              </button>
            </div>
          ))}
          {/* Tombol tambah foto */}
          <button
            type="button"
            className={`aspect-square rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 transition-colors
              ${uploading ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-teal-400 hover:bg-teal-50/30'}`}
            onClick={() => !uploading && inputRef.current?.click()}
          >
            <Upload className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-400">{uploading ? '...' : 'Tambah'}</span>
          </button>
        </div>
      )}

      {/* Empty state */}
      {values.length === 0 && (
        <div
          className={`border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center gap-2 transition-colors
            ${uploading ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-teal-400 hover:bg-teal-50/30'}`}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          <Upload className="h-6 w-6 text-gray-400" />
          <p className="text-sm text-muted-foreground">
            {uploading ? 'Mengupload...' : 'Klik untuk upload foto'}
          </p>
          <p className="text-xs text-muted-foreground">JPG, PNG — maks 5MB per foto</p>
        </div>
      )}

      <input
        ref={inputRef} type="file" accept="image/*" multiple className="hidden"
        onChange={e => { if (e.target.files?.length) handleFiles(e.target.files) }}
      />
    </div>
  )
}

// ============================================================
// UPLOAD SURAT PERNYATAAN
// ============================================================
function UploadSurat({
  value, fileName, onChange,
}: {
  value: string; fileName: string; onChange: (url: string, name: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Gagal upload surat')
      const data = await res.json()
      onChange(data.url, file.name) // ✅ URL permanen dari server
    } catch {
      alert('Gagal mengupload surat. Coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <FileCheck className="h-4 w-4 text-muted-foreground" /> Surat Pernyataan Resmi
        <span className="text-xs text-red-500 font-medium">* wajib</span>
      </Label>
      <p className="text-xs text-muted-foreground">
        Surat resmi dari organisasi/lembaga/desa pengaju, ditandatangani dan distempel (jika ada).
      </p>
      {!value ? (
        <div
          className={`border-2 border-dashed border-amber-200 bg-amber-50/30 rounded-lg p-5 flex flex-col items-center gap-2 transition-colors
            ${uploading ? 'opacity-60 cursor-wait' : 'cursor-pointer hover:border-amber-400 hover:bg-amber-50/60'}`}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <FileCheck className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-sm font-medium text-amber-800">
            {uploading ? 'Mengupload surat...' : 'Upload Surat Pernyataan'}
          </p>
          <p className="text-xs text-amber-600">PDF, JPG, PNG — maks 5MB</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <FileCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-700 truncate">{fileName}</p>
            <p className="text-xs text-emerald-600">Berhasil diupload ✓</p>
          </div>
          <button type="button" className="text-gray-400 hover:text-red-500"
            onClick={() => onChange('', '')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <input
        ref={inputRef} type="file" accept=".pdf,image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

// ============================================================
// SUKSES VIEW
// ============================================================
function SuksesView({
  form,
  isResubmit,
  onSelesai,
}: {
  form: AjuanForm
  isResubmit: boolean
  onSelesai: () => void
}) {
  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-teal-100 flex items-center justify-center">
            <CheckCircle2 className="h-9 w-9 text-teal-600" />
          </div>
          <div>
            <p className="font-bold text-xl text-teal-700">
              {isResubmit ? 'Ajuan Ulang Terkirim!' : 'Ajuan Terkirim!'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Admin akan meninjau ajuan Anda dan menghubungi via <strong>{form.email}</strong>
            </p>
          </div>
          <div className="bg-teal-50 rounded-lg p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Campaign</span>
              <span className="font-medium">{form.judul}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kategori</span>
              <span className="font-medium">{form.kategori}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Target Dana</span>
              <span className="font-medium text-teal-600">{formatRupiah(Number(form.targetDana))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Surat Pernyataan</span>
              <span className="font-medium text-emerald-600">✓ Terlampir</span>
            </div>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-700">
              ⏳ Proses review 1–3 hari kerja. Notifikasi dikirim ke email Anda.
            </p>
          </div>
          <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={onSelesai}>
            Kembali ke Riwayat
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ============================================================
// MAIN: AjuanFormPage
// ============================================================
// helper kecil buat ambil nama file dari URL
function extractFileName(url: string) {
  try {
    const clean = url.split('?')[0]
    return decodeURIComponent(clean.substring(clean.lastIndexOf('/') + 1)) || 'Dokumen'
  } catch {
    return 'Dokumen'
  }
}

interface AjuanFormPageProps {
  session: any
  resubmitFromId?: string | null
  resubmitProposal?: ProposalAPI | null
  onBack: () => void
  onSuccess: () => void
}

export function AjuanFormPage({ session, resubmitFromId, resubmitProposal, onBack, onSuccess }: AjuanFormPageProps) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<AjuanForm>(() => {
    if (resubmitProposal) {
      return {
        nama: resubmitProposal.proposerName ?? session?.user?.name ?? '',
        email: resubmitProposal.proposerEmail ?? session?.user?.email ?? '',
        telp: resubmitProposal.proposerPhone ?? '',
        alamatPengaju: resubmitProposal.proposerAddress ?? '',
        judul: resubmitProposal.title,
        deskripsi: resubmitProposal.description,
        kategori: resubmitProposal.category,
        targetDana: String(resubmitProposal.targetAmount),
        tanggalBuka: resubmitProposal.startDate?.slice(0, 10) ?? '',
        tanggalTutup: resubmitProposal.endDate?.slice(0, 10) ?? '',
        alamatCampaign: resubmitProposal.campaignLocation,
        fotoBukti: resubmitProposal.photoUrls ?? (resubmitProposal.photoUrl ? [resubmitProposal.photoUrl] : []),
        suratPernyataan: resubmitProposal.officialDocUrl ?? '',
        suratPernyataanName: resubmitProposal.officialDocUrl ? extractFileName(resubmitProposal.officialDocUrl) : '',
        pernyataan: [false, false, false, false],
      }
    }
    return {
      ...INITIAL_FORM,
      nama: session?.user?.name ?? '',
      email: session?.user?.email ?? '',
    }
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [sukses, setSukses] = useState(false)

  const set = (key: keyof AjuanForm, val: any) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const togglePernyataan = (i: number) => {
    const next = [...form.pernyataan]; next[i] = !next[i]; set('pernyataan', next)
  }

  const semuaPernyataan = form.pernyataan.every(Boolean)
  const step1Valid = !!(form.nama && form.email && form.telp && form.alamatPengaju)
  const step2Valid = !!(
    form.judul && form.deskripsi && form.kategori && form.targetDana &&
    form.tanggalBuka && form.tanggalTutup && form.alamatCampaign &&
    form.suratPernyataan
  )

  const buildBody = () => ({
    title: form.judul,
    description: form.deskripsi,
    category: form.kategori,
    targetAmount: Number(form.targetDana),
    proposerName: form.nama, 
    proposerEmail: form.email,
    proposerPhone: form.telp,
    proposerAddress: form.alamatPengaju,
    campaignLocation: form.alamatCampaign,
    startDate: form.tanggalBuka,
    endDate: form.tanggalTutup,
    officialDocUrl: form.suratPernyataan,
    photoUrls: form.fotoBukti.length > 0 ? form.fotoBukti : null,
  })

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const url = resubmitFromId
        ? `/api/proposals/${resubmitFromId}/resubmit`
        : '/api/proposals'

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody()),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengirim ajuan')
      }

      setSukses(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }

  if (sukses) {
    return (
      <SuksesView
        form={form}
        isResubmit={!!resubmitFromId}
        onSelesai={onSuccess}
      />
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost" size="sm"
          className="p-0 h-auto text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
        </Button>
        <div className="h-4 w-px bg-gray-200" />
        <div>
          <h2 className="text-lg font-bold">
            {resubmitFromId ? 'Ajukan Ulang Campaign' : 'Ajukan Campaign Donasi'}
          </h2>
          <p className="text-sm text-muted-foreground">Lengkapi formulir berikut</p>
        </div>
      </div>

      {/* Banner resubmit */}
      {resubmitFromId && (
        <div className="space-y-2">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
            <Info className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700">
              Anda sedang mengajukan ulang proposal yang ditolak. Data sebelumnya sudah dimuat — perbaiki sesuai catatan admin di bawah.
            </p>
          </div>
          {resubmitProposal?.rejectionReason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-red-700">Alasan penolakan sebelumnya:</p>
                <p className="text-xs text-red-600 mt-0.5">{resubmitProposal.rejectionReason}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step Indicator */}
      <StepIndicator step={step} />

      {/* Form Card */}
      <Card>
        <CardContent className="p-6 space-y-5">

          {/* ── STEP 1: Info Pengaju ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-teal-50 rounded-lg p-3 flex items-start gap-2">
                <Info className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                <p className="text-xs text-teal-700">
                  Data pengaju digunakan untuk verifikasi identitas. Pastikan data yang diisi valid dan dapat dihubungi.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-muted-foreground" /> Nama Lengkap
                  </Label>
                  <Input placeholder="Nama lengkap pengaju" value={form.nama} onChange={e => set('nama', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-muted-foreground" /> Email
                  </Label>
                  <Input type="email" placeholder="email@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-muted-foreground" /> No. Telepon
                  </Label>
                  <Input placeholder="08xxxxxxxxxx" value={form.telp} onChange={e => set('telp', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> Alamat Pengaju
                </Label>
                <Textarea
                  placeholder="Alamat lengkap pengaju..."
                  value={form.alamatPengaju} onChange={e => set('alamatPengaju', e.target.value)}
                  rows={3} className="resize-none"
                />
              </div>
            </div>
          )}

          {/* ── STEP 2: Data Campaign ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-muted-foreground" /> Judul Campaign
                </Label>
                <Input
                  placeholder="Judul campaign yang jelas dan deskriptif"
                  value={form.judul} onChange={e => set('judul', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi Campaign</Label>
                <Textarea
                  placeholder="Jelaskan tujuan, latar belakang, dan manfaat campaign ini secara detail..."
                  value={form.deskripsi} onChange={e => set('deskripsi', e.target.value)}
                  rows={5} className="resize-none"
                />
                {form.deskripsi.length > 0 && form.deskripsi.length < 100 && (
                  <p className="text-xs text-amber-600">
                    ⚠ Deskripsi terlalu singkat ({form.deskripsi.length}/100 karakter)
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={form.kategori} onValueChange={v => set('kategori', v)}>
                    <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5 text-muted-foreground" /> Target Dana (Rp)
                  </Label>
                  <Input type="number" placeholder="Contoh: 5000000" value={form.targetDana} onChange={e => set('targetDana', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Tanggal Buka
                  </Label>
                  <Input type="date" value={form.tanggalBuka} onChange={e => set('tanggalBuka', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Tanggal Tutup
                  </Label>
                  <Input type="date" value={form.tanggalTutup} onChange={e => set('tanggalTutup', e.target.value)} />
                </div>
              </div>

              {/* Validasi durasi */}
              {form.tanggalBuka && form.tanggalTutup && (() => {
                const durasi = Math.round(
                  (new Date(form.tanggalTutup).getTime() - new Date(form.tanggalBuka).getTime())
                  / (1000 * 60 * 60 * 24)
                )
                return durasi < 7 || durasi > 90
                  ? <p className="text-xs text-amber-600">⚠ Durasi {durasi} hari — idealnya 7–90 hari</p>
                  : <p className="text-xs text-teal-600">✓ Durasi campaign: {durasi} hari</p>
              })()}

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" /> Alamat Lokasi Campaign
                </Label>
                <Textarea
                  placeholder="Alamat lengkap lokasi campaign..."
                  value={form.alamatCampaign} onChange={e => set('alamatCampaign', e.target.value)}
                  rows={2} className="resize-none"
                />
              </div>

              <UploadFoto values={form.fotoBukti} onChange={v => set('fotoBukti', v)} />
              <UploadSurat
                value={form.suratPernyataan}
                fileName={form.suratPernyataanName}
                onChange={(url, name) => { set('suratPernyataan', url); set('suratPernyataanName', name) }}
              />
            </div>
          )}

          {/* ── STEP 3: Pernyataan ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700">
                  Baca dan centang semua pernyataan sebagai bentuk komitmen dan integritas pengajuan Anda.
                </p>
              </div>

              <div className="space-y-3">
                {PERNYATAAN_LIST.map((p, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors
                      ${form.pernyataan[i] ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-100'}`}
                  >
                    <Checkbox
                      id={`p-${i}`}
                      checked={form.pernyataan[i]}
                      onCheckedChange={() => togglePernyataan(i)}
                      className="mt-0.5 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                    />
                    <label htmlFor={`p-${i}`} className="text-sm leading-relaxed cursor-pointer">{p}</label>
                  </div>
                ))}
              </div>

              {/* Ringkasan */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm border">
                <p className="font-semibold mb-1">Ringkasan Ajuan</p>
                {[
                  { label: 'Pengaju', value: form.nama },
                  { label: 'Campaign', value: form.judul },
                  { label: 'Kategori', value: form.kategori },
                  { label: 'Target', value: formatRupiah(Number(form.targetDana)), colored: true },
                  { label: 'Surat Pernyataan', value: form.suratPernyataanName, emerald: true },
                ].map(({ label, value, colored, emerald }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className={`font-medium truncate max-w-[200px] text-right ${colored ? 'text-teal-600' : emerald ? 'text-emerald-600' : ''}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Error */}
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}
            </div>
          )}

        </CardContent>
      </Card>

      {/* Navigasi */}
      <div className="flex gap-3 pb-6">
        {step > 1 && (
          <Button
            variant="outline" className="flex-1 sm:flex-none sm:w-32"
            onClick={() => setStep(s => s - 1)} disabled={submitting}
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
          </Button>
        )}
        {step < 3 && (
          <Button
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            disabled={step === 1 ? !step1Valid : !step2Valid}
            onClick={() => setStep(s => s + 1)}
          >
            Selanjutnya <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
        {step === 3 && (
          <Button
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
            disabled={!semuaPernyataan || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Mengirim...' : resubmitFromId ? 'Kirim Ulang' : 'Kirim Ajuan'}
            <Send className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>

    </div>
  )
}

export { AjuanFormPage as AjuanForm }