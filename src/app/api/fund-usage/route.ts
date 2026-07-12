// LOKASI: app/api/fund-usage/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/fund-usage - List fund usage (semua campaign, atau filter by campaignId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    const fundUsages = await db.fundUsage.findMany({
      where: campaignId ? { campaignId } : undefined,
      orderBy: { date: "desc" },
    });

    // totalUsed HANYA menjumlahkan entri bertipe "uang" - entri "barang"
    // tidak punya nilai Rupiah yang applicable jadi tidak ikut dijumlah.
    const totalUsed = fundUsages.reduce(
      (sum: number, f: { type: string; amount: number | null }) =>
        f.type === "uang" ? sum + (f.amount ?? 0) : sum,
      0
    );

    return NextResponse.json({ fundUsages, totalUsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/fund-usage - Create fund usage report (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Hanya admin yang dapat membuat laporan penggunaan dana" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      campaignId,
      type = "uang",
      description,
      amount,
      itemName,
      itemQuantity,
      date,
      documentUrl,
    } = body;

    if (!campaignId || !description) {
      return NextResponse.json(
        { error: "Field wajib: campaignId, description" },
        { status: 400 }
      );
    }

    if (type !== "uang" && type !== "barang") {
      return NextResponse.json(
        { error: "Tipe harus 'uang' atau 'barang'" },
        { status: 400 }
      );
    }

    if (type === "uang" && !amount) {
      return NextResponse.json(
        { error: "Nominal wajib diisi untuk tipe uang" },
        { status: 400 }
      );
    }

    if (type === "barang" && (!itemName || !itemQuantity)) {
      return NextResponse.json(
        { error: "Nama barang dan jumlah wajib diisi untuk tipe barang" },
        { status: 400 }
      );
    }

    const campaign = await db.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) {
      return NextResponse.json(
        { error: "Kampanye tidak ditemukan" },
        { status: 404 }
      );
    }

    const fundUsage = await db.fundUsage.create({
      data: {
        campaignId,
        type,
        description,
        amount: type === "uang" ? Number(amount) : null,
        itemName: type === "barang" ? itemName : null,
        itemQuantity: type === "barang" ? Number(itemQuantity) : null,
        date: date ? new Date(date) : new Date(),
        documentUrl: documentUrl || null,
        createdBy: (session.user as { id: string }).id,
      },
    });

    return NextResponse.json({ fundUsage }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}