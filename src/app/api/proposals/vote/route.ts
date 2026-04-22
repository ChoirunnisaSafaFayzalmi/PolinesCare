import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST /api/proposals/vote - Toggle vote on a proposal
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await request.json();
    const { proposalId } = body;

    if (!proposalId) {
      return NextResponse.json(
        { error: "proposalId wajib diisi" },
        { status: 400 }
      );
    }

    const proposal = await db.proposal.findUnique({ where: { id: proposalId } });
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal tidak ditemukan" },
        { status: 404 }
      );
    }

    // Check if user already voted (using the @@unique constraint)
    const existingVote = await db.vote.findUnique({
      where: {
        proposalId_userId: {
          proposalId,
          userId,
        },
      },
    });

    if (existingVote) {
      // Remove vote (toggle off)
      await db.vote.delete({
        where: { id: existingVote.id },
      });

      await db.proposal.update({
        where: { id: proposalId },
        data: { votesCount: { decrement: 1 } },
      });

      return NextResponse.json({
        message: "Vote berhasil dihapus",
        voted: false,
        votesCount: proposal.votesCount - 1,
      });
    } else {
      // Add vote (toggle on)
      await db.vote.create({
        data: {
          proposalId,
          userId,
        },
      });

      await db.proposal.update({
        where: { id: proposalId },
        data: { votesCount: { increment: 1 } },
      });

      return NextResponse.json({
        message: "Vote berhasil ditambahkan",
        voted: true,
        votesCount: proposal.votesCount + 1,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
