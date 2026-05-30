'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Heart } from 'lucide-react'

export function LoginPage() {
  const router = useRouter()
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-linear-to-br from-teal-500 to-emerald-600">
              <Heart className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Masuk ke Polines Care</CardTitle>
          <CardDescription>Masukkan email dan password Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" placeholder="email@contoh.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input id="login-password" type="password" placeholder="Masukkan password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required />
            </div>
            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white" disabled={loading}>
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Belum punya akun?{' '}
            <button className="text-teal-600 hover:underline font-medium"
              onClick={() => router.push('/register')}>
              Daftar sekarang
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}