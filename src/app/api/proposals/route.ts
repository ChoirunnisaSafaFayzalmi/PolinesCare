import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/proposals - List proposals with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const userId = searchParams.get("userId");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }
    if (category && category !== "all") {
      where.category = category;
    }
    if (userId) {
      where.proposedBy = userId;
    }

    const proposals = await db.proposal.findMany({
      where,
      include: {
        proposer: {
          select: { id: true, name: true, avatar: true, email: true, phone: true, address: true },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy: [
        { createdAt: "desc" },
        { votesCount: "desc" },
      ]
    });

    return NextResponse.json({ proposals });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/proposals - Create new proposal
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await request.json();
    const {
  title, description, category, targetAmount,
  proposerName,
  proposerEmail, proposerPhone, proposerAddress,
  organizationName,                                    // ⬅ NEW
  campaignLocation, startDate, endDate,
  bankName, bankAccountNumber, bankAccountHolder,       // ⬅ NEW
  officialDocUrl, photoUrls,
} = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Judul dan deskripsi wajib diisi" },
        { status: 400 }
      );
    }

    const proposal = await db.proposal.create({
      data: {
        title,
        description,
        category: category || "Sosial",
        targetAmount: targetAmount ? Number(targetAmount) : null,
        proposedBy: userId,
        proposerName: proposerName || null,
        proposerEmail: proposerEmail || null,
        proposerPhone: proposerPhone || null,
        proposerAddress: proposerAddress || null,
        campaignLocation: campaignLocation || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        officialDocUrl: officialDocUrl || null,
        photoUrls: photoUrls ? JSON.stringify(photoUrls) : null,
        organizationName: organizationName || null,
        bankName: bankName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankAccountHolder: bankAccountHolder || null,
      },
    });

    // ── Kirim notifikasi ke semua admin ──
    // ⬅ FIX: sama seperti di donations/route.ts — sekarang notifikasi ini
    // menyimpan relatedType: "proposal" dan relatedId: proposal.id, supaya
    // klik notifikasi ini bisa langsung membuka detail proposal terkait,
    // bukan cuma menandai "dibaca".
    const admins = await db.user.findMany({
      where: { role: "admin" },
      select: { id: true },
    });

    if (admins.length > 0) {
      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "Pengajuan Proposal Baru",
          message: `${proposerName || "Seseorang"} mengajukan proposal "${title}". Segera tinjau untuk verifikasi.`,
          type: "info",
          relatedType: "proposal",
          relatedId: proposal.id,
        })),
      });
    }

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}