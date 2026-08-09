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

// Metode pembayaran yang pernah diinput sebelumnya (dari campaign-campaign lain),
// dipakai untuk mengisi dropdown "pilih dari yang sudah ada" di AddPaymentModal.
interface SavedPaymentMethod {
  label: string
  accountNumber: string
}

// (opsi "tambah metode baru" sekarang berupa link terpisah, bukan lagi
// item khusus di dalam dropdown Select — lihat switchToManual di PaymentMethodAdder)

interface CampaignFormViewProps {
  campaignForm: {
    title: string; description: string; category: string; targetAmount: string
    startDate: string; endDate: string; isUrgent: boolean; isPublic: boolean
    paymentMethods: PaymentMethod[]
    qrisImageUrl?: string
    // ⬅ FIX: uniqueCode sekarang HANYA dipakai untuk DITAMPILKAN (read-only),
    // bukan diinput admin. Nilainya datang dari data campaign yang sudah ada
    // (editingCampaign?.uniqueCode) — server yang men-generate ini otomatis,
    // form tidak pernah mengirim field ini saat create/update.
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

// Form inline untuk menambah metode pembayaran — tanpa modal/overlay,
// tampil langsung di dalam section Pembayaran (konsep sama seperti
// dropdown Organisasi: pilih dari yang sudah ada, atau tambah baru).
function PaymentMethodAdder({
  onAdd,
  onSaveError,
  existingMethods,
}: {
  onAdd: (label: string, accountNumber: string) => void
  // ⬅ FIX: error simpan-untuk-reuse sekarang di-lift ke parent (ditampilkan
  // sebagai banner sementara di section Pembayaran), BUKAN lagi mengganjal
  // form ini supaya tetap terbuka. Bank yang baru ditambah tetap langsung
  // kepakai di campaign ini apapun hasil simpan-untuk-reuse-nya.
  onSaveError: (message: string) => void
  // ⬅ FIX: bank/e-wallet yang SUDAH dipakai di campaign yang sedang diisi
  // ini. Dipakai untuk (1) menyembunyikan pilihan itu dari dropdown "pilih
  // dari yang sudah pernah dipakai" supaya tidak bisa dipilih dua kali,
  // dan (2) mencegah input manual dari membuat duplikat.
  existingMethods: { label: string; accountNumber: string }[]
}) {
  const [isAdding, setIsAdding] = useState(false)
  // 'dropdown' = cuma pilih dari daftar tersimpan, 'manual' = form input bebas
  const [subMode, setSubMode] = useState<'dropdown' | 'manual'>('dropdown')
  const [selectedValue, setSelectedValue] = useState('')
  const [label, setLabel] = useState('')
  const [accountNumber, setAccountNumber] = useState('')

  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([])
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/payment-methods')
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        if (cancelled) return
        const list: SavedPaymentMethod[] = Array.isArray(data)
          ? data
            .map((m: any) => ({
              label: m.label ?? m.name ?? '',
              accountNumber: m.accountNumber ?? m.account_number ?? '',
            }))
            .filter((m: SavedPaymentMethod) => m.label)
          : []
        const unique = list.filter((m, i) =>
          i === list.findIndex(x => x.label === m.label && x.accountNumber === m.accountNumber)
        )
        setSavedMethods(unique)
        // Kalau ternyata belum ada satupun metode tersimpan yang BISA dipilih
        // (semua sudah kepakai di campaign ini, atau memang belum ada history
        // sama sekali), langsung ke form manual — dropdown kosong tidak
        // berguna.
        const stillSelectable = unique.filter(
          m => !existingMethods.some(e => e.label === m.label && e.accountNumber === m.accountNumber)
        )
        if (stillSelectable.length === 0) setSubMode('manual')
      })
      .catch(() => setSubMode('manual'))
      .finally(() => { if (!cancelled) setLoadingSaved(false) })
    return () => { cancelled = true }
  }, [])

  const encode = (m: SavedPaymentMethod) => `${m.label}|||${m.accountNumber}`

  // ⬅ FIX: bank yang sudah ada di daftar campaign ini disembunyikan dari
  // dropdown, supaya tidak bisa dipilih dua kali dan bikin duplikat.
  const isAlreadyUsed = (m: SavedPaymentMethod) =>
    existingMethods.some(e => e.label === m.label && e.accountNumber === m.accountNumber)
  const selectableMethods = savedMethods.filter(m => !isAlreadyUsed(m))

  const resetAll = () => {
    setSelectedValue('')
    setLabel('')
    setAccountNumber('')
    setSubMode(selectableMethods.length > 0 ? 'dropdown' : 'manual')
  }

  const handleClose = () => {
    resetAll()
    setIsAdding(false)
  }

  const handleSelectChange = (v: string) => {
    setSelectedValue(v)
  }

  // ⬅ FIX: link terpisah untuk pindah ke form manual, menggantikan opsi
  // "+ Metode baru / lainnya" yang sebelumnya ada DI DALAM dropdown Select
  // (membingungkan karena bercampur dengan pilihan bank asli).
  const switchToManual = () => {
    setSubMode('manual')
    setSelectedValue('')
    setLabel('')
    setAccountNumber('')
  }

  const handleAddFromDropdown = () => {
    if (!selectedValue) return
    const [l, ...rest] = selectedValue.split('|||')
    onAdd(l, rest.join('|||'))
    handleClose()
  }

  // ⬅ FIX: sebelumnya fungsi ini TIDAK menunggu (await) hasil fetch dan
  // TIDAK mengecek response.ok — jadi setSavedMethods selalu dijalankan
  // meskipun POST ke server gagal (mis. 401 karena session admin belum
  // ke-attach, atau 500 di server). Akibatnya:
  //   - Di campaign yang sedang dibuka, bank baru kelihatan "tersimpan"
  //     di dropdown karena itu cuma state React di browser.
  //   - Begitu buka form campaign baru (component di-mount ulang),
  //     dropdown kosong lagi karena GET /api/payment-methods memang
  //     tidak pernah menemukan data itu di database.
  // Sekarang: tunggu response server, dan HANYA update state lokal kalau
  // benar-benar berhasil tersimpan. Kalau gagal, tampilkan pesan error
  // supaya ketahuan (bukan silent-fail lagi).
  const handleAddManual = async () => {
    if (!label.trim() || !accountNumber.trim()) return
    const trimmedLabel = label.trim()
    const trimmedAccount = accountNumber.trim()

    // ⬅ FIX: cegah duplikat — kalau kombinasi ini sudah ada di daftar
    // campaign yang sedang diisi, jangan tambah lagi, cukup kasih tahu.
    const alreadyInThisCampaign = existingMethods.some(
      e => e.label === trimmedLabel && e.accountNumber === trimmedAccount
    )
    if (alreadyInThisCampaign) {
      onSaveError(`"${trimmedLabel}"${trimmedAccount ? ` (${trimmedAccount})` : ''} sudah ada di daftar pembayaran campaign ini.`)
      handleClose()
      return
    }

    const isNewCombo = !savedMethods.some(
      m => m.label === trimmedLabel && m.accountNumber === trimmedAccount
    )

    // Method tetap langsung dipakai di campaign yang sedang diisi,
    // terlepas dari berhasil/tidaknya disimpan untuk dipakai lagi nanti.
    onAdd(trimmedLabel, trimmedAccount)
    // ⬅ FIX: form SELALU ditutup di sini — jangan digantung menunggu hasil
    // simpan-untuk-reuse. Sebelumnya form dibiarkan terbuka kalau gagal,
    // sehingga field yang sudah kepakai kelihatan "nyangkut" dan
    // membingungkan (terlihat seperti terduplikasi dengan entri di atas).
    handleClose()

    if (!isNewCombo) return

    setSaving(true)
    try {
      const res = await fetch('/api/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: trimmedLabel, accountNumber: trimmedAccount }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Gagal simpan payment method:', res.status, err)
        const serverMsg = typeof err?.error === 'string' ? err.error : null
        onSaveError(
          res.status === 401
            ? `Gagal menyimpan "${trimmedLabel}": sesi login bermasalah. Coba refresh halaman. (401)`
            : `Gagal menyimpan "${trimmedLabel}" (status ${res.status})${serverMsg ? `: ${serverMsg}` : ''}. Metode tetap dipakai di campaign ini.`
        )
        return
      }

      // Baru update daftar tersimpan KALAU beneran sukses di server.
      setSavedMethods(prev => [...prev, { label: trimmedLabel, accountNumber: trimmedAccount }])
    } catch (e) {
      console.error('Network error saat simpan payment method:', e)
      onSaveError(`Gagal menyimpan "${trimmedLabel}" untuk dipakai lagi nanti (masalah jaringan). Metode tetap dipakai di campaign ini.`)
    } finally {
      setSaving(false)
    }
  }

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={() => setIsAdding(true)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all py-3 cursor-pointer group"
      >
        <div className="w-5 h-5 rounded-full bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors shrink-0">
          <Plus className="h-3 w-3 text-gray-400 group-hover:text-teal-600" />
        </div>
        <span className="text-sm text-gray-400 group-hover:text-teal-600 transition-colors">
          Tambah metode pembayaran
        </span>
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">Tambah Metode Pembayaran</p>
        <button
          type="button"
          onClick={handleClose}
          className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <X className="h-3 w-3 text-gray-500" />
        </button>
      </div>

      {subMode === 'dropdown' && (
        <>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Pilih dari yang sudah pernah dipakai
            </Label>
            <Select value={selectedValue} onValueChange={handleSelectChange}>
              <SelectTrigger className={`${inputCls} bg-white`}>
                <SelectValue placeholder={
                  loadingSaved
                    ? 'Memuat...'
                    : selectableMethods.length === 0
                      ? 'Semua sudah dipakai di campaign ini'
                      : 'Pilih rekening / e-wallet'
                } />
              </SelectTrigger>
              <SelectContent>
                {selectableMethods.map(m => (
                  <SelectItem key={encode(m)} value={encode(m)}>
                    {m.label}{m.accountNumber ? ` — ${m.accountNumber}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              type="button"
              onClick={switchToManual}
              className="text-xs text-teal-600 hover:underline"
            >
              + Metode baru / lainnya
            </button>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 rounded-lg bg-white" onClick={handleClose}>
              Batal
            </Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
              onClick={handleAddFromDropdown}
              disabled={!selectedValue}
            >
              Tambah
            </Button>
          </div>
        </>
      )}

      {subMode === 'manual' && (
        <>
          {selectableMethods.length > 0 && (
            <button
              type="button"
              onClick={() => { setSubMode('dropdown'); setLabel(''); setAccountNumber('') }}
              className="text-xs text-teal-600 hover:underline"
            >
              ‹ Pilih dari daftar yang sudah ada
            </button>
          )}

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              Nama Bank / E-Wallet <span className="text-red-400">*</span>
            </Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Contoh: Transfer Bank BSI, E-Wallet ShopeePay"
              className={`${inputCls} bg-white`}
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddManual() }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              No. Rekening / No. HP <span className="text-red-400">*</span>
            </Label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Contoh: 1234567890"
              className={`${inputCls} bg-white`}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddManual() }}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1 rounded-lg bg-white" onClick={handleClose}>
              Batal
            </Button>
            <Button
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg"
              onClick={handleAddManual}
              disabled={!label.trim() || !accountNumber.trim()}
            >
              Tambah
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export function CampaignFormView({
  campaignForm, setCampaignForm, editingCampaign, submitting, onSave, onBack, session, mode = 'create',
}: CampaignFormViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  // ⬅ FIX: banner sementara untuk melaporkan kalau simpan-untuk-reuse metode
  // pembayaran (agar bisa dipilih lagi di campaign lain) gagal. Ini tidak
  // menghalangi campaign yang sedang diisi — metode tetap terpakai di sini.
  const [paymentSaveWarning, setPaymentSaveWarning] = useState<string | null>(null)

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

  // ⬅ FIX: kode unik sekarang murni read-only, tidak lagi bisa diinput admin.
  // - Campaign baru (belum tersimpan sama sekali, editingCampaign null &
  //   bukan mode complete-from-proposal): kode belum ada, karena baru akan
  //   di-generate server SETELAH disimpan.
  // - Campaign yang sudah ada (sedang diedit, atau hasil approval proposal
  //   yang sedang dilengkapi): kode sudah di-assign otomatis oleh server
  //   sejak dibuat, tinggal ditampilkan apa adanya.
  const hasAssignedCode = Boolean(editingCampaign) || isLocked
  const displayCode = campaignForm.uniqueCode
    ? String(campaignForm.uniqueCode).padStart(3, '0')
    : '000'

  // ⬅ FIX: No. Rekening/No. HP sekarang wajib diisi untuk setiap metode
  // pembayaran (mencegah campaign kesimpan dengan data pembayaran yang
  // tidak lengkap / rawan miss saat donatur mau transfer).
  const hasIncompletePaymentMethod = campaignForm.paymentMethods.some(
    m => !m.accountNumber.trim()
  )

  return (
    <Card className="shadow-sm border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            {isLocked ? 'Lengkapi & Publikasikan Campaign' : editingCampaign ? 'Edit Campaign' : 'Campaign Baru'}
          </h2>
          <div className="flex flex-col items-end gap-1">
            <Button
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-6"
              onClick={() => onSave(imageFiles.length > 0 ? imageFiles : undefined, qrisFile ?? undefined)}
              disabled={submitting || hasIncompletePaymentMethod}
            >
              {submitting ? 'Menyimpan...' : isLocked ? 'Publikasikan' : 'Simpan'}
            </Button>
            {hasIncompletePaymentMethod && (
              <p className="text-xs text-red-500">Lengkapi No. Rekening/No. HP di semua metode pembayaran</p>
            )}
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
                      placeholder="No. Rekening / No. HP (wajib diisi)"
                      className={`${inputCls} bg-white ${!method.accountNumber.trim() ? 'border-red-300 focus:border-red-400 focus:ring-red-400' : ''}`}
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

                <PaymentMethodAdder
                  onAdd={handleAddPayment}
                  onSaveError={(msg) => setPaymentSaveWarning(msg)}
                  existingMethods={campaignForm.paymentMethods}
                />

                {paymentSaveWarning && (
                  <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
                    <p className="text-xs text-amber-700">{paymentSaveWarning}</p>
                    <button
                      type="button"
                      onClick={() => setPaymentSaveWarning(null)}
                      className="shrink-0 text-amber-500 hover:text-amber-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
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

              {/* Kode Unik — FIX: read-only, tidak lagi bisa diinput admin.
                  Server yang men-generate & menjamin keunikannya (lihat
                  src/lib/campaign-code.ts). Field ini hanya sebagai referensi
                  visual, tidak pernah dikirim balik ke server saat submit. */}
              <div className="space-y-2 pt-2">
                <Label className="text-sm font-medium text-gray-700">Kode Unik Transfer</Label>
                {hasAssignedCode ? (
                  <div className="flex items-center gap-3">
                    <div className={`${inputCls} w-32 flex items-center justify-center bg-gray-50 text-gray-700 font-mono font-semibold text-sm py-2 border`}>
                      {displayCode}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Dibuat otomatis oleh sistem saat campaign ini dibuat, tidak dapat diubah.
                      Contoh instruksi ke donatur: donasi 200.000 → transfer{' '}
                      <span className="font-semibold text-violet-600">200.{displayCode}</span>
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-3">
                    <p className="text-xs text-gray-500">
                      Kode unik akan dibuat otomatis oleh sistem setelah campaign ini disimpan.
                      Kamu tidak perlu mengisinya secara manual.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </section>

        </CardContent>
      </Card>
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