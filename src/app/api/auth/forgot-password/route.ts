// Simpan di: src/app/api/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

// Selama domain belum diverifikasi di Resend, WAJIB pakai onboarding@resend.dev. 
// Setelah domain diverifikasi, isi RESEND_FROM_EMAIL di env production (mis. "Polines Care <noreply@domainkamu.ac.id>").
const FROM_EMAIL = 'Polines Care <noreply@polinescare.my.id>'
const DEV_TEST_EMAIL = process.env.RESEND_DEV_TEST_EMAIL

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
    }

    // Cek apakah email terdaftar
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, email: true },
    })

    // Selalu return sukses meski email tidak ada (keamanan: jangan bocorkan info)
    if (!user) {
      return NextResponse.json({ message: 'Jika email terdaftar, link reset akan dikirim.' })
    }

    // Hapus token lama jika ada
    await db.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    // Buat token baru (expired 1 jam)
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 jam

    await db.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expires,
      },
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`
    const recipient = user.email

    // Kirim email via Resend
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipient,
      subject: 'Reset Password - Polines Care',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body style="font-family: sans-serif; background: #f9fafb; padding: 32px 0; margin: 0;">
            <div style="max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">

              <!-- Header -->
              <div style="background: linear-gradient(135deg, #0d9488, #059669); padding: 28px 32px; text-align: center;">
                <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
                  Polines Care
                </h1>
                <p style="color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 13px;">
                  Platform Donasi Politeknik Negeri Semarang
                </p>
              </div>

              <!-- Body -->
              <div style="padding: 32px;">
                <h2 style="color: #111827; font-size: 18px; margin: 0 0 8px;">Reset Password</h2>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                  Halo <strong style="color: #111827;">${user.name}</strong>, kami menerima permintaan reset password untuk akun Anda.
                  Klik tombol di bawah untuk membuat password baru.
                </p>

                <div style="text-align: center; margin: 28px 0;">
                  <a href="${resetUrl}"
                    style="display: inline-block; background: #0d9488; color: #fff; text-decoration: none;
                           padding: 13px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                    Reset Password
                  </a>
                </div>

                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0 0 8px;">
                  Link ini berlaku selama <strong>1 jam</strong>.
                </p>
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                  Jika Anda tidak meminta reset password, abaikan email ini.
                </p>

                <!-- Fallback URL -->
                <div style="margin-top: 24px; padding: 12px; background: #f3f4f6; border-radius: 8px;">
                  <p style="color: #6b7280; font-size: 11px; margin: 0 0 4px;">
                    Atau salin link berikut ke browser Anda:
                  </p>
                  <p style="color: #0d9488; font-size: 11px; margin: 0; word-break: break-all;">
                    ${resetUrl}
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="padding: 16px 32px; border-top: 1px solid #f3f4f6; text-align: center;">
                <p style="color: #d1d5db; font-size: 11px; margin: 0;">
                  © ${new Date().getFullYear()} Polines Care · Politeknik Negeri Semarang
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json({ message: 'Link reset password telah dikirim ke email Anda.' })
  } catch (error: unknown) {
    console.error('Forgot password error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}