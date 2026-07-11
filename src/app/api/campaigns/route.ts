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

    const campaigns = await db.campaign.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, avatar: true } },
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
        uniqueCode: Math.min(999, Math.max(0, Number(uniqueCode) || 0)),
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