'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Mail, Phone, MapPin, Camera, Edit2, Save, X,
  Calendar, Heart, TrendingUp, BadgeCheck, Trash2,
  KeyRound, Eye, EyeOff, Send,
} from 'lucide-react'
import type { Donation } from '../types'
import { formatRupiah, formatDate } from '../types'

interface ProfilForm {
  name: string
  phone: string
  address: string
}

interface ProfilDonaturProps {
  session: any
  userDonations: Donation[]
}

function getBadgeLevel(totalApproved: number) {
  if (totalApproved >= 20) return { label: 'Donatur Legendaris', color: 'bg-purple-100 text-purple-700', icon: '👑' }
  if (totalApproved >= 10) return { label: 'Donatur Setia', color: 'bg-amber-100 text-amber-700', icon: '🏆' }
  if (totalApproved >= 5) return { label: 'Donatur Aktif', color: 'bg-teal-100 text-teal-700', icon: '⭐' }
  if (totalApproved >= 1) return { label: 'Donatur Baru', color: 'bg-blue-100 text-blue-700', icon: '🌱' }
  return { label: 'Belum Berdonasi', color: 'bg-gray-100 text-gray-600', icon: '👤' }
}

export function ProfilDonatur({ session, userDonations }: ProfilDonaturProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Profil state ──
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [joinDate, setJoinDate] = useState<string>(new Date().toISOString())

  // Avatar: savedAvatar = yang sudah tersimpan ke DB, draftAvatar = perubahan sementara saat editing
  const [savedAvatar, setSavedAvatar] = useState<string | null>(null)
  const [draftAvatar, setDraftAvatar] = useState<string | null>(null)  // null = hapus, string = url baru
  const [draftAvatarFile, setDraftAvatarFile] = useState<File | null>(null)
  // const [avatarHovered, setAvatarHovered] = useState(false)

  const [savedForm, setSavedForm] = useState<ProfilForm>({ name: '', phone: '', address: '' })
  const [form, setForm] = useState<ProfilForm>({ name: '', phone: '', address: '' })
  const set = (key: keyof ProfilForm, val: string) => setForm(prev => ({ ...prev, [key]: val }))

  // Avatar yang ditampilkan: saat editing tampilkan draft, saat tidak tampilkan saved
  const displayAvatar = editing ? draftAvatar : savedAvatar

  // ── Password state ──
  const [changingPassword, setChangingPassword] = useState(false)
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [showPw, setShowPw] = useState({ old: false, new: false, confirm: false })
  const setPw = (key: keyof typeof pwForm, val: string) => setPwForm(prev => ({ ...prev, [key]: val }))

  // ── Forgot password state ──
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState('')

  // ── Load profil ──
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const { user } = await res.json()
          const f = { name: user.name ?? '', phone: user.phone ?? '', address: user.address ?? '' }
          setForm(f)
          setSavedForm(f)
          if (user.avatar) setSavedAvatar(user.avatar)
          if (user.createdAt) setJoinDate(user.createdAt)
        }
      } catch { /* fallback ke session */ }
    }
    fetchProfile()
  }, [])

  // ── Stats ──
  const approvedDonations = userDonations.filter(d => d.status === 'approved')
  const pendingDonations = userDonations.filter(d => d.status === 'pending')
  const totalNominal = approvedDonations
    .filter(d => d.type !== 'barang')
    .reduce((s, d) => s + Number(d.amount), 0)
  const badgeLevel = getBadgeLevel(approvedDonations.length)

  const recentDonations = [...userDonations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // ── Edit: buka mode editing, inisialisasi draft dari saved ──
  const handleStartEdit = () => {
    setForm({ ...savedForm })
    setDraftAvatar(savedAvatar)
    setDraftAvatarFile(null)
    setEditing(true)
  }

  // ── Draft avatar: pilih file (belum upload, simpan dulu sebagai preview lokal) ──
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDraftAvatarFile(file)
    setDraftAvatar(URL.createObjectURL(file))
    // reset input supaya bisa pilih file yang sama lagi
    e.target.value = ''
  }

  // ── Draft avatar: hapus (set null = akan dihapus saat simpan) ──
  const handleRemoveDraftAvatar = () => {
    setDraftAvatar(null)
    setDraftAvatarFile(null)
  }

  // ── Simpan profil ──
  const handleSave = async () => {
    if (!form.name.trim()) { alert('Nama tidak boleh kosong'); return }
    setLoading(true)
    try {
      let finalAvatarUrl = draftAvatar

      // Upload file baru ke server kalau ada
      if (draftAvatarFile) {
        const formData = new FormData()
        formData.append('file', draftAvatarFile)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          finalAvatarUrl = url
        }
      }

      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, phone: form.phone, address: form.address, avatar: finalAvatarUrl }),
      })

      if (!res.ok) { const { error } = await res.json(); alert(error || 'Gagal menyimpan'); return }

      // Commit ke saved state
      setSavedAvatar(finalAvatarUrl)
      setDraftAvatar(finalAvatarUrl)
      setDraftAvatarFile(null)
      setSavedForm({ ...form })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 3000)
    } catch { alert('Terjadi kesalahan') }
    finally { setLoading(false) }
  }

  // ── Batal edit: kembalikan semua ke saved state ──
  const handleCancel = () => {
    setForm({ ...savedForm })
    setDraftAvatar(savedAvatar)
    setDraftAvatarFile(null)
    setEditing(false)
  }

  // ── Ganti password ──
  const handleChangePassword = async () => {
    setPwError('')
    if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      setPwError('Semua field wajib diisi'); return
    }
    if (pwForm.newPassword.length < 6) {
      setPwError('Password baru minimal 6 karakter'); return
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('Konfirmasi password tidak cocok'); return
    }
    setPwLoading(true)
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword }),
      })
      if (!res.ok) { const { error } = await res.json(); setPwError(error || 'Gagal mengganti password'); return }
      setPwSuccess(true)
      setChangingPassword(false)
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPwSuccess(false), 3000)
    } catch { setPwError('Terjadi kesalahan') }
    finally { setPwLoading(false) }
  }

  const handleCancelPassword = () => {
    setChangingPassword(false)
    setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
    setPwError('')
  }

  // ── Lupa password: kirim reset email ──
  const handleForgotPassword = async () => {
    setForgotLoading(true)
    setForgotError('')
    try {
      const email = session?.user?.email
      if (!email) { setForgotError('Email tidak ditemukan'); return }
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) { const { error } = await res.json(); setForgotError(error || 'Gagal mengirim email'); return }
      setForgotSent(true)
      setTimeout(() => setForgotSent(false), 10000)
    } catch { setForgotError('Terjadi kesalahan') }
    finally { setForgotLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Notif sukses */}
      {saved && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-2 text-sm text-teal-700">
          <BadgeCheck className="h-4 w-4 shrink-0" /> Profil berhasil disimpan!
        </div>
      )}
      {pwSuccess && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-2 text-sm text-teal-700">
          <BadgeCheck className="h-4 w-4 shrink-0" /> Password berhasil diubah!
        </div>
      )}

      {/* ── Card Profil Utama ── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

            {/* Avatar */}
            <div className="relative shrink-0 group">
              <Avatar className="h-20 w-20">
                {displayAvatar && <AvatarImage src={displayAvatar} alt="avatar" />}
                <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl font-bold">
                  {form.name?.charAt(0).toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>

              {editing && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    title="Ganti foto"
                    className="w-7 h-7 rounded-full bg-white/20 active:bg-white/40 hover:bg-white/40 flex items-center justify-center transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-3.5 w-3.5 text-white" />
                  </button>
                  {draftAvatar && (
                    <button
                      type="button"
                      title="Hapus foto"
                      className="w-7 h-7 rounded-full bg-white/20 active:bg-red-500/70 hover:bg-red-500/70 flex items-center justify-center transition-colors"
                      onClick={handleRemoveDraftAvatar}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-white" />
                    </button>
                  )}
                </div>
              )}

              {/* Indikator ada perubahan foto yang belum disimpan */}
              {editing && draftAvatarFile && (
                <span className="absolute -bottom-1 -right-1 text-[10px] bg-amber-400 text-white rounded-full px-1.5 py-0.5 font-medium leading-none">
                  baru
                </span>
              )}
              {editing && !draftAvatar && savedAvatar && (
                <span className="absolute -bottom-1 -right-1 text-[10px] bg-red-400 text-white rounded-full px-1.5 py-0.5 font-medium leading-none">
                  hapus
                </span>
              )}

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
            </div>

            {/* Nama + email + badge */}
            <div className="flex-1 text-center sm:text-left space-y-1">
              <h2 className="text-xl font-bold">{savedForm.name || session?.user?.name}</h2>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mt-1">
                <Badge variant="secondary">
                  {session?.user?.role === 'donatur' ? 'Donatur' : 'Admin'}
                </Badge>
                <Badge className={badgeLevel.color}>
                  {badgeLevel.icon} {badgeLevel.label}
                </Badge>
              </div>
            </div>

            {/* Tombol Edit / Simpan */}
            {!editing ? (
              <Button variant="outline" size="sm" className="shrink-0" onClick={handleStartEdit}>
                <Edit2 className="h-4 w-4 mr-1.5" /> Edit Profil
              </Button>
            ) : (
              <div className="flex gap-2 shrink-0">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSave} disabled={loading}>
                  <Save className="h-4 w-4 mr-1" /> {loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} disabled={loading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <Separator className="my-5" />

          {/* Form Edit / Info Display */}
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Nama Lengkap</Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" /> No. Telepon
                </Label>
                <Input placeholder="08xxxxxxxxxx" value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="flex items-center gap-1.5 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Alamat
                </Label>
                <Input placeholder="Alamat lengkap" value={form.address} onChange={e => set('address', e.target.value)} />
              </div>
              {/* Email — read-only */}
              <div className="space-y-2 sm:col-span-2">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
                </Label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-md text-sm text-muted-foreground">
                  <span className="flex-1">{session?.user?.email}</span>
                  <span className="text-xs bg-gray-200 text-gray-500 rounded px-1.5 py-0.5">Tidak dapat diubah</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span>{session?.user?.email ?? '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0" />
                <span>{savedForm.phone || 'Belum diisi'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{savedForm.address || 'Belum diisi'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Bergabung sejak {formatDate(joinDate)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Keamanan Akun (Password) ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-teal-600" /> Keamanan Akun
            </CardTitle>
            {!changingPassword && (
              <Button variant="outline" size="sm" onClick={() => setChangingPassword(true)}>
                Ganti Password
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Lupa password */}
          {!changingPassword && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Lupa password?</p>
                <p className="text-xs text-muted-foreground">
                  Kirim link reset ke <span className="font-medium">{session?.user?.email}</span>
                </p>
              </div>
              {forgotSent ? (
                <div className="flex items-center gap-1.5 text-teal-600 text-sm">
                  <BadgeCheck className="h-4 w-4" /> Email terkirim!
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700 hover:bg-teal-50" onClick={handleForgotPassword} disabled={forgotLoading}>
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {forgotLoading ? 'Mengirim...' : 'Kirim Email'}
                </Button>
              )}
            </div>
          )}
          {forgotError && (
            <p className="text-xs text-red-500">{forgotError}</p>
          )}

          {/* Form ganti password */}
          {changingPassword && (
            <>
              {pwError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {pwError}
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-sm">Password Lama</Label>
                <div className="relative">
                  <Input type={showPw.old ? 'text' : 'password'} placeholder="Masukkan password lama" value={pwForm.oldPassword} onChange={e => setPw('oldPassword', e.target.value)} className="pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(p => ({ ...p, old: !p.old }))}>
                    {showPw.old ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Password Baru</Label>
                <div className="relative">
                  <Input type={showPw.new ? 'text' : 'password'} placeholder="Minimal 6 karakter" value={pwForm.newPassword} onChange={e => setPw('newPassword', e.target.value)} className="pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}>
                    {showPw.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Input type={showPw.confirm ? 'text' : 'password'} placeholder="Ulangi password baru" value={pwForm.confirmPassword} onChange={e => setPw('confirmPassword', e.target.value)} className="pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}>
                    {showPw.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white" size="sm" onClick={handleChangePassword} disabled={pwLoading}>
                  {pwLoading ? 'Menyimpan...' : 'Simpan Password'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelPassword} disabled={pwLoading}>
                  Batal
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}