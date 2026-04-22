import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/stats - Get overall platform statistics
export async function GET() {
  try {
    const [
      totalCampaigns,
      activeCampaigns,
      closedCampaigns,
      completedCampaigns,
      totalDonations,
      approvedDonations,
      pendingDonations,
      rejectedDonations,
      totalUsers,
      totalProposals,
      pendingProposals,
      approvedProposals,
    ] = await Promise.all([
      db.campaign.count(),
      db.campaign.count({ where: { status: "active" } }),
      db.campaign.count({ where: { status: "closed" } }),
      db.campaign.count({ where: { status: "completed" } }),
      db.donation.count(),
      db.donation.count({ where: { status: "approved" } }),
      db.donation.count({ where: { status: "pending" } }),
      db.donation.count({ where: { status: "rejected" } }),
      db.user.count(),
      db.proposal.count(),
      db.proposal.count({ where: { status: "pending" } }),
      db.proposal.count({ where: { status: "approved" } }),
    ]);

    // Calculate total amount from approved donations
    const amountResult = await db.donation.aggregate({
      where: { status: "approved" },
      _sum: { amount: true },
    });

    // Calculate total collected across campaigns
    const collectedResult = await db.campaign.aggregate({
      _sum: { collectedAmount: true },
    });

    // Get campaigns by category
    const campaignsByCategory = await db.campaign.groupBy({
      by: ["category"],
      _count: true,
    });

    // Get donations by type
    const donationsByType = await db.donation.groupBy({
      by: ["type"],
      _count: true,
    });

    // Recent donations (last 5)
    const recentDonations = await db.donation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        campaign: {
          select: { title: true },
        },
        user: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
        closed: closedCampaigns,
        completed: completedCampaigns,
        byCategory: campaignsByCategory,
      },
      donations: {
        total: totalDonations,
        approved: approvedDonations,
        pending: pendingDonations,
        rejected: rejectedDonations,
        totalAmount: amountResult._sum.amount || 0,
        totalCollected: collectedResult._sum.collectedAmount || 0,
        byType: donationsByType,
      },
      users: {
        total: totalUsers,
      },
      proposals: {
        total: totalProposals,
        pending: pendingProposals,
        approved: approvedProposals,
      },
      recentDonations,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
