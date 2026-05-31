import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/proposals/[id]/resubmit - Resubmit a rejected proposal
export async function POST(
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

    // Cek proposal lama
    const oldProposal = await db.proposal.findUnique({ where: { id } });
    if (!oldProposal) {
      return NextResponse.json({ error: "Proposal tidak ditemukan" }, { status: 404 });
    }

    if (oldProposal.proposedBy !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (oldProposal.status !== "rejected") {
      return NextResponse.json(
        { error: "Hanya proposal yang ditolak yang bisa diajukan ulang" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      targetAmount,
      proposerEmail,
      proposerPhone,
      proposerAddress,
      campaignLocation,
      startDate,
      endDate,
      officialDocUrl,
      photoUrl,
    } = body;

    if (!title || !description || !officialDocUrl) {
      return NextResponse.json(
        { error: "Judul, deskripsi, dan surat resmi wajib diisi" },
        { status: 400 }
      );
    }

    // Buat proposal baru sebagai pengajuan ulang
    const newProposal = await db.proposal.create({
      data: {
        title: title || oldProposal.title,
        description: description || oldProposal.description,
        category: category || oldProposal.category,
        targetAmount: targetAmount ? Number(targetAmount) : oldProposal.targetAmount,
        proposedBy: userId,
        proposerEmail: proposerEmail || oldProposal.proposerEmail,
        proposerPhone: proposerPhone || oldProposal.proposerPhone,
        proposerAddress: proposerAddress || oldProposal.proposerAddress,
        campaignLocation: campaignLocation || oldProposal.campaignLocation,
        startDate: startDate ? new Date(startDate) : oldProposal.startDate,
        endDate: endDate ? new Date(endDate) : oldProposal.endDate,
        officialDocUrl,
        photoUrl: photoUrl || null,
        status: "pending",
        resubmittedFrom: id, // referensi ke proposal lama
      },
    });

    return NextResponse.json({ proposal: newProposal }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}