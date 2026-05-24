'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  User, Mail, Phone, MapPin, FileText, Target, Calendar,
  Upload, X, ArrowLeft, ArrowRight, Send, CheckCircle2,
  ShieldCheck, Info, Camera, Megaphone, FileCheck,
  Clock, CheckCheck, XCircle, ChevronRight,
} from 'lucide-react'
import { CATEGORIES, formatRupiah, formatDate } from './types'

// ============================================================
// TYPES
// ============================================================
interface AjuanForm {
  nama: string; email: string; telp: string; alamatPengaju: string
  judul: string; deskripsi: string; kategori: string; targetDana: string
  tanggalBuka: string; tanggalTutup: string; alamatCampaign: string
  fotoBukti: string; suratPernyataan: string; suratPernyataanName: string
  pernyataan: boolean[]
}

// Data dummy riwayat ajuan
interface RiwayatAjuan {
  id: string; judul: string; kategori: string; targetDana: number
  tanggalAjuan: string; status: 'menunggu' | 'disetujui' | 'ditolak'
  catatan?: string
}

const DUMMY_RIWAYAT: RiwayatAjuan[] = [
  { id: '1', judul: 'Bantu Korban Banjir Tembalang', kategori: 'Bencana', targetDana: 10000000, tanggalAjuan: '2026-05-10', status: 'disetujui' },
  { id: '2', judul: 'Renovasi Mushola RT 05', kategori: 'Sosial', targetDana: 25000000, tanggalAjuan: '2026-05-18', status: 'menunggu' },
  { id: '3', judul: 'Santunan Anak Yatim', kategori: 'Ramadhan', targetDana: 5000000, tanggalAjuan: '2026-04-30', status: 'ditolak', catatan: 'Dokumen surat pernyataan tidak terbaca, harap upload ulang.' },
]

const INITIAL_FORM: AjuanForm = {
  nama: '', email: '', telp: '', alamatPengaju: '',
  judul: '', deskripsi: '', kategori: '', targetDana: '',
  tanggalBuka: '', tanggalTutup: '', alamatCampaign: '',
  fotoBukti: '', suratPernyataan: '', suratPernyataanName: '',
  pernyataan: [false, false, false, false],
}

const PERNYATAAN_LIST = [
  'Saya menyatakan seluruh data yang diisi adalah benar dan dapat dipertanggungjawabkan.',
  'Dana yang terkumpul akan digunakan sesuai tujuan campaign yang tertera.',
  'Saya bersedia memberikan laporan penggunaan dana kepada admin jika diminta.',
  'Saya memahami bahwa pemalsuan data dapat dikenakan sanksi sesuai ketentuan.',
]

// ============================================================
// STATUS BADGE
// ============================================================
function StatusBadge({ status }: { status: RiwayatAjuan['status'] }) {
  if (status === 'disetujui') return <Badge className="bg-emerald-100 text-emerald-700 flex items-center gap-1"><CheckCheck className="h-3 w-3" /> Disetujui</Badge>
  if (status === 'ditolak') return <Badge className="bg-red-100 text-red-700 flex items-center gap-1"><XCircle className="h-3 w-3" /> Ditolak</Badge>
  return <Badge className="bg-amber-100 text-amber-700 flex items-center gap-1"><Clock className="h-3 w-3" /> Menunggu Review</Badge>
}

// ============================================================
// UPLOAD FOTO BUKTI
// ============================================================
function UploadFoto({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <Camera className="h-4 w-4 text-muted-foreground" /> Foto Keadaan / Bukti
        <span className="text-xs text-muted-foreground">(opsional)</span>
      </Label>
      {!value ? (
        <div
          className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-6 w-6 text-gray-400" />
          <p className="text-sm text-muted-foreground">Klik untuk upload foto</p>
          <p className="text-xs text-muted-foreground">JPG, PNG — maks 5MB</p>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden border">
          <img src={value} alt="preview" className="w-full h-36 object-cover" />
          <button type="button" className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center" onClick={() => onChange('')}>
            <X className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => {
        const file = e.target.files?.[0]
        if (file) onChange(URL.createObjectURL(file))
      }} />
    </div>
  )
}

// ============================================================
// UPLOAD SURAT PERNYATAAN
// ============================================================
function UploadSurat({ value, fileName, onChange }: { value: string; fileName: string; onChange: (url: string, name: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5">
        <FileCheck className="h-4 w-4 text-muted-foreground" /> Surat Pernyataan Resmi
        <span className="text-xs text-red-500 font-medium">* wajib</span>
      </Label>
      <p className="text-xs text-muted-foreground">
        Surat resmi dari organisasi/lembaga/desa pengaju, ditandatangani kepala organisasi dan distempel (jika ada).
      </p>
      {!value ? (
        <div
          className="border-2 border-dashed border-amber-200 bg-amber-50/30 rounded-lg p-5 flex flex-col items-center gap-2 cursor-pointer hover:border-amber-400 hover:bg-amber-50/60 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <FileCheck className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-sm font-medium text-amber-800">Upload Surat Pernyataan</p>
          <p className="text-xs text-amber-600">PDF, JPG, PNG — maks 10MB</p>
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
          <button type="button" className="text-gray-400 hover:text-red-500" onClick={() => onChange('', '')}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <input ref={inputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={e => {
        const file = e.target.files?.[0]
        if (file) onChange(URL.createObjectURL(file), file.name)
      }} />
    </div>
  )
}

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
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${i + 1 < step ? 'bg-teal-600 text-white' : i + 1 === step ? 'bg-teal-600 text-white ring-2 ring-teal-200' : 'bg-gray-100 text-gray-400'}`}>
              {i + 1 < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-[10px] hidden sm:block whitespace-nowrap ${i + 1 === step ? 'text-teal-600 font-semibold' : 'text-muted-foreground'}`}>{s}</span>
          </div>
          {i < steps.length - 1 && <div className={`flex-1 h-0.5 mb-3 transition-colors ${i + 1 < step ? 'bg-teal-600' : 'bg-gray-200'}`} />}
        </React.Fragment>
      ))}
    </div>
  )
}

// ============================================================
// MAIN COMPONENT
// ============================================================
interface AjuanFormProps {
  session: any
  onSubmit?: (form: AjuanForm) => void
}

export function AjuanForm({ session, onSubmit }: AjuanFormProps) {
  const [view, setView] = useState<'list' | 'form'>('list')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<AjuanForm>({
    ...INITIAL_FORM,
    nama: session?.user?.name ?? '',
    email: session?.user?.email ?? '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [sukses, setSukses] = useState(false)

  const set = (key: keyof AjuanForm, val: any) => setForm(prev => ({ ...prev, [key]: val }))
  const togglePernyataan = (i: number) => {
    const next = [...form.pernyataan]; next[i] = !next[i]; set('pernyataan', next)
  }

  const semuaPernyataan = form.pernyataan.every(Boolean)
  const step1Valid = !!(form.nama && form.email && form.telp && form.alamatPengaju)
  const step2Valid = !!(
    form.judul && form.deskripsi && form.kategori && form.targetDana &&
    form.tanggalBuka && form.tanggalTutup && form.alamatCampaign &&
    form.suratPernyataan // surat wajib
  )

  const handleReset = () => {
    setStep(1)
    setForm({ ...INITIAL_FORM, nama: session?.user?.name ?? '', email: session?.user?.email ?? '' })
    setSukses(false)
    setView('list')
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1000))
    onSubmit?.(form)
    setSubmitting(false)
    setSukses(true)
  }

  // ── SUKSES ──
  if (sukses) {
    return (
      <div className="max-w-lg mx-auto">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-teal-100 flex items-center justify-center">
              <CheckCircle2 className="h-9 w-9 text-teal-600" />
            </div>
            <div>
              <p className="font-bold text-xl text-teal-700">Ajuan Terkirim!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Admin akan meninjau ajuan Anda dan menghubungi via <strong>{form.email}</strong>
              </p>
            </div>
            <div className="bg-teal-50 rounded-lg p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Campaign</span><span className="font-medium">{form.judul}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Kategori</span><span className="font-medium">{form.kategori}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Target Dana</span><span className="font-medium text-teal-600">{formatRupiah(Number(form.targetDana))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Surat Pernyataan</span><span className="font-medium text-emerald-600">✓ Terlampir</span></div>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-700">
                ⏳ Proses review 1–3 hari kerja. Notifikasi dikirim ke <strong>admin@polines.ac.id</strong>
              </p>
            </div>
            <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={handleReset}>
              Lihat Riwayat Ajuan
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── VIEW: LIST RIWAYAT ──
  if (view === 'list') {
    return (
      <div className="space-y-5">

        {/* Header + Tombol Ajukan */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Ajuan Campaign Saya</h2>
            <p className="text-sm text-muted-foreground">Pantau status ajuan campaign yang telah kamu kirim</p>
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white shrink-0" onClick={() => setView('form')}>
            <Megaphone className="h-4 w-4 mr-1.5" /> Ajukan Baru
          </Button>
        </div>

        {/* List Riwayat */}
        {DUMMY_RIWAYAT.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center space-y-3">
              <Megaphone className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="font-medium">Belum ada ajuan</p>
              <p className="text-sm text-muted-foreground">Klik tombol "Ajukan Baru" untuk mengajukan campaign donasi</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {DUMMY_RIWAYAT.map(r => (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
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
                      {/* Catatan penolakan */}
                      {r.status === 'ditolak' && r.catatan && (
                        <div className="mt-2 p-2.5 bg-red-50 border border-red-100 rounded-lg">
                          <p className="text-xs text-red-600">
                            <span className="font-semibold">Catatan admin:</span> {r.catatan}
                          </p>
                        </div>
                      )}
                      {/* Info disetujui */}
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
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{step}</div>
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

  // ── VIEW: FORM ──
  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="p-0 h-auto text-muted-foreground hover:text-foreground" onClick={() => { setView('list'); setStep(1) }}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
        </Button>
        <div className="h-4 w-px bg-gray-200" />
        <div>
          <h2 className="text-lg font-bold">Ajukan Campaign Donasi</h2>
          <p className="text-sm text-muted-foreground">Lengkapi formulir berikut</p>
        </div>
      </div>

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
                <p className="text-xs text-teal-700">Data pengaju digunakan untuk verifikasi identitas. Pastikan data yang diisi valid dan dapat dihubungi.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><User className="h-4 w-4 text-muted-foreground" /> Nama Lengkap</Label>
                  <Input placeholder="Nama lengkap pengaju" value={form.nama} onChange={e => set('nama', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Mail className="h-4 w-4 text-muted-foreground" /> Email</Label>
                  <Input type="email" placeholder="email@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5"><Phone className="h-4 w-4 text-muted-foreground" /> No. Telepon</Label>
                  <Input placeholder="08xxxxxxxxxx" value={form.telp} onChange={e => set('telp', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-muted-foreground" /> Alamat Pengaju</Label>
                <Textarea placeholder="Alamat lengkap pengaju..." value={form.alamatPengaju} onChange={e => set('alamatPengaju', e.target.value)} rows={3} className="resize-none" />
              </div>
            </div>
          )}

          {/* ── STEP 2: Data Campaign ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-muted-foreground" /> Judul Campaign</Label>
                <Input placeholder="Judul campaign yang jelas dan deskriptif" value={form.judul} onChange={e => set('judul', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Deskripsi Campaign</Label>
                <Textarea
                  placeholder="Jelaskan tujuan, latar belakang, dan manfaat campaign ini secara detail..."
                  value={form.deskripsi} onChange={e => set('deskripsi', e.target.value)}
                  rows={5} className="resize-none"
                />
                {form.deskripsi.length > 0 && form.deskripsi.length < 100 && (
                  <p className="text-xs text-amber-600">⚠ Deskripsi terlalu singkat, jelaskan lebih detail ({form.deskripsi.length}/100 karakter)</p>
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
                  <Label className="flex items-center gap-1"><Target className="h-3.5 w-3.5 text-muted-foreground" /> Target Dana (Rp)</Label>
                  <Input type="number" placeholder="Contoh: 5000000" value={form.targetDana} onChange={e => set('targetDana', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Tanggal Buka</Label>
                  <Input type="date" value={form.tanggalBuka} onChange={e => set('tanggalBuka', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /> Tanggal Tutup</Label>
                  <Input type="date" value={form.tanggalTutup} onChange={e => set('tanggalTutup', e.target.value)} />
                </div>
              </div>
              {form.tanggalBuka && form.tanggalTutup && (() => {
                const durasi = Math.round((new Date(form.tanggalTutup).getTime() - new Date(form.tanggalBuka).getTime()) / (1000 * 60 * 60 * 24))
                return durasi < 7 || durasi > 90
                  ? <p className="text-xs text-amber-600">⚠ Durasi {durasi} hari — idealnya antara 7 hingga 90 hari</p>
                  : <p className="text-xs text-teal-600">✓ Durasi campaign: {durasi} hari</p>
              })()}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-muted-foreground" /> Alamat Lokasi Campaign</Label>
                <Textarea placeholder="Alamat lengkap lokasi campaign..." value={form.alamatCampaign} onChange={e => set('alamatCampaign', e.target.value)} rows={2} className="resize-none" />
              </div>

              {/* Upload Foto Bukti */}
              <UploadFoto value={form.fotoBukti} onChange={v => set('fotoBukti', v)} />

              {/* Upload Surat Pernyataan — WAJIB */}
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
                <p className="text-xs text-blue-700">Baca dan centang semua pernyataan di bawah sebagai bentuk komitmen dan integritas pengajuan Anda.</p>
              </div>

              <div className="space-y-3">
                {PERNYATAAN_LIST.map((p, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${form.pernyataan[i] ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-100'}`}>
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
                <div className="flex justify-between"><span className="text-muted-foreground">Pengaju</span><span className="font-medium">{form.nama}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Campaign</span><span className="font-medium max-w-[200px] truncate text-right">{form.judul}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Kategori</span><span className="font-medium">{form.kategori}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Target</span><span className="font-medium text-teal-600">{formatRupiah(Number(form.targetDana))}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Surat Pernyataan</span><span className="font-medium text-emerald-600 truncate max-w-[180px] text-right">{form.suratPernyataanName}</span></div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Navigasi */}
      <div className="flex gap-3 pb-6">
        {step > 1 && (
          <Button variant="outline" className="flex-1 sm:flex-none sm:w-32" onClick={() => setStep(s => s - 1)}>
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
            {submitting ? 'Mengirim...' : 'Kirim Ajuan'} <Send className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  )
}