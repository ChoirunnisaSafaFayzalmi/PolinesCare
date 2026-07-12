import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/campaigns/next-unique-code
// Mencari angka 3 digit (000-999) terkecil yang BELUM dipakai oleh
// campaign yang masih aktif, untuk dijadikan default value di form
// "Buat Campaign Baru" — supaya admin tidak perlu menebak-nebak kode
// yang aman secara manual. Admin tetap bisa mengganti angka ini secara
// manual di form; validasi keras tetap ada di POST /api/campaigns
// sebagai jaring pengaman terakhir.
const ACTIVE_STATUSES = ["active", "awaiting_completion"];

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const usedCodes = await db.campaign.findMany({
      where: { status: { in: ACTIVE_STATUSES } },
      select: { uniqueCode: true },
    });

    const usedSet = new Set(usedCodes.map((c) => c.uniqueCode));

    // Cari angka terkecil dari 0-999 yang belum ada di usedSet
    let nextCode = 0;
    while (usedSet.has(nextCode) && nextCode <= 999) {
      nextCode++;
    }

    // Fallback kalau semua 1000 kombinasi (000-999) somehow sudah terpakai
    // (skenario yang sangat tidak mungkin terjadi dalam praktiknya)
    if (nextCode > 999) {
      return NextResponse.json(
        { error: "Semua kode unik 3 digit sudah terpakai. Hubungi developer." },
        { status: 409 }
      );
    }

    return NextResponse.json({ uniqueCode: nextCode });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}