'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Camera, Save, User, Mail, Phone, MapPin, Shield, CheckCircle, Loader2, Eye, EyeOff, Lock } from 'lucide-react'

interface ProfileData {
    id: string
    name: string
    email: string
    phone?: string | null
    avatar?: string | null
    address?: string | null
    role: string
    isVerified?: boolean
    createdAt?: string
}

export function AdminProfileTab() {
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [savingPassword, setSavingPassword] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')
    const [errorMsg, setErrorMsg] = useState('')
    const [passwordSuccess, setPasswordSuccess] = useState('')
    const [passwordError, setPasswordError] = useState('')

    const [form, setForm] = useState({
        name: '',
        phone: '',
        address: '',
        avatar: '',
        email: '',
    })

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    })

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/user/profile')
            .then(r => r.json())
            .then(d => {
                if (d.user) {
                    setProfile(d.user)
                    setForm({
                        name: d.user.name || '',
                        phone: d.user.phone || '',
                        address: d.user.address || '',
                        avatar: d.user.avatar || '',
                        email: d.user.email || '',
                    })
                    setAvatarPreview(d.user.avatar || null)
                }
            })
            .finally(() => setLoading(false))
    }, [])

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            const result = ev.target?.result as string
            setAvatarPreview(result)
            setForm(prev => ({ ...prev, avatar: result }))
        }
        reader.readAsDataURL(file)
    }

    const handleSave = async () => {
        if (!form.name.trim()) {
            setErrorMsg('Nama tidak boleh kosong')
            return
        }
        setSaving(true)
        setErrorMsg('')
        setSuccessMsg('')
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name.trim(),
                    phone: form.phone || null,
                    address: form.address || null,
                    avatar: form.avatar || null,
                    email: form.email || null,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Gagal menyimpan')
            setProfile(data.user)
            setSuccessMsg('Profil berhasil diperbarui')
            setTimeout(() => setSuccessMsg(''), 3000)
        } catch (err: any) {
            setErrorMsg(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleChangePassword = async () => {
        setPasswordError('')
        setPasswordSuccess('')
        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setPasswordError('Semua field password harus diisi')
            return
        }
        if (passwordForm.newPassword.length < 8) {
            setPasswordError('Password baru minimal 8 karakter')
            return
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Konfirmasi password tidak cocok')
            return
        }
        setSavingPassword(true)
        try {
            const res = await fetch('/api/user/profile/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Gagal mengubah password')
            setPasswordSuccess('Password berhasil diubah')
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
            setTimeout(() => setPasswordSuccess(''), 3000)
        } catch (err: any) {
            setPasswordError(err.message)
        } finally {
            setSavingPassword(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            </div>
        )
    }

    if (!profile) return null

    const initials = profile.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

    return (
        <div className="space-y-6">

            {/* Avatar + Info */}
            <div className="bg-white rounded-xl border p-6">
                <div className="flex items-center gap-5">
                    <div className="relative group">
                        <Avatar className="h-20 w-20 ring-2 ring-teal-100">
                            {avatarPreview
                                ? <AvatarImage src={avatarPreview} alt={profile.name} className="object-cover" />
                                : null}
                            <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <Camera className="h-5 w-5 text-white" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{profile.name}</h2>
                        <p className="text-sm text-gray-500">{profile.email}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                            <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-xs">
                                <Shield className="h-3 w-3 mr-1" /> Admin
                            </Badge>
                            {profile.isVerified && (
                                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" /> Terverifikasi
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                    Klik foto untuk mengganti avatar. Format JPG, PNG, maks 2MB.
                </p>
            </div>

            {/* Form Profil */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
                <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Informasi Profil</h3>

                {successMsg && (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" /> {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {errorMsg}
                    </div>
                )}

                <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" /> Nama Lengkap
                    </Label>
                    <Input
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Nama lengkap"
                    />
                </div>

                <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> Email
                    </Label>
                    <Input
                        value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="email@contoh.com"
                        type="email"
                    />
                </div>

                <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" /> No. Telepon
                    </Label>
                    <Input
                        value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="08xx-xxxx-xxxx"
                    />
                </div>

                <div className="space-y-1">
                    <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> Alamat (Tujuan Drop Donasi Barang)
                    </Label>
                    <Textarea
                        value={form.address}
                        onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                        placeholder="Masukkan alamat lengkap sebagai tujuan pengiriman donasi barang..."
                        rows={3}
                        className="resize-none"
                    />
                    <p className="text-xs text-gray-400">
                        Alamat ini akan ditampilkan kepada donatur sebagai tujuan pengiriman donasi barang.
                    </p>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                >
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
            </div>

            {/* Ganti Password */}
            <div className="bg-white rounded-xl border p-6 space-y-4">
                <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Keamanan Akun</h3>

                {passwordSuccess && (
                    <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" /> {passwordSuccess}
                    </div>
                )}
                {passwordError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {passwordError}
                    </div>
                )}

                {(['current', 'new', 'confirm'] as const).map((key) => {
                    const labels = {
                        current: 'Password Saat Ini',
                        new: 'Password Baru',
                        confirm: 'Konfirmasi Password Baru',
                    }
                    const fields = {
                        current: 'currentPassword',
                        new: 'newPassword',
                        confirm: 'confirmPassword',
                    } as const
                    return (
                        <div key={key} className="space-y-1">
                            <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5" /> {labels[key]}
                            </Label>
                            <div className="relative">
                                <Input
                                    type={showPasswords[key] ? 'text' : 'password'}
                                    value={passwordForm[fields[key]]}
                                    onChange={e => setPasswordForm(p => ({ ...p, [fields[key]]: e.target.value }))}
                                    placeholder="••••••••"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(p => ({ ...p, [key]: !p[key] }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPasswords[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    )
                })}

                <Button
                    onClick={handleChangePassword}
                    disabled={savingPassword}
                    variant="outline"
                    className="w-full border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                    {savingPassword ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                    {savingPassword ? 'Mengubah...' : 'Ubah Password'}
                </Button>
            </div>

        </div>
    )
}