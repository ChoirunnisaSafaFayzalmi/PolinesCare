'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Heart, Eye, EyeOff, Loader2, Send, CheckCircle } from 'lucide-react'

export function LoginPage() {
  const router = useRouter()
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Lupa password state
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email: loginForm.email,
        password: loginForm.password,
        redirect: false,
      })
      if (result?.ok) {
        toast.success('Berhasil masuk!')
        router.push('/dashboard')
      } else {
        toast.error('Email atau password salah')
      }
    } catch {
      toast.error('Terjadi kesalahan saat masuk')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotError('')
    if (!forgotEmail.trim()) {
      setForgotError('Masukkan email Anda')
      return
    }
    setForgotLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setForgotError(data.error || 'Gagal mengirim email')
      } else {
        setForgotSent(true)
      }
    } catch {
      setForgotError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600">
              <Heart className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">
            {showForgot ? 'Lupa Password' : 'Masuk ke Polines Care'}
          </CardTitle>
          <CardDescription>
            {showForgot
              ? 'Masukkan email Anda untuk menerima link reset password'
              : 'Masukkan email dan password Anda'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* ── Form Login ── */}
          {!showForgot && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="email@contoh.com"
                  value={loginForm.email}
                  onChange={e => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Password</Label>
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setForgotEmail(loginForm.email) }}
                    className="text-xs text-teal-600 hover:underline"
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                disabled={loading}
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</>
                  : 'Masuk'
                }
              </Button>
            </form>
          )}

          {/* ── Form Lupa Password ── */}
          {showForgot && (
            <>
              {forgotSent ? (
                <div className="text-center space-y-4 py-4">
                  <CheckCircle className="h-12 w-12 text-teal-500 mx-auto" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">Email terkirim!</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Cek inbox <strong>{forgotEmail}</strong> dan klik link reset password.
                      Link berlaku 1 jam.
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">Tidak menerima email? Periksa folder spam.</p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setShowForgot(false); setForgotSent(false); setForgotEmail('') }}
                  >
                    Kembali ke Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  {forgotError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {forgotError}
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                    disabled={forgotLoading}
                  >
                    {forgotLoading
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mengirim...</>
                      : <><Send className="h-4 w-4 mr-2" /> Kirim Link Reset</>
                    }
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setShowForgot(false); setForgotError('') }}
                    className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
                  >
                    ← Kembali ke Login
                  </button>
                </form>
              )}
            </>
          )}
        </CardContent>

        {!showForgot && (
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              Belum punya akun?{' '}
              <button
                className="text-teal-600 hover:underline font-medium"
                onClick={() => router.push('/register')}
              >
                Daftar sekarang
              </button>
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}