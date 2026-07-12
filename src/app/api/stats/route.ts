import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/stats?month=2026-06
// Kalau ?month tidak dikirim, default ke bulan berjalan (saat request dibuat)
//
// PENTING soal "amount" pada donasi tipe barang:
// Field `amount` di model Donation didesain untuk NOMINAL RUPIAH (donasi uang).
// Untuk donasi tipe "barang", nominal rupiah tidak relevan — yang relevan
// adalah `itemQuantity` (jumlah barang). Karena itu:
//   - uangTotal dihitung dari SUM(amount) khusus donasi type "uang"
//   - barangQty  dihitung dari SUM(itemQuantity) khusus donasi type "barang"
// Jangan menjumlahkan `amount` punya donasi barang ke dalam total rupiah,
// karena nilainya bukan rupiah (itu sebabnya sebelumnya muncul "Rp 1" padahal
// maksudnya 1 pcs barang).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month"); // format "YYYY-MM"

    const now = new Date();
    const year = monthParam ? Number(monthParam.split("-")[0]) : now.getFullYear();
    const monthIndex = monthParam ? Number(monthParam.split("-")[1]) - 1 : now.getMonth();

    const startOfMonth = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const startOfNextMonth = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);

    // 1. Tambahkan filter ke Promise.all
    const [
      totalCampaigns,
      totalDonationsCount,
      totalUsers,
      totalProposals,
      pendingProposals,
      approvedProposals,
    ] = await Promise.all([
      db.campaign.count({
        where: { createdAt: { gte: startOfMonth, lt: startOfNextMonth } }
      }),
      db.donation.count({
        where: { createdAt: { gte: startOfMonth, lt: startOfNextMonth } }
      }),
      db.user.count(), // Tetap all-time (tidak difilter) agar tahu total pendaftar keseluruhan
      db.proposal.count({
        where: { createdAt: { gte: startOfMonth, lt: startOfNextMonth } }
      }),
      db.proposal.count({ 
        where: { 
          status: "pending",
          createdAt: { gte: startOfMonth, lt: startOfNextMonth }
        } 
      }),
      db.proposal.count({ 
        where: { 
          status: "approved",
          createdAt: { gte: startOfMonth, lt: startOfNextMonth }
        } 
      }),
    ]);

    // Donasi approved, DIBATASI ke bulan yang dipilih, sekaligus join category campaign
    const approvedDonations = await db.donation.findMany({
      where: {
        status: "approved",
        createdAt: { gte: startOfMonth, lt: startOfNextMonth },
      },
      select: {
        amount: true,
        type: true, // 'uang' | 'barang'
        itemQuantity: true,
        campaign: { select: { category: true } },
      },
    });

    // Total nominal rupiah HANYA dari donasi tipe "uang"
    const totalAmount = approvedDonations
      .filter((d) => d.type === "uang")
      .reduce((sum, d) => sum + d.amount, 0);

    // 2. Tambahkan filter ke distinctDonors
    const distinctDonors = await db.donation.findMany({
      where: {
        createdAt: { gte: startOfMonth, lt: startOfNextMonth }
      },
      distinct: ["userId"],
      select: { userId: true },
    });

    // ── categoryBreakdown ──
    // uangTotal  = total rupiah (hanya type uang)
    // barangQty  = total jumlah barang/pcs (hanya type barang, dari itemQuantity)
    const categoryMap = new Map<
      string,
      { category: string; uangTotal: number; barangQty: number; count: number }
    >();

    for (const d of approvedDonations) {
      const category = d.campaign?.category ?? "Lainnya";
      const existing = categoryMap.get(category) ?? {
        category,
        uangTotal: 0,
        barangQty: 0,
        count: 0,
      };

      existing.count += 1;
      if (d.type === "uang") {
        existing.uangTotal += d.amount;
      } else if (d.type === "barang") {
        existing.barangQty += d.itemQuantity ?? 0;
      }

      categoryMap.set(category, existing);
    }

    const categoryBreakdown = Array.from(categoryMap.values());

    // ── typeBreakdown ──
    // Untuk uang: total = rupiah. Untuk barang: total = jumlah pcs (bukan rupiah)
    const uangDonations = approvedDonations.filter((d) => d.type === "uang");
    const barangDonations = approvedDonations.filter((d) => d.type === "barang");

    const typeBreakdown = [
      {
        type: "uang",
        total: uangDonations.reduce((sum, d) => sum + d.amount, 0),
        count: uangDonations.length,
      },
      {
        type: "barang",
        total: barangDonations.reduce((sum, d) => sum + (d.itemQuantity ?? 0), 0),
        count: barangDonations.length,
      },
    ].filter((t) => t.count > 0); // jangan tampilkan tipe yang kosong di bulan itu

    // Recent donations (last 5) — tidak dibatasi bulan, biar tetap informatif
    const recentDonations = await db.donation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        campaign: { select: { title: true, category: true } },
      },
    });

    return NextResponse.json({
      totalCampaigns,
      totalDonations: totalDonationsCount,
      totalAmount,
      totalDonors: distinctDonors.length,
      categoryBreakdown,
      typeBreakdown,
      recentDonations,
      selectedMonth: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,

      proposals: {
        total: totalProposals,
        pending: pendingProposals,
        approved: approvedProposals,
      },
      users: { total: totalUsers },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}