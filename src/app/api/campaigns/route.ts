import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/campaigns - List campaigns with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const isUrgent = searchParams.get("urgent");

    const where: Record<string, unknown> = {};

    if (category && category !== "all") {
      where.category = category;
    }
    if (status && status !== "all") {
      where.status = status;
    }
    if (isUrgent === "true") {
      where.isUrgent = true;
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const campaigns = await db.campaign.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { donations: true },
        },
      },
      orderBy: [
        { isUrgent: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ campaigns });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/campaigns - Create campaign (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userRole = (session.user as { role?: string }).role;
    if (userRole !== "admin") {
      return NextResponse.json(
        { error: "Hanya admin yang dapat membuat kampanye" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, category, targetAmount, startDate, endDate, image, isUrgent } = body;

    if (!title || !description || !category || !targetAmount || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const campaign = await db.campaign.create({
      data: {
        title,
        description,
        category,
        targetAmount: Number(targetAmount),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        image: image || null,
        isUrgent: isUrgent || false,
        createdBy: (session.user as { id: string }).id,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
