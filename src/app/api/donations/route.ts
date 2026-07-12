import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/donations - List donations with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaignId");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};

    if (campaignId) {
      where.campaignId = campaignId;
    }
    if (userId) {
      where.userId = userId;
    }
    if (status && status !== "all") {
      where.status = status;
    }

    const donations = await db.donation.findMany({
      where,
      include: {
        campaign: {
          select: { id: true, title: true, category: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ donations });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/donations - Create new donation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const sessionUser = session.user as { name?: string; email?: string };
    const body = await request.json();
    const {
      campaignId,
      amount,
      donorName,
      donorEmail,
      donorPhone,
      type,
      paymentMethod,
      proofUrl,
      message,
      itemName,
      itemQuantity,
      senderAddress,
    } = body;

    // Ambil data lengkap user dari DB (session gak nyimpen phone)
    const dbUser = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true },
    });

    // Auto-fill from DB user if not provided
    const name = donorName || dbUser?.name || sessionUser.name || "Anonim";
    const email = donorEmail || dbUser?.email || sessionUser.email || "";
    const phone = (donorPhone && donorPhone !== "-" ? donorPhone : null) || dbUser?.phone || "-";

    if (!campaignId || !amount) {
      return NextResponse.json(
        { error: "Field wajib: campaignId, amount" },
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

    if (campaign.status !== "active") {
      return NextResponse.json(
        { error: "Kampanye tidak aktif" },
        { status: 400 }
      );
    }

    const donation = await db.donation.create({
      data: {
        campaignId,
        userId,
        amount: Number(amount),
        donorName: name,
        donorEmail: email,
        donorPhone: phone,
        type: type || "uang",
        paymentMethod: paymentMethod || "transfer",
        proofUrl: proofUrl || null,
        message: message || null,
        itemName: type === 'barang' ? (itemName || null) : null,
        itemQuantity: type === 'barang' ? (Number(itemQuantity) || null) : null,
        senderAddress: type === 'barang' ? (senderAddress || null) : null,
      },
    });

    // ── Kirim notifikasi ke semua admin ──
    // ⬅ FIX: sebelumnya notifikasi ini tidak menyimpan ID donasi terkait,
    // jadi klik notifikasi di daftar Notifikasi hanya bisa menandai "dibaca"
    // tanpa bisa mengarahkan admin langsung ke detail donasi yang dimaksud.
    // Sekarang disisipkan relatedType: "donation" dan relatedId: donation.id,
    // supaya frontend bisa langsung membuka detail donasi ini saat diklik.
    const admins = await db.user.findMany({
      where: { role: "admin" },
      select: { id: true },
    });

    if (admins.length > 0) {
      const donationTypeLabel = type === 'barang' ? 'barang' : 'uang';
      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          title: "Donasi Baru Masuk",
          message: `${name} mengirim donasi ${donationTypeLabel} untuk "${campaign.title}". Segera verifikasi.`,
          type: "info",
          relatedType: "donation",
          relatedId: donation.id,
        })),
      });
    }

    return NextResponse.json({ donation }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}