import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month"); // format "YYYY-MM" (opsional)

    // Jika parameter month dikirim, gunakan filter tanggal. Jika tidak, kosongkan filter (all-time)
    let dateFilter = {};
    let year: number | null = null;
    let monthIndex: number | null = null;

    if (monthParam) {
      year = Number(monthParam.split("-")[0]);
      monthIndex = Number(monthParam.split("-")[1]) - 1;
      const startOfMonth = new Date(year, monthIndex, 1, 0, 0, 0, 0);
      const startOfNextMonth = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);
      dateFilter = { gte: startOfMonth, lt: startOfNextMonth };
    }

    const whereClause = monthParam ? { createdAt: dateFilter } : {};

    const [
      totalCampaigns,
      totalDonationsCount,
      totalUsers,
      totalProposals,
      pendingProposals,
      approvedProposals,
    ] = await Promise.all([
      db.campaign.count({ where: whereClause }),
      db.donation.count({ where: whereClause }),
      db.user.count(),
      db.proposal.count({ where: whereClause }),
      db.proposal.count({ 
        where: { 
          status: "pending",
          ...(monthParam ? { createdAt: dateFilter } : {})
        } 
      }),
      db.proposal.count({ 
        where: { 
          status: "approved",
          ...(monthParam ? { createdAt: dateFilter } : {})
        } 
      }),
    ]);

    // Donasi approved
    const approvedDonations = await db.donation.findMany({
      where: {
        status: "approved",
        ...(monthParam ? { createdAt: dateFilter } : {}),
      },
      select: {
        amount: true,
        type: true,
        itemQuantity: true,
        campaign: { select: { category: true } },
      },
    });

    const totalAmount = approvedDonations
      .filter((d) => d.type === "uang")
      .reduce((sum, d) => sum + d.amount, 0);

    const distinctDonors = await db.donation.findMany({
      where: monthParam ? { createdAt: dateFilter } : {},
      distinct: ["userId"],
      select: { userId: true },
    });

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
    ].filter((t) => t.count > 0);

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
      selectedMonth: monthParam ?? "all-time",

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