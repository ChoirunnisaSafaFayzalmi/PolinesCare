'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, Loader2, CheckCircle, Shield } from 'lucide-react'

interface AdminItem {
  id: string
  name: string
  email: string
}

export function AdminCreateAdminTab() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [admins, setAdmins] = useState<AdminItem[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)
  const [refetchTick, setRefetchTick] = useState(0)

  // Effect murni untuk sinkronisasi: ambil data admin setiap kali refetchTick berubah
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/create-admin')
        const data = await res.json()
        if (!cancelled) setAdmins(data.admins || [])
      } finally {
        if (!cancelled) setLoadingAdmins(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [refetchTick])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)
    try {
      const res = await fetch('/api/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan admin')
      setSuccessMsg(`Admin "${form.name}" berhasil ditambahkan`)
      setForm({ name: '', email: '', password: '' })
      setLoadingAdmins(true)
      setRefetchTick(t => t + 1) // trigger effect untuk refetch daftar admin
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Daftar Admin Saat Ini */}
      <div className="bg-white rounded-xl border p-6 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide flex items-center gap-1.5">
          <Shield className="h-4 w-4" /> Admin Saat Ini
        </h3>
        {loadingAdmins ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
          </div>
        ) : admins.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada data admin.</p>
        ) : (
          <div className="divide-y">
            {admins.map(a => (
              <div key={a.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.name}</p>
                  <p className="text-xs text-gray-500">{a.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Tambah Admin */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide flex items-center gap-1.5">
          <UserPlus className="h-4 w-4" /> Tambah Admin Baru
        </h3>
        <p className="text-xs text-gray-400 -mt-2">
          Buat akun admin baru. Hanya admin yang bisa menambahkan admin lain.
        </p>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Nama Lengkap</Label>
            <Input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="Nama admin baru"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="email@polines.ac.id"
              required
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Password</Label>
            <Input
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="Minimal 8 karakter"
              minLength={8}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
            {loading ? 'Menambahkan...' : 'Tambah Admin'}
          </Button>
        </form>
      </div>
    </div>
  )
}