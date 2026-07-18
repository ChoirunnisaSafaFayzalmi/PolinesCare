import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  ACTIVE_STATUSES,
  resolveUniqueCodeOnActivate,
  getNextAvailableCode,
  isUniqueCodeConflict,
  MAX_RETRY,
} from "@/lib/code";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    const totalFundUsage = campaign.fundUsages.reduce((sum, f) => sum + (f.amount ?? 0), 0);

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
      paymentMethods, images, status, location, dropOffLocation, qrisImageUrl,
      // ⬅ uniqueCode SENGAJA tidak lagi dibaca dari body sama sekali.
      // Kode di-generate/dijaga otomatis oleh server (lihat lib/code.ts).
      // Kalau body tetap mengirim uniqueCode (form lama), nilai itu
      // diabaikan sepenuhnya di endpoint ini.
    } = body;

    const existing = await db.campaign.findUnique({ where: { id } });
    if (!existing)
      return NextResponse.json({ error: "Kampanye tidak ditemukan" }, { status: 404 });

    const nextStatus = status ?? existing.status;

    // ⬅ FIX: kode HANYA dicek ulang saat campaign bertransisi dari status
    // NON-aktif ke status AKTIF (mis. completed → active). Di luar kasus
    // itu, kode tetap immutable seperti desain awal — supaya donatur yang
    // sudah dikasih instruksi kode lama tidak dirugikan tanpa alasan.
    //
    // Kenapa perlu dicek ulang khusus saat reactivate: kode milik campaign
    // yang completed dianggap "bebas" dan boleh dipakai campaign aktif lain
    // (lihat getNextAvailableCode di lib/code.ts, hanya scan status aktif).
    // Jadi begitu campaign lama ini diaktifkan lagi, kodenya mungkin sudah
    // tidak "miliknya" lagi.
    let uniqueCode = existing.uniqueCode;
    const isReactivating =
      ACTIVE_STATUSES.includes(nextStatus) && !ACTIVE_STATUSES.includes(existing.status);

    if (isReactivating) {
      uniqueCode = await resolveUniqueCodeOnActivate(id, existing.uniqueCode);
    }

    let campaign;
    let attempt = 0;
    while (true) {
      try {
        campaign = await db.campaign.update({
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
            uniqueCode,
            images: Array.isArray(images) && images.length > 0 ? JSON.stringify(images) : null,
            paymentMethods: Array.isArray(paymentMethods) && paymentMethods.length > 0
              ? JSON.stringify(paymentMethods)
              : null,
            qrisImageUrl: qrisImageUrl || null,
          },
        });
        break;
      } catch (err) {
        // Race condition: campaign lain keburu ambil kode yang sama persis
        // sebelum update ini commit (dijaga partial unique index di DB).
        // Hanya relevan saat reactivate; kalau bukan reactivate, uniqueCode
        // tidak berubah jadi tidak mungkin memicu konflik ini.
        if (isReactivating && isUniqueCodeConflict(err) && attempt < MAX_RETRY - 1) {
          attempt++;
          uniqueCode = await getNextAvailableCode(id);
          continue;
        }
        throw err;
      }
    }

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