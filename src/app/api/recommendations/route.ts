import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth"; // Pastikan ini sesuai dengan setup NextAuth kamu

// ============================================================
// AI HYBRID RECOMMENDER SYSTEM - Polines Care
// Algoritma: Weighted Hybrid Recommender System (Skala 0-100)
// Terdiri dari 3 Engine Utama:
//   1. Content-Based (30%): Kesesuaian Kategori Minat
//   2. Collaborative (20%): Perilaku Donatur Serupa (Similar Users)
//   3. Popularity & Context (50%): Tren Donasi, Urgensi, & Recency
// ============================================================

interface CampaignData {
  id: string;
  category: string;
  collectedAmount: number;
  targetAmount: number;
  createdAt: Date;
  isUrgent: boolean;
  _count: { donations: number };
}

// 🧮 FUNGSI PENGHITUNG SKOR HYBRID (AI Engine)
function calculateHybridScore(
  campaign: CampaignData,
  preferredCategories: string[],
  collaborativeCampaignIds: string[],
  daysSinceCreation: number
): number {
  let score = 0;

  // --- 1. ENGINE CONTENT-BASED (Maks 30 Poin) ---
  if (preferredCategories.includes(campaign.category)) {
    score += 30; // Sangat cocok dengan riwayat/minat donatur
  }

  // --- 2. ENGINE COLLABORATIVE (Maks 20 Poin) ---
  // Jika campaign ini juga didonasikan oleh orang-orang yang seleranya mirip
  if (collaborativeCampaignIds.includes(campaign.id)) {
    score += 20;
  }

  // --- 3. ENGINE POPULARITY & CONTEXT (Maks 50 Poin) ---
  const totalDonations = campaign._count.donations;
  const progress = campaign.targetAmount > 0 ? campaign.collectedAmount / campaign.targetAmount : 0;

  // A. Tren Popularitas (Maks 15 poin) -> 1 donatur = 3 poin
  score += Math.min(totalDonations * 3, 15);

  // B. Urgensi dari Admin (Maks 15 poin)
  if (campaign.isUrgent) {
    score += 15;
  }

  // C. Recency / Kebaruan (Maks 10 poin)
  if (daysSinceCreation < 7) {
    score += 10;
  } else if (daysSinceCreation < 14) {
    score += 5;
  }

  // D. Momentum / Psikologi FOMO (Maks 10 poin)
  // Campaign yang hampir selesai (50%-90%) biasanya lebih memicu orang berdonasi
  if (progress >= 0.5 && progress < 0.9) {
    score += 10;
  } else if (progress >= 0.3 && progress < 0.5) {
    score += 5;
  }

  return Math.min(Math.round(score), 100);
}

// Fungsi pelabelan otomatis berdasarkan AI Score
function getScoreLabel(score: number): string {
  if (score >= 80) return "Sangat Cocok untuk Anda 🎯";
  if (score >= 60) return "Rekomendasi Kuat ⭐";
  if (score >= 40) return "Sedang Tren 🔥";
  if (score >= 20) return "Populer di Kampus 🏫";
  return "Campaign Terbaru 🆕";
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode");

    // ============================================================
    // MODE PUBLIK (Tanpa Login) - Hanya menggunakan Popularity Engine
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

      const now = new Date();
      const scoredPublic = publicCampaigns.map((c) => {
        const daysSinceCreation = Math.floor(
          (now.getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        // User publik tidak punya data minat, kirim array kosong []
        const score = calculateHybridScore(c, [], [], daysSinceCreation);
        return { ...c, score, reason: getScoreLabel(score) };
      });

      // FIX: .sort() mutates the array in place. Sorting scoredPublic multiple
      // times for different properties (trending, popular) would overwrite the
      // score-based order needed for `recommendations`. Each property now sorts
      // its own copy via [...array] so they stay independent.
      const byScore = [...scoredPublic].sort((a, b) => b.score - a.score);
      const byDonationCount = [...scoredPublic]
        .filter((c) => c._count.donations > 0)
        .sort((a, b) => b._count.donations - a._count.donations);
      const byCollectedAmount = [...scoredPublic].sort((a, b) => b.collectedAmount - a.collectedAmount);

      return NextResponse.json({
        recommendations: byScore.slice(0, 8),
        trending: byDonationCount.slice(0, 4),
        popular: byCollectedAmount.slice(0, 4),
        urgent: scoredPublic.filter((c) => c.isUrgent).slice(0, 3),
      });
    }

    // ============================================================
    // MODE AUTHENTICATED - FULL AI HYBRID RECOMMENDER
    // ============================================================
    const userId = (session.user as { id: string }).id;

    // --- TAHAP 1: EKSTRAKSI PROFIL MINAT (Content-Based) ---
    // FIX: tambahkan campaignId: true agar userDonatedCampaignIds terisi dengan benar
    const userDonations = await db.donation.findMany({
      where: { userId, status: "approved" },
      select: {
        campaignId: true,
        campaign: { select: { category: true } },
        amount: true,
      },
    });

    const categoryFrequency: Record<string, number> = {};

    // Minat Implisit (dari riwayat transaksi)
    userDonations.forEach((d) => {
      const cat = d.campaign.category;
      categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1; // Hitung frekuensi, bukan nominalnya agar lebih adil
    });

    // Minat Eksplisit (dari UserPreference)
    const userPrefs = await db.userPreference.findMany({ where: { userId } });
    userPrefs.forEach((p) => {
      categoryFrequency[p.category] = (categoryFrequency[p.category] || 0) + p.weight * 2; // Preferensi eksplisit diberi bobot ganda
    });

    // Urutkan kategori favorit
    const preferredCategories = Object.entries(categoryFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([cat]) => cat);

    // 🔍 DEBUG: hapus setelah masalah ketemu
    console.log("[DEBUG] userId:", userId);
    console.log("[DEBUG] userDonations count:", userDonations.length);
    console.log("[DEBUG] userDonations raw:", JSON.stringify(userDonations));
    console.log("[DEBUG] preferredCategories:", preferredCategories);

    // --- TAHAP 2: EKSTRAKSI PERILAKU SOSIAL (Collaborative Filtering) ---
    // Sekarang campaignId terisi dengan benar (bukan undefined lagi)
    const userDonatedCampaignIds = userDonations.map((d) => d.campaignId);
    let collaborativeCampaignIds: string[] = [];

    if (preferredCategories.length > 0) {
      // Cari donatur lain yang mendonasi di kategori yang sama dengan user
      const similarDonations = await db.donation.findMany({
        where: {
          userId: { not: userId },
          status: "approved",
          campaign: { category: { in: preferredCategories } },
        },
        select: { userId: true },
        distinct: ["userId"],
        take: 20,
      });

      const similarUserIds = similarDonations.map((d) => d.userId);

      // Cari campaign apa saja yang didonasikan oleh 'similar users' tersebut
      if (similarUserIds.length > 0) {
        const collabDonations = await db.donation.findMany({
          where: {
            userId: { in: similarUserIds },
            status: "approved",
            campaignId: { notIn: userDonatedCampaignIds }, // Sekarang filter ini benar-benar bekerja
          },
          select: { campaignId: true },
          distinct: ["campaignId"],
          take: 10,
        });
        collaborativeCampaignIds = collabDonations.map((d) => d.campaignId);
      }
    }

    // --- TAHAP 3: KALKULASI SKOR HYBRID FINAL ---
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

      // 🧠 Lempar ke Engine AI
      let score = calculateHybridScore(c, preferredCategories, collaborativeCampaignIds, daysSinceCreation);

      // Pinalti: Kurangi skor drastis jika user sudah pernah donasi ke sini (biar platform lebih bervariasi)
      // Sekarang perbandingan ini valid karena userDonatedCampaignIds berisi ID asli, bukan undefined
      if (userDonatedCampaignIds.includes(c.id)) {
        score -= 40;
      }

      score = Math.max(0, Math.min(score, 100)); // Pastikan skor tetap di range 0-100

      // Generator Alasan Dinamis (Bagus untuk UI)
      let reason = getScoreLabel(score);
      const reasons: string[] = [];

      if (preferredCategories.includes(c.category)) reasons.push(`Berdasarkan minat Anda (${c.category})`);
      if (collaborativeCampaignIds.includes(c.id)) reasons.push("Banyak didonasikan oleh pengguna serupa");
      if (c.isUrgent) reasons.push("⚠️ Kebutuhan Mendesak");
      if (c._count.donations > 10) reasons.push("🔥 Sedang Trending");

      if (reasons.length > 0) {
        reason = reasons.slice(0, 2).join(" • "); // Gabungkan maksimal 2 alasan agar UI rapi
      }

      return {
        ...c,
        score,
        reason,
        matchPercentage: score, // Untuk ditampilkan sebagai progress bar di UI
      };
    });

    // --- TAHAP 4: PENGELOMPOKAN HASIL REKOMENDASI ---
    scoredCampaigns.sort((a, b) => b.score - a.score);

    // 🔍 DEBUG: hapus setelah masalah ketemu
    console.log("[DEBUG] all scores:", scoredCampaigns.map((c) => ({ title: c.title, category: c.category, score: c.score })));

    const personalized = scoredCampaigns.filter((c) => c.score >= 50).slice(0, 6);
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
    const message = error instanceof Error ? error.message : "Terjadi kesalahan internal";
    console.error("AI Hybrid Recommender Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}