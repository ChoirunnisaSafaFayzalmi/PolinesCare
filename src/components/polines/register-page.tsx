'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Heart } from 'lucide-react'

interface RegisterPageProps {
  registerForm: { name: string; email: string; phone: string; password: string; confirmPassword: string }
  setRegisterForm: (v: { name: string; email: string; phone: string; password: string; confirmPassword: string }) => void
  loading: boolean
  handleRegister: (e: React.FormEvent) => void
  setView: (v: string) => void
}

export function RegisterPage({ registerForm, setRegisterForm, loading, handleRegister, setView }: RegisterPageProps) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600">
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
              <Input id="reg-name" placeholder="Nama lengkap" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email">Email</Label>
              <Input id="reg-email" type="email" placeholder="email@contoh.com" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-phone">No. Telepon</Label>
              <Input id="reg-phone" type="tel" placeholder="08xxxxxxxxxx" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <Input id="reg-password" type="password" placeholder="Minimal 6 karakter" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-confirm">Konfirmasi Password</Label>
              <Input id="reg-confirm" type="password" placeholder="Ulangi password" value={registerForm.confirmPassword} onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })} required />
            </div>
            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white" disabled={loading}>
              {loading ? 'Memproses...' : 'Daftar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Sudah punya akun?{' '}
            <button className="text-teal-600 hover:underline font-medium" onClick={() => setView('login')}>Masuk</button>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
