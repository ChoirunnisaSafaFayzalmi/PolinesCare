import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

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
          // ✅ Fix — tambah email, phone, address
          select: { id: true, name: true, avatar: true, email: true, phone: true, address: true },
        },
        votes: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!proposal) {
      return NextResponse.json({ error: "Proposal tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ proposal });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: "Hanya admin yang dapat mengubah status proposal" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, rejectionReason } = body;

    if (status && !["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const existingProposal = await db.proposal.findUnique({
      where: { id },
      include: {
        // ✅ Fix — include field lengkap untuk dipakai buat Campaign
        proposer: { select: { id: true, name: true, email: true, phone: true, address: true } },
      },
    });
    if (!existingProposal) {
      return NextResponse.json({ error: "Proposal tidak ditemukan" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    const proposal = await db.proposal.update({
      where: { id },
      data: updateData,
      include: {
        proposer: { select: { id: true, name: true, email: true, phone: true, address: true } },
      },
    });

    // Jika approved → buat Campaign otomatis
    if (status === 'approved') {
      const adminId = (session.user as { id?: string }).id;
      let createdBy = adminId || '';
      if (!createdBy) {
        const adminUser = await db.user.findFirst({ where: { role: 'admin' } });
        createdBy = adminUser?.id || '';
      }

      await db.campaign.create({
  data: {
    title: existingProposal.title,
    description: existingProposal.description,
    category: existingProposal.category,
    targetAmount: existingProposal.targetAmount ?? 0,
    collectedAmount: 0,
    startDate: existingProposal.startDate ?? new Date(),
    endDate: existingProposal.endDate ?? new Date(),
    status: 'active',
    isPublic: true,
    isUrgent: false,
    location: existingProposal.campaignLocation ?? '',
    images: existingProposal.photoUrls
  ? existingProposal.photoUrls  // sudah JSON string, langsung pakai
  : null,
    paymentMethods: null,
    uniqueCode: Math.floor(Math.random() * 900) + 100,
    createdBy,
  },
});
    }

    // Notifikasi ke pengaju
    if (status === 'approved' || status === 'rejected') {
      await db.notification.create({
        data: {
          userId: existingProposal.proposedBy,
          title: status === 'approved' ? 'Proposal Disetujui 🎉' : 'Proposal Ditolak',
          message: status === 'approved'
            ? `Proposal "${existingProposal.title}" disetujui! Campaign sudah aktif dan dapat menerima donasi.`
            : `Proposal "${existingProposal.title}" ditolak. Alasan: ${rejectionReason || '-'}. Anda dapat mengajukan ulang setelah memperbaiki proposal.`,
          type: status === 'approved' ? 'success' : 'warning',
        },
      });
    }

    return NextResponse.json({ proposal });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}