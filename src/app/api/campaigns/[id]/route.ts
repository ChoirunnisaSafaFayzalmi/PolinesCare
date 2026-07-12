import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // ⬅ FIX: sama seperti di campaigns/route.ts — select creator diperluas
    // agar menyertakan email, phone, address (bukan cuma id/name/avatar),
    // supaya form Edit Campaign bisa menampilkan data pembuat asli campaign,
    // bukan fallback ke data admin yang sedang login.
    const campaign = await db.campaign.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true, phone: true, address: true, avatar: true } },
        donations: { select: { id: true, amount: true, status: true, createdAt: true } },
        fundUsages: { orderBy: { date: "desc" } },
      },
    });

    if (!campaign)
      return NextResponse.json({ error: "Kampanye tidak ditemukan" }, { status: 404 });

    const totalAmount = campaign.donations
      .filter((d) => d.status === "approved")
      .reduce((sum, d) => sum + d.amount, 0);
    const totalFundUsage = campaign.fundUsages.reduce((sum, f) => sum + f.amount, 0);

    return NextResponse.json({
      campaign: {
        ...campaign,
        images: campaign.images ? JSON.parse(campaign.images) : [],
        paymentMethods: campaign.paymentMethods ? JSON.parse(campaign.paymentMethods) : [],
      },
      stats: {
        totalDonations: campaign.donations.length,
        totalAmount,
        totalFundUsage,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Status campaign yang dianggap "masih berjalan" — kode uniknya tidak boleh
// bentrok satu sama lain karena masih dipakai untuk mencocokkan transfer masuk.
const ACTIVE_STATUSES = ["active", "awaiting_completion"];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin")
      return NextResponse.json({ error: "Hanya admin yang dapat mengubah kampanye" }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const {
      title, description, category, targetAmount,
      startDate, endDate, isUrgent, isPublic,
      paymentMethods, uniqueCode, images, status, location, dropOffLocation, qrisImageUrl,
    } = body;

    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Kampanye tidak ditemukan" }, { status: 404 });

    // ⬅ FIX: sebelumnya uniqueCode hanya di-clamp ke rentang 0-999 tanpa
    // pengecekan apakah kode itu sudah dipakai campaign lain yang masih aktif.
    // Fix: cek dulu ke database, tapi KECUALIKAN campaign yang sedang di-edit
    // ini sendiri (id tidak sama dengan `id` yang sedang diupdate) — supaya
    // admin tetap bisa menyimpan ulang campaign yang sama tanpa dianggap
    // "bentrok dengan dirinya sendiri".
    let normalizedCode: number | undefined;
    if (uniqueCode !== undefined) {
      normalizedCode = Math.min(999, Math.max(0, Number(uniqueCode) || 0));

      const existingWithSameCode = await db.campaign.findFirst({
        where: {
          uniqueCode: normalizedCode,
          status: { in: ACTIVE_STATUSES },
          id: { not: id },
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
    }

    const campaign = await db.campaign.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        location: location ?? null,
        dropOffLocation: dropOffLocation ?? null,
        ...(category && { category }),
        ...(targetAmount !== undefined && { targetAmount: Number(targetAmount) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status }),
        ...(isUrgent !== undefined && { isUrgent }),
        ...(isPublic !== undefined && { isPublic }),
        ...(normalizedCode !== undefined && { uniqueCode: normalizedCode }),
        // Selalu update images & paymentMethods (even if empty array = clear)
        images: Array.isArray(images) && images.length > 0 ? JSON.stringify(images) : null,
        paymentMethods: Array.isArray(paymentMethods) && paymentMethods.length > 0
          ? JSON.stringify(paymentMethods)
          : null,
        qrisImageUrl: qrisImageUrl || null,
      },
    });

    return NextResponse.json({
      campaign: {
        ...campaign,
        images: campaign.images ? JSON.parse(campaign.images) : [],
        paymentMethods: campaign.paymentMethods ? JSON.parse(campaign.paymentMethods) : [],
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin")
      return NextResponse.json({ error: "Hanya admin yang dapat menghapus kampanye" }, { status: 403 });

    const { id } = await params;
    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Kampanye tidak ditemukan" }, { status: 404 });

    await db.campaign.delete({ where: { id } });
    return NextResponse.json({ message: "Kampanye berhasil dihapus" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}