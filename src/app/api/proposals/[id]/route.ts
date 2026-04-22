import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/proposals/[id] - Get single proposal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const proposal = await db.proposal.findUnique({
      where: { id },
      include: {
        proposer: {
          select: { id: true, name: true, avatar: true },
        },
        votes: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ proposal });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/proposals/[id] - Update proposal status (admin only)
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
        { error: "Hanya admin yang dapat mengubah status proposal" },
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

    const existingProposal = await db.proposal.findUnique({ where: { id } });
    if (!existingProposal) {
      return NextResponse.json(
        { error: "Proposal tidak ditemukan" },
        { status: 404 }
      );
    }

    const proposal = await db.proposal.update({
      where: { id },
      data: { status },
      include: {
        proposer: {
          select: { id: true, name: true },
        },
      },
    });

    // Notify the proposer
    await db.notification.create({
      data: {
        userId: existingProposal.proposedBy,
        title:
          status === "approved"
            ? "Proposal Disetujui"
            : status === "rejected"
            ? "Proposal Ditolak"
            : "Status Proposal Diperbarui",
        message:
          status === "approved"
            ? `Proposal "${existingProposal.title}" Anda telah disetujui.`
            : status === "rejected"
            ? `Proposal "${existingProposal.title}" Anda telah ditolak.`
            : `Status proposal "${existingProposal.title}" telah diperbarui.`,
        type: status === "approved" ? "success" : status === "rejected" ? "warning" : "info",
      },
    });

    return NextResponse.json({ proposal });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
