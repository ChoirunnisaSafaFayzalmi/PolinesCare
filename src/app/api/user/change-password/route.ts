// Simpan di: src/app/api/user/change-password/route.ts

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
    const { oldPassword, newPassword } = body

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password baru minimal 6 karakter' }, { status: 400 })
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
    const isValid = await bcrypt.compare(oldPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Password lama tidak sesuai' }, { status: 400 })
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