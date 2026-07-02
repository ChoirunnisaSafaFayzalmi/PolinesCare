import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/proposals/my - Get current user's proposals
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { proposedBy: userId };
    if (status && status !== "all") {
      where.status = status;
    }

    const proposals = await db.proposal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        targetAmount: true,
        status: true,
        rejectionReason: true,
        resubmittedFrom: true,
        votesCount: true,
        startDate: true,
        endDate: true,
        campaignLocation: true,
        officialDocUrl: true,
        photoUrls: true,
        proposerName: true,
        proposerEmail: true,
        proposerPhone: true,
        proposerAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ proposals });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}