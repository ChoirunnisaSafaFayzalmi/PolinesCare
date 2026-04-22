import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// ============================================================
// RECOMMENDER SYSTEM - Polines Care
// Algorithm: Weighted scoring combining multiple signals
//   1. Content-based: User's preferred categories (from donation history)
//   2. Collaborative: Similar users' donation patterns
//   3. Popularity: Total donation count + amount
//   4. Recency: Newer campaigns get a boost
//   5. Urgency: Urgent campaigns get priority
//   6. Completion: Near-target campaigns get a boost (FOMO effect)
// ============================================================

// Calculate a recommendation score for a campaign (0-100)
function calculateScore(campaign: {
  id: string;
  category: string;
  collectedAmount: number;
  targetAmount: number;
  createdAt: string;
  isUrgent: boolean;
  _count: { donations: number };
}, preferredCategories: string[], daysSinceCreation: number): number {
  let score = 0;
  const totalDonations = campaign._count.donations;
  const progress = campaign.targetAmount > 0 ? campaign.collectedAmount / campaign.targetAmount : 0;

  // 1. Category match (0-30 points)
  if (preferredCategories.includes(campaign.category)) {
    score += 30;
  }

  // 2. Popularity signal - donation count (0-20 points)
  score += Math.min(totalDonations * 4, 20);

  // 3. Progress momentum - campaigns near target get boost (0-15 points)
  // Sweet spot: 50-90% funded creates urgency
  if (progress >= 0.5 && progress < 0.9) {
    score += 15;
  } else if (progress >= 0.3 && progress < 0.5) {
    score += 10;
  } else if (progress >= 0.9) {
    score += 5; // Almost done, less urgency
  }

  // 4. Recency boost (0-15 points) - newer campaigns get higher score
  if (daysSinceCreation < 7) {
    score += 15;
  } else if (daysSinceCreation < 14) {
    score += 10;
  } else if (daysSinceCreation < 30) {
    score += 5;
  }

  // 5. Urgency bonus (0-20 points)
  if (campaign.isUrgent) {
    score += 20;
  }

  return Math.min(score, 100);
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Sangat Cocok untuk Anda";
  if (score >= 60) return "Rekomendasi Kuat";
  if (score >= 40) return "Cocok untuk Anda";
  if (score >= 20) return "Populer di Kampus";
  return "Campaign Terbaru";
}

// GET /api/recommendations - Personalized recommendations (requires auth)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode"); // "public" for unauthenticated access

    // ============================================================
    // PUBLIC MODE: Return trending + popular + urgent (no auth needed)
    // ============================================================
    if (mode === "public" || !session?.user) {
      const publicCampaigns = await db.campaign.findMany({
        where: { status: "active" },
        include: {
          creator: { select: { id: true, name: true } },
          _count: { select: { donations: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      // Calculate scores for public view (no personalization)
      const now = new Date();
      const scoredPublic = publicCampaigns.map((c) => {
        const daysSinceCreation = Math.floor(
          (now.getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        const score = calculateScore(c, [], daysSinceCreation);
        return { ...c, score, reason: getScoreLabel(score) };
      });

      // Sort by score descending
      scoredPublic.sort((a, b) => b.score - a.score);

      return NextResponse.json({
        recommendations: scoredPublic.slice(0, 8),
        trending: scoredPublic
          .filter((c) => c._count.donations > 0)
          .sort((a, b) => b._count.donations - a._count.donations)
          .slice(0, 4),
        popular: scoredPublic
          .sort((a, b) => b.collectedAmount - a.collectedAmount)
          .slice(0, 4),
        urgent: scoredPublic.filter((c) => c.isUrgent).slice(0, 3),
      });
    }

    // ============================================================
    // AUTHENTICATED MODE: Full personalized recommendations
    // ============================================================
    const userId = (session.user as { id: string }).id;

    // --- Step 1: Build user preference profile ---
    // 1a. From donation history (weight: high)
    const userDonations = await db.donation.findMany({
      where: { userId, status: "approved" },
      select: {
        campaign: { select: { category: true } },
        amount: true,
      },
      distinct: ["campaignId"],
    });

    const categoryFrequency: Record<string, number> = {};
    userDonations.forEach((d: { campaign: { category: string }; amount: number }) => {
      const cat = d.campaign.category;
      categoryFrequency[cat] = (categoryFrequency[cat] || 0) + d.amount;
    });

    // 1b. From explicit user preferences
    const userPrefs = await db.userPreference.findMany({
      where: { userId },
    });
    userPrefs.forEach((p: { category: string; weight: number }) => {
      categoryFrequency[p.category] = (categoryFrequency[p.category] || 0) + p.weight * 100000;
    });

    // Normalize and sort categories by preference strength
    const preferredCategories = Object.entries(categoryFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([cat]) => cat);

    // --- Step 2: Collaborative filtering ---
    // Find similar users (users who donated to same categories)
    const similarUserIds = new Set<string>();
    if (preferredCategories.length > 0) {
      const similarDonations = await db.donation.findMany({
        where: {
          userId: { not: userId },
          status: "approved",
          campaign: { category: { in: preferredCategories } },
        },
        select: { userId: true, campaign: { select: { category: true } } },
        distinct: ["campaignId"],
        take: 50,
      });

      similarDonations.forEach((d: { userId: string }) => {
        similarUserIds.add(d.userId);
      });
    }

    // Find campaigns that similar users donated to but current user hasn't
    const userDonatedCampaignIds = (
      await db.donation.findMany({
        where: { userId },
        select: { campaignId: true },
      })
    ).map((d: { campaignId: string }) => d.campaignId);

    let collaborativeCampaignIds: string[] = [];
    if (similarUserIds.size > 0) {
      const collabDonations = await db.donation.findMany({
        where: {
          userId: { in: [...similarUserIds] },
          status: "approved",
          campaignId: { notIn: userDonatedCampaignIds },
        },
        select: { campaignId: true },
        distinct: ["campaignId"],
        take: 10,
      });
      collaborativeCampaignIds = collabDonations.map((d: { campaignId: string }) => d.campaignId);
    }

    // --- Step 3: Fetch all active campaigns and score them ---
    const allActiveCampaigns = await db.campaign.findMany({
      where: { status: "active" },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { donations: true } },
      },
    });

    const now = new Date();
    const scoredCampaigns = allActiveCampaigns.map((c) => {
      const daysSinceCreation = Math.floor(
        (now.getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Base score from multi-signal algorithm
      let score = calculateScore(c, preferredCategories, daysSinceCreation);

      // Collaborative filtering bonus (0-15 points)
      if (collaborativeCampaignIds.includes(c.id)) {
        score += 15;
      }

      // Already donated penalty (don't recommend what user already gave to)
      if (userDonatedCampaignIds.includes(c.id)) {
        score -= 25;
      }

      score = Math.max(0, Math.min(score, 100));

      // Generate reason
      let reason = getScoreLabel(score);
      const reasons: string[] = [];

      if (preferredCategories.includes(c.category)) {
        reasons.push(`Sesuai minat Anda (${c.category})`);
      }
      if (collaborativeCampaignIds.includes(c.id)) {
        reasons.push("Sering disukai donatur lain");
      }
      if (c.isUrgent) {
        reasons.push("⚠️ Butuh bantuan segera");
      }
      if (c._count.donations > 5) {
        reasons.push(`${c._count.donations} donatur telah berpartisipasi`);
      }
      const progress = c.targetAmount > 0 ? c.collectedAmount / c.targetAmount : 0;
      if (progress >= 0.7 && progress < 0.95) {
        reasons.push("Hampir mencapai target!");
      }

      if (reasons.length > 0) {
        reason = reasons.slice(0, 2).join(" • ");
      }

      return {
        ...c,
        score: Math.round(score),
        reason,
        matchPercentage: Math.round(score), // Alias for UI display
      };
    });

    // --- Step 4: Sort and categorize recommendations ---
    scoredCampaigns.sort((a, b) => b.score - a.score);

    // Split into personalized (high score) and trending (popular but not personalized)
    const personalized = scoredCampaigns.filter((c) => c.score >= 30).slice(0, 6);
    const trending = scoredCampaigns
      .filter((c) => c._count.donations > 0)
      .sort((a, b) => b._count.donations - a._count.donations)
      .slice(0, 4);
    const becauseYouLiked = scoredCampaigns
      .filter((c) => preferredCategories.includes(c.category) && !userDonatedCampaignIds.includes(c.id))
      .slice(0, 4);

    return NextResponse.json({
      recommendations: scoredCampaigns.slice(0, 10),
      personalized,
      trending,
      becauseYouLiked,
      preferredCategories,
      totalScored: scoredCampaigns.length,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
