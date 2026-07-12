import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const isUrgent = searchParams.get("urgent");

    // ⬅ TAMBAHAN: auto-complete campaign yang tanggal berakhirnya sudah lewat
    await db.campaign.updateMany({
      where: {
        status: "active",
        endDate: { lt: new Date() },
      },
      data: { status: "completed", isPublic: false },
    });

    const where: Record<string, unknown> = {};
    if (category && category !== "all") where.category = category;
    if (status && status !== "all") where.status = status;
    if (isUrgent === "true") where.isUrgent = true;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // ⬅ FIX: sebelumnya select creator cuma { id, name, avatar } — tidak cukup
    // untuk menampilkan email/no telp/alamat pembuat campaign yang sebenarnya
    // di form Edit Campaign (sebelumnya form itu fallback ke data admin yang
    // sedang login, padahal admin bisa lebih dari 1 orang). Tambahkan email,
    // phone, address ke select supaya data pembuat asli ikut terkirim ke frontend.
    const campaigns = await db.campaign.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, email: true, phone: true, address: true, avatar: true } },
        _count: { select: { donations: true } },
      },
      orderBy: [{ isUrgent: "desc" }, { createdAt: "desc" }],
    });

    // Parse JSON fields sebelum dikirim ke client
    const parsed = campaigns.map((c) => ({
      ...c,
      images: c.images ? JSON.parse(c.images) : [],
      paymentMethods: c.paymentMethods ? JSON.parse(c.paymentMethods) : [],
    }));

    return NextResponse.json({ campaigns: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Status campaign yang dianggap "masih berjalan" — kode uniknya tidak boleh
// bentrok satu sama lain karena masih dipakai untuk mencocokkan transfer masuk.
// Campaign yang sudah "completed"/"closed" boleh berbagi kode yang sama karena
// sudah tidak menerima donasi baru.
const ACTIVE_STATUSES = ["active", "awaiting_completion"];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin")
      return NextResponse.json({ error: "Hanya admin yang dapat membuat kampanye" }, { status: 403 });

    const body = await request.json();
    const {
      title, description, category, targetAmount,
      startDate, endDate, isUrgent, isPublic,
      paymentMethods, uniqueCode, images, location,
      dropOffLocation, qrisImageUrl,
    } = body;

    if (!title || !description || !category || !targetAmount || !startDate || !endDate)
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });

    // ⬅ FIX: sebelumnya uniqueCode hanya di-clamp ke rentang 0-999 tanpa
    // pengecekan apakah kode itu sudah dipakai campaign lain yang masih aktif.
    // Ini berisiko: dua campaign aktif dengan kode unik sama akan membuat
    // sistem salah mencocokkan transfer donasi ke campaign yang salah.
    // Fix: cek dulu ke database sebelum membuat campaign baru.
    const normalizedCode = Math.min(999, Math.max(0, Number(uniqueCode) || 0));

    const existingWithSameCode = await db.campaign.findFirst({
      where: {
        uniqueCode: normalizedCode,
        status: { in: ACTIVE_STATUSES },
      },
      select: { id: true, title: true },
    });

    if (existingWithSameCode) {
      return NextResponse.json(
        {
          error: `Kode unik ${String(normalizedCode).padStart(3, "0")} sudah dipakai oleh campaign aktif "${existingWithSameCode.title}". Silakan pilih kode lain.`,
        },
        { status: 409 }
      );
    }

    const campaign = await db.campaign.create({
      data: {
        title,
        description,
        category,
        location: location || null,
        dropOffLocation: dropOffLocation || null,
        targetAmount: Number(targetAmount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isUrgent: isUrgent || false,
        isPublic: isPublic ?? true,
        uniqueCode: normalizedCode,
        images: Array.isArray(images) && images.length > 0 ? JSON.stringify(images) : null,
        paymentMethods: Array.isArray(paymentMethods) && paymentMethods.length > 0
          ? JSON.stringify(paymentMethods)
          : null,
        qrisImageUrl: qrisImageUrl || null,
        createdBy: (session.user as { id: string }).id,
      },
    });

    return NextResponse.json({
      campaign: {
        ...campaign,
        images: campaign.images ? JSON.parse(campaign.images) : [],
        paymentMethods: campaign.paymentMethods ? JSON.parse(campaign.paymentMethods) : [],
      }
    }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}