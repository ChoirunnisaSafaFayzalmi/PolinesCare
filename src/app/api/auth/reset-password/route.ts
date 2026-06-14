// Simpan di: src/app/api/auth/reset-password/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token dan password baru wajib diisi' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    }

    // Cari token yang valid dan belum expired
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true } } },
    })

    if (!resetToken) {
      return NextResponse.json({ error: 'Link reset tidak valid atau sudah digunakan' }, { status: 400 })
    }

    if (resetToken.expires < new Date()) {
      // Hapus token expired
      await db.passwordResetToken.delete({ where: { token } })
      return NextResponse.json({ error: 'Link reset sudah kadaluarsa. Silakan minta link baru.' }, { status: 400 })
    }

    // Hash password baru
    const hashed = await bcrypt.hash(newPassword, 12)

    // Update password & hapus token (transaksi)
    await db.$transaction([
      db.user.update({
        where: { id: resetToken.userId },
        data: { password: hashed },
      }),
      db.passwordResetToken.delete({
        where: { token },
      }),
    ])

    return NextResponse.json({ message: 'Password berhasil direset. Silakan masuk dengan password baru.' })
  } catch (error: unknown) {
    console.error('Reset password error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}