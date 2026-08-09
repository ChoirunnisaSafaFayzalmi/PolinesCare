import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/payment-methods - Ambil semua metode pembayaran yang pernah diinput
export async function GET() {
  try {
    const methods = await db.paymentMethod.findMany({
      orderBy: { label: "asc" },
      select: { label: true, accountNumber: true },
    });

    return NextResponse.json(methods);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/payment-methods - Simpan metode pembayaran baru (kalau kombinasinya belum ada)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    const accountNumber =
      typeof body?.accountNumber === "string" ? body.accountNumber.trim() : "";

    if (!label) {
      return NextResponse.json({ error: "Nama bank/e-wallet wajib diisi" }, { status: 400 });
    }
    // ⬅ FIX: No. Rekening/No. HP sekarang wajib diisi juga, supaya tidak ada
    // metode pembayaran yang tersimpan tanpa nomor tujuan (rawan miss saat
    // donatur transfer). Validasi di server juga, bukan cuma di frontend,
    // supaya tidak bisa diakali lewat request langsung ke API ini.
    if (!accountNumber) {
      return NextResponse.json({ error: "No. Rekening/No. HP wajib diisi" }, { status: 400 });
    }

    // ⬅ FIX: sebelumnya pola-nya "findFirst dulu, baru create kalau belum ada"
    // (check-then-act). Ini punya celah race condition: kalau ada dua request
    // untuk kombinasi label+accountNumber yang sama nyaris bersamaan (atau
    // findFirst di request pertama gagal menemukan entry yang SEBENARNYA
    // sudah tersimpan dari request sebelumnya, misalnya karena timing/cache),
    // create() kedua akan gagal karena melanggar
    // @@unique([label, accountNumber]) di schema — request itu jadi
    // error 500 walau datanya sebenarnya sudah ada di database.
    //
    // Sekarang: langsung coba create(). Kalau bentrok unique constraint
    // (Prisma error code P2002), berarti datanya memang sudah ada —
    // ambil & kembalikan yang sudah ada itu sebagai sukses, bukan error.
    // Ini atomik di level database, jadi tidak rawan race condition lagi.
    try {
      const method = await db.paymentMethod.create({
        data: { label, accountNumber },
      });
      return NextResponse.json({ method }, { status: 201 });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const existing = await db.paymentMethod.findFirst({
          where: { label, accountNumber },
        });
        return NextResponse.json({ method: existing }, { status: 200 });
      }
      throw err;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}