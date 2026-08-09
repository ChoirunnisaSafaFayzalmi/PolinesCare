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
  proposerName,
  proposerEmail,
  proposerPhone,
  proposerAddress,
  organizationName,
  campaignLocation,
  startDate,
  endDate,
  bankName,
  bankAccountNumber,
  bankAccountHolder,
  officialDocUrl,
  photoUrls,
  ktmUrl,                                             // ⬅ NEW
} = body;

    if (!title || !description || !officialDocUrl) {
      return NextResponse.json(
        { error: "Judul, deskripsi, dan surat resmi wajib diisi" },
        { status: 400 }
      );
    }

    // ⬅ NEW: kalau organisasi diisi (baik dari body baru atau data lama),
    // KTM/kartu anggota wajib ada — baik dari input baru maupun yang sudah tersimpan.
    const finalOrganizationName = organizationName || oldProposal.organizationName;
    const finalKtmUrl = ktmUrl || oldProposal.ktmUrl;
    if (finalOrganizationName && !finalKtmUrl) {
      return NextResponse.json(
        { error: "Foto KTM/kartu anggota wajib diisi jika mengatasnamakan organisasi" },
        { status: 400 }
      );
    }

    // Update record yang sama — bukan bikin proposal baru
    const updatedProposal = await db.proposal.update({
  where: { id },
  data: {
    title: title || oldProposal.title,
    description: description || oldProposal.description,
    category: category || oldProposal.category,
    targetAmount: targetAmount ? Number(targetAmount) : oldProposal.targetAmount,
    proposerName: proposerName || oldProposal.proposerName,
    proposerEmail: proposerEmail || oldProposal.proposerEmail,
    proposerPhone: proposerPhone || oldProposal.proposerPhone,
    proposerAddress: proposerAddress || oldProposal.proposerAddress,
    organizationName: finalOrganizationName,
    campaignLocation: campaignLocation || oldProposal.campaignLocation,
    startDate: startDate ? new Date(startDate) : oldProposal.startDate,
    endDate: endDate ? new Date(endDate) : oldProposal.endDate,
    bankName: bankName || oldProposal.bankName,
    bankAccountNumber: bankAccountNumber || oldProposal.bankAccountNumber,
    bankAccountHolder: bankAccountHolder || oldProposal.bankAccountHolder,
    officialDocUrl,
    photoUrls: photoUrls ? JSON.stringify(photoUrls) : oldProposal.photoUrls ?? null,
    ktmUrl: finalKtmUrl ?? null,                        // ⬅ NEW
    status: "pending",
    rejectionReason: null,
  },
});

    return NextResponse.json({ proposal: updatedProposal }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}