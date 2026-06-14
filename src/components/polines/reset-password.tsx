// Simpan di: src/app/reset-password/page.tsx

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Heart, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' })
  const [showPw, setShowPw] = useState({ new: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Link reset tidak valid. Pastikan Anda menggunakan link dari email.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (form.newPassword.length < 6) {
      setMessage('Password minimal 6 karakter')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setMessage('Konfirmasi password tidak cocok')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: form.newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error || 'Gagal mereset password')
      } else {
        setStatus('success')
        setMessage(data.message)
        setTimeout(() => router.push('/login'), 3000)
      }
    } catch {
      setStatus('error')
      setMessage('Terjadi kesalahan. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600">
              <Heart className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Buat Password Baru</CardTitle>
          <CardDescription>Masukkan password baru untuk akun Anda</CardDescription>
        </CardHeader>

        <CardContent>
          {status === 'success' ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="h-12 w-12 text-teal-500 mx-auto" />
              <p className="text-sm text-gray-600">{message}</p>
              <p className="text-xs text-gray-400">Mengalihkan ke halaman login...</p>
              <Button onClick={() => router.push('/login')} className="w-full bg-teal-600 hover:bg-teal-700 text-white">
                Ke Halaman Login
              </Button>
            </div>
          ) : status === 'error' && !token ? (
            <div className="text-center space-y-4 py-4">
              <XCircle className="h-12 w-12 text-red-400 mx-auto" />
              <p className="text-sm text-red-600">{message}</p>
              <Link href="/login">
                <Button variant="outline" className="w-full">Kembali ke Login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <div className={`text-sm px-3 py-2 rounded-lg border ${
                  status === 'error'
                    ? 'text-red-600 bg-red-50 border-red-200'
                    : 'text-gray-600 bg-gray-50 border-gray-200'
                }`}>
                  {message}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password">Password Baru</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPw.new ? 'text' : 'password'}
                    placeholder="Minimal 6 karakter"
                    value={form.newPassword}
                    onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => ({ ...p, new: !p.new }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPw.confirm ? 'text' : 'password'}
                    placeholder="Ulangi password baru"
                    value={form.confirmPassword}
                    onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyimpan...</>
                  : 'Simpan Password Baru'
                }
              </Button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-teal-600 hover:underline">
                  Kembali ke Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}