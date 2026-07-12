'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ImagePlus, X, Plus, Trash2 } from 'lucide-react'
import { CATEGORIES } from '@/components/polines/types'
import type { Campaign } from '@/components/polines/types'

const inputCls = 'rounded-lg border-gray-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500'

interface PaymentMethod {
  key: string
  label: string
  accountNumber: string
  isVisible: boolean
}

interface CampaignFormViewProps {
  campaignForm: {
    title: string; description: string; category: string; targetAmount: string
    startDate: string; endDate: string; isUrgent: boolean; isPublic: boolean
    paymentMethods: PaymentMethod[]
    qrisImageUrl?: string
    uniqueCode: string
    images?: string[]
    location?: string
    dropOffLocation?: string
    // data pengaju, dipakai saat mode === 'complete-from-proposal'
    proposerName?: string
    proposerEmail?: string
    proposerPhone?: string
    proposerAddress?: string
  }
  setCampaignForm: (form: any) => void
  editingCampaign: Campaign | null
  submitting: boolean
  onSave: (imageFiles?: File[], qrisFile?: File) => void
  onBack: () => void
  session: {
    user?: {
      name?: string | null
      email?: string | null
      phone?: string | null
      address?: string | null
    }
  } | null
  mode?: 'create' | 'complete-from-proposal'
}

// Reusable toggle component
function Toggle({ checked, onChange, label, description }: {
  checked: boolean
  onChange: () => void
  label: string
  description?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${checked ? 'bg-teal-500' : 'bg-gray-300'
          }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'
          }`} />
      </button>
    </div>
  )
}

// Modal for adding payment method
function AddPaymentModal({
  onAdd,
  onClose,
}: {
  onAdd: (label: string, accountNumber: string) => void
  onClose: () => void
}) {
  const [label, setLabel] = useState('')
  const [accountNumber, setAccountNumber] = useState('')

  const handleAdd = () => {
    if (!label.trim()) return
    onAdd(label.trim(), accountNumber.trim())
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-sm mx-4 p-6 space-y-4 z-50">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-bold text-gray-800">Tambah Metode Pembayaran</h4>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="h-3.5 w-3.5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Nama Bank / E-Wallet <span className="text-red-400">*</span>
            </Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Contoh: Transfer Bank BSI, E-Wallet ShopeePay"
              className={inputCls}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              No. Rekening / No. HP
              <span className="text-gray-400 font-normal ml-1">(opsional)</span>
            </Label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Contoh: 1234567890"
              className={inputCls}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="outline" className="flex-1 rounded-lg" onClick={onClose}>
            Batal
          </Button>
          <Button
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
            onClick={handleAdd}
            disabled={!label.trim()}
          >
            Tambah
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CampaignFormView({
  campaignForm, setCampaignForm, editingCampaign, submitting, onSave, onBack, session, mode = 'create',
}: CampaignFormViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const isLocked = mode === 'complete-from-proposal'

  const [adminProfile, setAdminProfile] = useState<{
    name?: string; email?: string; phone?: string; address?: string
  } | null>(null)

  useEffect(() => {
    if (mode !== 'create') return
    fetch('/api/user/profile')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setAdminProfile({
            name: d.user.name,
            email: d.user.email,
            phone: d.user.phone,
            address: d.user.address,
          })
        }
      })
      .catch(() => { /* silent, fallback ke session */ })
  }, [mode])

  // Gabungan logika pengecekan dari HEAD (lokal) & origin (remote)
  const creatorInfo = isLocked
    ? {
      name: campaignForm.proposerName,
      email: campaignForm.proposerEmail,
      phone: campaignForm.proposerPhone,
      address: campaignForm.proposerAddress,
    }
    : editingCampaign
      ? {
        name: editingCampaign.creator?.name,
        email: editingCampaign.creator?.email,
        phone: editingCampaign.creator?.phone,
        address: editingCampaign.creator?.address,
      }
      : {
        name: adminProfile?.name ?? session?.user?.name,
        email: adminProfile?.email ?? session?.user?.email,
        phone: adminProfile?.phone ?? session?.user?.phone,
        address: adminProfile?.address ?? session?.user?.address,
      }

  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<{ url: string; isExisting: boolean }[]>(
    campaignForm.images?.map(url => ({ url, isExisting: true })) || []
  )

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const newPreviews = files.map(f => ({ url: URL.createObjectURL(f), isExisting: false }))
    setImageFiles(prev => [...prev, ...files])
    setImagePreviews(prev => [...prev, ...newPreviews])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveImage = (index: number) => {
    const removed = imagePreviews[index]
    setImagePreviews(prev => prev.filter((_, i) => i !== index))

    if (removed.isExisting) {
      setCampaignForm({
        ...campaignForm,
        images: (campaignForm.images || []).filter(url => url !== removed.url),
      })
    } else {
      const newFileIndex = imagePreviews.slice(0, index).filter(p => !p.isExisting).length
      setImageFiles(prev => prev.filter((_, i) => i !== newFileIndex))
    }
  }

  const qrisInputRef = useRef<HTMLInputElement>(null)
  const [qrisFile, setQrisFile] = useState<File | null>(null)
  const [qrisPreview, setQrisPreview] = useState<string | null>(campaignForm.qrisImageUrl || null)

  const handleQrisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setQrisFile(file)
    setQrisPreview(URL.createObjectURL(file))
    if (qrisInputRef.current) qrisInputRef.current.value = ''
  }

  const handleRemoveQris = () => {
    setQrisFile(null)
    setQrisPreview(null)
    setCampaignForm({ ...campaignForm, qrisImageUrl: '' })
  }

  const handleAddPayment = (label: string, accountNumber: string) => {
    const key = `method_${Date.now()}`
    setCampaignForm({
      ...campaignForm,
      paymentMethods: [...campaignForm.paymentMethods, { key, label, accountNumber, isVisible: true }],
    })
  }

  const handleRemovePayment = (key: string) => {
    setCampaignForm({
      ...campaignForm,
      paymentMethods: campaignForm.paymentMethods.filter(m => m.key !== key),
    })
  }

  const handleSetAccount = (key: string, val: string) => {
    setCampaignForm({
      ...campaignForm,
      paymentMethods: campaignForm.paymentMethods.map(m =>
        m.key === key ? { ...m, accountNumber: val } : m
      ),
    })
  }

  const handleSetLabel = (key: string, val: string) => {
    setCampaignForm({
      ...campaignForm,
      paymentMethods: campaignForm.paymentMethods.map(m =>
        m.key === key ? { ...m, label: val } : m
      ),
    })
  }

  const handleToggleVisible = (key: string) => {
    setCampaignForm({
      ...campaignForm,
      paymentMethods: campaignForm.paymentMethods.map(m =>
        m.key === key ? { ...m, isVisible: !m.isVisible } : m
      ),
    })
  }

  const formatThousands = (rawDigits: string) => {
    if (!rawDigits) return ''
    return Number(rawDigits).toLocaleString('id-ID')
  }

  const handleTargetAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '')
    setCampaignForm({ ...campaignForm, targetAmount: rawDigits })
  }

  return (
    <>
      {showAddModal && (
        <AddPaymentModal
          onAdd={handleAddPayment}
          onClose={() => setShowAddModal(false)}
        />
      )}

      <Card className="shadow-sm border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            {isLocked ? 'Lengkapi & Publikasikan Campaign' : editingCampaign ? 'Edit Campaign' : 'Campaign Baru'}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-lg" onClick={onBack}>
              Kembali
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-6"
              onClick={() => onSave(imageFiles.length > 0 ? imageFiles : undefined, qrisFile ?? undefined)}
              disabled={submitting}
            >
              {submitting ? 'Menyimpan...' : isLocked ? 'Publikasikan' : 'Simpan'}
            </Button>
          </div>
        </CardHeader>

        {isLocked && (
          <div className="mx-6 mb-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
            Data ini berasal dari proposal yang sudah disetujui dan tidak dapat diubah di sini.
            Lengkapi metode pembayaran{campaignForm.dropOffLocation !== undefined ? ' dan alamat donasi barang' : ''} di bawah untuk mempublikasikan campaign ke publik.
          </div>
        )}

        <CardContent className="space-y-8">

          {/* Section 1: Informasi Pembuat */}
          <section>
            <SectionTitle>Informasi Pembuat</SectionTitle>
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Nama', value: creatorInfo.name },
                  { label: 'Email', value: creatorInfo.email },
                  { label: 'No Telp', value: creatorInfo.phone },
                  { label: 'Alamat', value: creatorInfo.address },
                ].map(({ label, value }) => (
                  <div key={label} className="space-y-1">
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    <p className="text-sm font-medium text-gray-700">
                      {value || <span className="text-gray-300 italic">Belum diisi</span>}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-full bg-teal-400 shrink-0" />
                {isLocked
                  ? 'Data diambil dari proposal yang diajukan donatur.'
                  : editingCampaign
                    ? 'Data diambil dari profil pembuat campaign ini (admin atau donatur pengaju proposal).'
                    : 'Data diambil dari profil akun admin yang sedang login. Ubah di halaman Profil.'}
              </p>
            </div>
          </section>

          {/* Section 2: Informasi Campaign */}
          <section>
            <SectionTitle>Informasi Campaign</SectionTitle>
            <div className="space-y-4">

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Judul</Label>
                <Input
                  value={campaignForm.title}
                  onChange={(e) => setCampaignForm({ ...campaignForm, title: e.target.value })}
                  placeholder="Ketik di sini"
                  className={inputCls}
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Deskripsi</Label>
                <Textarea
                  value={campaignForm.description}
                  onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  placeholder="Ketik di sini"
                  rows={5}
                  className={inputCls}
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Lokasi
                  <span className="text-gray-400 font-normal ml-1">(opsional)</span>
                </Label>
                <Input
                  value={campaignForm.location ?? ''}
                  onChange={(e) => setCampaignForm({ ...campaignForm, location: e.target.value })}
                  placeholder="Contoh: Semarang, Jawa Tengah"
                  className={inputCls}
                  disabled={isLocked}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Kategori</Label>
                  <Select value={campaignForm.category} onValueChange={(v) => setCampaignForm({ ...campaignForm, category: v })} disabled={isLocked}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Target Dana</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                      Rp
                    </span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={formatThousands(campaignForm.targetAmount)}
                      onChange={handleTargetAmountChange}
                      placeholder="Contoh: 300.000"
                      className={`${inputCls} pl-9`}
                      disabled={isLocked}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Tanggal Mulai</Label>
                  <Input
                    type="date"
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                    className={inputCls}
                    disabled={isLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Tanggal Selesai</Label>
                  <Input
                    type="date"
                    value={campaignForm.endDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                    className={inputCls}
                    disabled={isLocked}
                  />
                </div>
              </div>

              {/* Upload Foto Multiple */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Foto Campaign
                  <span className="text-gray-400 font-normal ml-1">(opsional, bisa lebih dari 1)</span>
                </Label>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {imagePreviews.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                        <img src={img.url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                        {!isLocked && (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button type="button" onClick={() => handleRemoveImage(i)}
                              className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors">
                              <X className="h-3.5 w-3.5 text-white" />
                            </button>
                          </div>
                        )}
                        {img.isExisting && (
                          <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">Tersimpan</span>
                        )}
                      </div>
                    ))}
                    {!isLocked && (
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer group">
                        <ImagePlus className="h-5 w-5 text-gray-300 group-hover:text-teal-500" />
                        <span className="text-[11px] text-gray-400 group-hover:text-teal-500">Tambah</span>
                      </button>
                    )}
                  </div>
                )}

                {imagePreviews.length === 0 && !isLocked && (
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-gray-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group">
                    <div className="w-10 h-10 rounded-full bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                      <ImagePlus className="h-5 w-5 text-gray-400 group-hover:text-teal-600" />
                    </div>
                    <p className="text-sm text-gray-500 group-hover:text-teal-600">Klik untuk upload foto</p>
                    <p className="text-xs text-gray-400">PNG, JPG, WEBP — maks. 2MB per foto</p>
                  </button>
                )}

                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp"
                  multiple className="hidden" onChange={handleImageChange} />
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-1">
                <Toggle
                  checked={campaignForm.isPublic}
                  onChange={() => {
                    const nowPublic = !campaignForm.isPublic
                    setCampaignForm({
                      ...campaignForm,
                      isPublic: nowPublic,
                      status: nowPublic ? 'active' : 'completed',
                    })
                  }}
                  label="Status Aktif"
                  description={campaignForm.isPublic
                    ? 'Campaign tampil di beranda donatur'
                    : 'Campaign dianggap selesai & disembunyikan dari beranda'}
                />
                <Toggle
                  checked={campaignForm.isUrgent}
                  onChange={() => setCampaignForm({ ...campaignForm, isUrgent: !campaignForm.isUrgent })}
                  label="Mendesak"
                  description="Tampilkan badge mendesak pada campaign"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Pembayaran */}
          <section>
            <SectionTitle>
              Pembayaran
              {isLocked && <span className="text-red-500 font-normal text-sm ml-2">— wajib diisi sebelum publikasi</span>}
            </SectionTitle>
            <div className="space-y-4">

              {/* Payment methods list */}
              <div className="space-y-2">
                {campaignForm.paymentMethods.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-6 flex flex-col items-center justify-center gap-1">
                    <p className="text-sm text-gray-400">Belum ada metode pembayaran.</p>
                    <p className="text-xs text-gray-300">Klik tombol di bawah untuk menambahkan.</p>
                  </div>
                )}

                {campaignForm.paymentMethods.map((method) => (
                  <div key={method.key} className="rounded-xl border border-teal-200 bg-teal-50/50 px-4 py-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={method.label}
                        onChange={(e) => handleSetLabel(method.key, e.target.value)}
                        placeholder="Nama Bank / E-Wallet"
                        className={`${inputCls} bg-white text-sm font-medium flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePayment(method.key)}
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors shrink-0"
                        title="Hapus metode ini"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-400" />
                      </button>
                    </div>
                    <Input
                      value={method.accountNumber}
                      onChange={(e) => handleSetAccount(method.key, e.target.value)}
                      placeholder="No. Rekening / No. HP"
                      className={`${inputCls} bg-white`}
                    />
                    <button
                      type="button"
                      onClick={() => handleToggleVisible(method.key)}
                      className="flex items-center gap-2 pt-1 group"
                    >
                      <span className={`shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${method.isVisible
                        ? 'bg-teal-600 border-teal-600'
                        : 'border-gray-300 bg-white'
                        }`}>
                        {method.isVisible && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      <span className={`text-xs transition-colors ${method.isVisible ? 'text-teal-600 font-medium' : 'text-gray-400'
                        }`}>
                        Tampilkan ke donatur
                      </span>
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all py-3 cursor-pointer group"
                >
                  <div className="w-5 h-5 rounded-full bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors shrink-0">
                    <Plus className="h-3 w-3 text-gray-400 group-hover:text-teal-600" />
                  </div>
                  <span className="text-sm text-gray-400 group-hover:text-teal-600 transition-colors">
                    Tambah metode pembayaran
                  </span>
                </button>
              </div>

              {/* Foto QRIS */}
              <div className="space-y-2 pt-2">
                <Label className="text-sm font-medium text-gray-700">
                  Foto QRIS
                  <span className="text-gray-400 font-normal ml-1">(opsional, untuk metode pembayaran QRIS)</span>
                </Label>

                {qrisPreview ? (
                  <div className="relative w-40 aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                    <img src={qrisPreview} alt="QRIS" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={handleRemoveQris}
                        className="w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors">
                        <X className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => qrisInputRef.current?.click()}
                    className="w-40 aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer group">
                    <ImagePlus className="h-5 w-5 text-gray-300 group-hover:text-teal-500" />
                    <span className="text-[11px] text-gray-400 group-hover:text-teal-500">Upload QRIS</span>
                  </button>
                )}

                <input ref={qrisInputRef} type="file" accept="image/png,image/jpeg,image/webp"
                  className="hidden" onChange={handleQrisChange} />
                <p className="text-xs text-gray-400">Foto QR code yang di-generate dari aplikasi bank/e-wallet admin.</p>
              </div>

              {/* Alamat Donasi Barang */}
              <div className="space-y-2 pt-2">
                <Label className="text-sm font-medium text-gray-700">
                  Alamat Tujuan Donasi Barang
                  <span className="text-gray-400 font-normal ml-1">(opsional, isi jika campaign menerima donasi barang)</span>
                </Label>
                <Textarea
                  value={campaignForm.dropOffLocation ?? ''}
                  onChange={(e) => setCampaignForm({ ...campaignForm, dropOffLocation: e.target.value })}
                  placeholder="Contoh: Sekretariat Polines Care, Jl. Prof. Sudarto No.9, Tembalang, Semarang"
                  rows={2}
                  className={inputCls}
                />
              </div>

              {/* Kode Unik */}
              <div className="space-y-2 pt-2">
                <Label className="text-sm font-medium text-gray-700">Kode Unik Transfer (3 digit)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={0}
                    max={999}
                    value={campaignForm.uniqueCode}
                    onChange={(e) => setCampaignForm({ ...campaignForm, uniqueCode: e.target.value })}
                    placeholder="000"
                    className={`${inputCls} w-32`}
                  />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Kode unik 3 digit untuk identifikasi transfer. Contoh: kode{' '}
                    <span className="font-semibold text-violet-600">010</span>, donasi 200.000 → transfer{' '}
                    <span className="font-semibold text-violet-600">200.010</span>
                  </p>
                </div>
              </div>

            </div>
          </section>

        </CardContent>
      </Card>
    </>
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