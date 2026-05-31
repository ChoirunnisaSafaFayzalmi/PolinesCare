import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/donations/[id] - Get donation detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role?: string }).role;

    const donation = await db.donation.findUnique({
      where: { id },
      include: {
        campaign: {
          select: { id: true, title: true, category: true, image: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donasi tidak ditemukan" }, { status: 404 });
    }

    // Donatur hanya bisa lihat donasi miliknya sendiri
    if (userRole !== "admin" && donation.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ donation });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/donations/[id] - Update donation (admin approve/reject, or donatur update proof)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = (session.user as { id: string }).id;
    const userRole = (session.user as { role?: string }).role;
    const body = await request.json();

    const donation = await db.donation.findUnique({ where: { id } });
    if (!donation) {
      return NextResponse.json({ error: "Donasi tidak ditemukan" }, { status: 404 });
    }

    // Admin: bisa approve/reject + isi rejectionReason
    if (userRole === "admin") {
      const { status, rejectionReason } = body;

      if (!["approved", "rejected", "pending"].includes(status)) {
        return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
      }

      const updated = await db.donation.update({
        where: { id },
        data: {
          status,
          rejectionReason: status === "rejected" ? (rejectionReason || null) : null,
        },
      });

      // Update collectedAmount jika approved
      if (status === "approved" && donation.status !== "approved") {
        await db.campaign.update({
          where: { id: donation.campaignId },
          data: { collectedAmount: { increment: donation.amount } },
        });
      }
      // Kurangi collectedAmount jika di-reject setelah approved
      if (status === "rejected" && donation.status === "approved") {
        await db.campaign.update({
          where: { id: donation.campaignId },
          data: { collectedAmount: { decrement: donation.amount } },
        });
      }

      return NextResponse.json({ donation: updated });
    }

    // Donatur: hanya bisa update proofUrl & message selama masih pending
    if (donation.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (donation.status !== "pending") {
      return NextResponse.json(
        { error: "Donasi yang sudah diproses tidak bisa diubah" },
        { status: 400 }
      );
    }

    const { proofUrl, message } = body;
    const updated = await db.donation.update({
      where: { id },
      data: {
        proofUrl: proofUrl || donation.proofUrl,
        message: message ?? donation.message,
      },
    });

    return NextResponse.json({ donation: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}