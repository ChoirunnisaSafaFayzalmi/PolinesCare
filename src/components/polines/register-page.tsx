'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Heart, Eye, EyeOff } from 'lucide-react'

export function RegisterPage() {
  const router = useRouter()
  const [registerForm, setRegisterForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Password dan konfirmasi tidak cocok'); return
    }
    if (registerForm.password.length < 6) {
      toast.error('Password minimal 6 karakter'); return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          phone: registerForm.phone,
          password: registerForm.password
        })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Registrasi berhasil! Silakan masuk.')
        router.push('/login')
      } else {
        toast.error(data.error || 'Gagal mendaftar')
      }
    } catch {
      toast.error('Terjadi kesalahan saat mendaftar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-teal-500 to-emerald-600">
              <Heart className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Daftar Akun Baru</CardTitle>
          <CardDescription>Buat akun untuk mulai berdonasi</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-name">Nama Lengkap</Label>
              <Input id="reg-name" placeholder="Nama lengkap"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" placeholder="email@contoh.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-phone">No. Telepon</Label>
              <Input id="reg-phone" type="tel" placeholder="08xxxxxxxxxx"
                value={registerForm.phone}
                onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <div className="relative">
                <Input id="reg-password" type={showPassword ? 'text' : 'password'} placeholder="Minimal 6 karakter"
                  className="pr-10"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} required />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-confirm">Konfirmasi Password</Label>
              <div className="relative">
                <Input id="reg-confirm" type={showConfirmPassword ? 'text' : 'password'} placeholder="Ulangi password"
                  className="pr-10"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })} required />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white" disabled={loading}>
              {loading ? 'Memproses...' : 'Daftar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{' '}
            <button className="text-teal-600 hover:underline font-medium"
              onClick={() => router.push('/login')}>Masuk</button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}