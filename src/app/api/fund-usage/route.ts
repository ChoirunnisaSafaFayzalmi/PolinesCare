import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/fund-usage - List fund usage for a campaign
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json(
        { error: "campaignId wajib diisi" },
        { status: 400 }
      );
    }

    const fundUsages = await db.fundUsage.findMany({
      where: { campaignId },
      orderBy: { date: "desc" },
    });

    const totalUsed = fundUsages.reduce(
      (sum: number, f: { amount: number }) => sum + f.amount,
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
    const { campaignId, description, amount, date, documentUrl } = body;

    if (!campaignId || !description || !amount) {
      return NextResponse.json(
        { error: "Field wajib: campaignId, description, amount" },
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
        description,
        amount: Number(amount),
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
