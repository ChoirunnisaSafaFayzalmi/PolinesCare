'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Mail, Phone, MapPin, Camera, Edit2, Save, X,
  Calendar, Trophy, Heart, TrendingUp, Star, BadgeCheck,
} from 'lucide-react'
import type { Donation } from './types'
import { formatRupiah, formatDate, getCategoryColor } from './types'

// ============================================================
// TYPES
// ============================================================
interface ProfilForm {
  name: string
  phone: string
  address: string
  bio: string
}

interface ProfilDonaturProps {
  session: any
  userDonations: Donation[]
}

// ============================================================
// BADGE LEVEL DONATUR
// ============================================================
function getBadgeLevel(totalApproved: number) {
  if (totalApproved >= 20) return { label: 'Donatur Legendaris', color: 'bg-purple-100 text-purple-700', icon: '👑' }
  if (totalApproved >= 10) return { label: 'Donatur Setia',      color: 'bg-amber-100 text-amber-700',  icon: '🏆' }
  if (totalApproved >= 5)  return { label: 'Donatur Aktif',      color: 'bg-teal-100 text-teal-700',    icon: '⭐' }
  if (totalApproved >= 1)  return { label: 'Donatur Baru',       color: 'bg-blue-100 text-blue-700',    icon: '🌱' }
  return                          { label: 'Belum Berdonasi',    color: 'bg-gray-100 text-gray-600',    icon: '👤' }
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export function ProfilDonatur({ session, userDonations }: ProfilDonaturProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [form, setForm] = useState<ProfilForm>({
    name: session?.user?.name ?? '',
    phone: (session?.user as any)?.phone ?? '',
    address: '',
    bio: '',
  })
  const [saved, setSaved] = useState(false)

  const set = (key: keyof ProfilForm, val: string) => setForm(prev => ({ ...prev, [key]: val }))

  // ── Stats ──
  const approvedDonations = userDonations.filter(d => d.status === 'approved')
  const pendingDonations  = userDonations.filter(d => d.status === 'pending')
  const totalNominal      = approvedDonations.reduce((s, d) => s + Number(d.amount), 0)
  const badgeLevel        = getBadgeLevel(approvedDonations.length)

  // ── Kategori favorit ──
  const categoryCount = approvedDonations.reduce<Record<string, number>>((acc, d) => {
    const cat = d.campaign?.category ?? 'Lainnya'
    acc[cat] = (acc[cat] ?? 0) + 1
    return acc
  }, {})
  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  // ── Donasi terbaru ──
  const recentDonations = [...userDonations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = () => {
    // nanti connect ke API
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleCancel = () => {
    setForm({
      name: session?.user?.name ?? '',
      phone: (session?.user as any)?.phone ?? '',
      address: '',
      bio: '',
    })
    setEditing(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* ── Notif tersimpan ── */}
      {saved && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-2 text-sm text-teal-700">
          <BadgeCheck className="h-4 w-4 shrink-0" />
          Profil berhasil disimpan!
        </div>
      )}

      {/* ── Card Profil Utama ── */}
      <Card>
        <CardContent className="p-6">

          {/* Avatar + Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">

            {/* Avatar dengan tombol ganti */}
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20">
                {avatarPreview
                  ? <AvatarImage src={avatarPreview} alt="avatar" />
                  : null
                }
                <AvatarFallback className="bg-teal-100 text-teal-700 text-2xl font-bold">
                  {form.name?.charAt(0).toUpperCase() ?? 'U'}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center hover:bg-teal-700 shadow-md"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Nama, email, badge */}
            <div className="flex-1 text-center sm:text-left space-y-1">
              <h2 className="text-xl font-bold">{form.name || session?.user?.name}</h2>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mt-1">
                <Badge variant="secondary">
                  {session?.user?.role === 'donatur' ? 'Donatur' : 'Admin'}
                </Badge>
                <Badge className={badgeLevel.color}>
                  {badgeLevel.icon} {badgeLevel.label}
                </Badge>
              </div>
              {form.bio && (
                <p className="text-sm text-muted-foreground mt-2 italic">"{form.bio}"</p>
              )}
            </div>

            {/* Tombol Edit */}
            {!editing ? (
              <Button variant="outline" size="sm" className="shrink-0" onClick={() => setEditing(true)}>
                <Edit2 className="h-4 w-4 mr-1.5" /> Edit Profil
              </Button>
            ) : (
              <div className="flex gap-2 shrink-0">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" /> Simpan
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel}>
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
                <Label className="flex items-center gap-1.5 text-sm">Nama Lengkap</Label>
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
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm">Bio / Tentang Saya</Label>
                <Textarea
                  placeholder="Ceritakan sedikit tentang dirimu..."
                  value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                  rows={2}
                  className="resize-none"
                />
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
                <span>{form.phone || 'Belum diisi'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>{form.address || 'Belum diisi'}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" />
                <span>Bergabung sejak {formatDate(new Date().toISOString())}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Ringkasan Donasi ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="h-4 w-4 text-teal-600" /> Ringkasan Donasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-teal-50">
              <p className="text-2xl font-bold text-teal-600">{userDonations.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Donasi</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-50">
              <p className="text-2xl font-bold text-emerald-600">{approvedDonations.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Disetujui</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-50">
              <p className="text-2xl font-bold text-amber-600">{pendingDonations.length}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pending</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50">
              <p className="text-lg font-bold text-blue-600 leading-tight">{formatRupiah(totalNominal)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Nominal</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Kategori Favorit + Donasi Terbaru ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Kategori Favorit */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" /> Kategori Favorit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {topCategories.map(([cat, count], i) => (
                  <div key={cat} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                      <Badge className={`text-xs ${getCategoryColor(cat)}`}>{cat}</Badge>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{count}x donasi</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Donasi Terbaru */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-teal-500" /> Donasi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentDonations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada donasi</p>
            ) : (
              <div className="space-y-3">
                {recentDonations.map(d => (
                  <div key={d.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{d.campaign?.title ?? '-'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</p>
                    </div>
                    <span className="text-sm font-semibold text-teal-600 shrink-0">
                      {formatRupiah(Number(d.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}