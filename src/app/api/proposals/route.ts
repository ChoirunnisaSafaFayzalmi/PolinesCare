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
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { votes: true },
        },
      },
      orderBy: [
        { votesCount: "desc" },
        { createdAt: "desc" },
      ],
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
    const { title, description, category, targetAmount } = body;

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
      },
    });

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
