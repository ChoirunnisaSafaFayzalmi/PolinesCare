import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/campaigns/[id] - Get single campaign with stats
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const campaign = await db.campaign.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        donations: {
          select: { id: true, amount: true, status: true, createdAt: true },
        },
        fundUsages: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Kampanye tidak ditemukan" },
        { status: 404 }
      );
    }

    const totalDonations = campaign.donations.length;
    const totalAmount = campaign.donations
      .filter((d: { status: string }) => d.status === "approved")
      .reduce((sum: number, d: { amount: number }) => sum + d.amount, 0);
    const totalFundUsage = campaign.fundUsages.reduce(
      (sum: number, f: { amount: number }) => sum + f.amount,
      0
    );

    return NextResponse.json({
      campaign,
      stats: {
        totalDonations,
        totalAmount,
        totalFundUsage,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/campaigns/[id] - Update campaign (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Hanya admin yang dapat mengubah kampanye" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, category, targetAmount, startDate, endDate, image, status, isUrgent } = body;

    const existingCampaign = await db.campaign.findUnique({ where: { id } });
    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Kampanye tidak ditemukan" },
        { status: 404 }
      );
    }

    const campaign = await db.campaign.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(category && { category }),
        ...(targetAmount !== undefined && { targetAmount: Number(targetAmount) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(image !== undefined && { image }),
        ...(status && { status }),
        ...(isUrgent !== undefined && { isUrgent }),
      },
    });

    return NextResponse.json({ campaign });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/campaigns/[id] - Delete campaign (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Hanya admin yang dapat menghapus kampanye" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const existingCampaign = await db.campaign.findUnique({ where: { id } });
    if (!existingCampaign) {
      return NextResponse.json(
        { error: "Kampanye tidak ditemukan" },
        { status: 404 }
      );
    }

    await db.campaign.delete({ where: { id } });

    return NextResponse.json({ message: "Kampanye berhasil dihapus" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
