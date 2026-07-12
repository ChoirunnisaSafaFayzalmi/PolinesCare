// ⬅ FIX 1 — LOKASI FILE: file ini WAJIB disimpan di
// src/app/api/user/profile/change-password/route.ts
// (bukan src/app/api/user/change-password/route.ts seperti komentar asli).
// Frontend (admin-profile.tsx) memanggil fetch('/api/user/profile/change-password'),
// jadi kalau file ini disimpan di path yang berbeda, Next.js tidak akan
// menemukan route-nya sama sekali dan request akan gagal dengan 404.
//
// ⬅ FIX 2 — NAMA FIELD: sebelumnya backend membaca `oldPassword` dari body,
// padahal frontend mengirim field bernama `currentPassword`:
//   body: JSON.stringify({ currentPassword: ..., newPassword: ... })
// Karena nama field tidak cocok, `oldPassword` di backend akan selalu
// `undefined` walau frontend sudah mengirim data dengan benar — request
// selalu ditolak dengan pesan "Semua field wajib diisi". Fix: backend
// sekarang membaca `currentPassword` supaya cocok dengan yang dikirim frontend.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as { id: string }).id
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    // Catatan: frontend (admin-profile.tsx) sudah memvalidasi minimal 8
    // karakter di sisi client. Backend tetap punya validasi sendiri sebagai
    // jaring pengaman (jangan hanya mengandalkan validasi frontend).
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password baru minimal 8 karakter' }, { status: 400 })
    }

    // Ambil user beserta password hash dari DB
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
    }

    // Verifikasi password lama
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Password saat ini tidak sesuai' }, { status: 400 })
    }

    // Hash password baru & simpan
    const hashed = await bcrypt.hash(newPassword, 12)
    await db.user.update({
      where: { id: userId },
      data: { password: hashed },
    })

    return NextResponse.json({ message: 'Password berhasil diubah' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}