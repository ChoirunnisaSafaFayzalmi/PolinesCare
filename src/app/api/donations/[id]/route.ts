import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// PUT /api/donations/[id] - Update donation status (admin verification)
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
        { error: "Hanya admin yang dapat memverifikasi donasi" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json(
        { error: "Status tidak valid. Gunakan: approved, rejected, pending" },
        { status: 400 }
      );
    }

    const existingDonation = await db.donation.findUnique({ where: { id } });
    if (!existingDonation) {
      return NextResponse.json(
        { error: "Donasi tidak ditemukan" },
        { status: 404 }
      );
    }

    const donation = await db.donation.update({
      where: { id },
      data: { status },
      include: {
        campaign: {
          select: { id: true, title: true },
        },
        user: {
          select: { id: true, name: true },
        },
      },
    });

    // If approved, update campaign collected amount
    if (status === "approved" && existingDonation.status !== "approved") {
      await db.campaign.update({
        where: { id: existingDonation.campaignId },
        data: {
          collectedAmount: {
            increment: existingDonation.amount,
          },
        },
      });
    }

    // If changed from approved to something else, decrease
    if (status !== "approved" && existingDonation.status === "approved") {
      await db.campaign.update({
        where: { id: existingDonation.campaignId },
        data: {
          collectedAmount: {
            decrement: existingDonation.amount,
          },
        },
      });
    }

    // Create notification for the donor
    await db.notification.create({
      data: {
        userId: existingDonation.userId,
        title:
          status === "approved"
            ? "Donasi Disetujui"
            : status === "rejected"
            ? "Donasi Ditolak"
            : "Status Donasi Diperbarui",
        message:
          status === "approved"
            ? `Donasi Anda sebesar Rp ${existingDonation.amount.toLocaleString("id-ID")} untuk kampanye telah disetujui.`
            : status === "rejected"
            ? `Donasi Anda sebesar Rp ${existingDonation.amount.toLocaleString("id-ID")} untuk kampanye ditolak.`
            : `Status donasi Anda telah diperbarui menjadi pending.`,
        type: status === "approved" ? "success" : status === "rejected" ? "warning" : "info",
      },
    });

    return NextResponse.json({ donation });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
