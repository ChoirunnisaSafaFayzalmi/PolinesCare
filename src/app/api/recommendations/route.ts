import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// ============================================================
// AI HYBRID RECOMMENDER SYSTEM - Polines Care
//
// Algoritma:
// Weighted Hybrid Recommender System (Skala 0–100)
//
// Sistem menggunakan mekanisme weighted sum untuk menggabungkan
// tiga sumber sinyal rekomendasi:
//
// 1. Content-Based Filtering (maks 30 poin)
//    → Mencocokkan profil minat pengguna dengan atribut kategori campaign.
//
// 2. Neighborhood-Based Collaborative Filtering (maks 20 poin)
//    → Merekomendasikan campaign berdasarkan perilaku donatur lain
//      yang memiliki kemiripan kategori donasi.
//
// 3. Context-Aware Factors (maks 50 poin)
//    → Mempertimbangkan popularitas campaign, urgensi,
//      recency (kebaruan), dan progress penggalangan dana.
//
// Referensi konsep:
// Burke (2002) - Hybrid Recommender Systems:
// Survey and Experiments.
//
// ============================================================
//
// Pengelompokan hasil:
//
// personalized
// → Hasil Weighted Hybrid (skor ≥ 50)
//
// becauseYouLiked
// → Hasil Content-Based Filtering
//
// collaborative
// → Hasil Neighborhood-Based Collaborative Filtering
//
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
// ============================================================
// Weighted Hybrid Scoring Function
//
// Menggabungkan skor dari:
// - Content-Based Filtering
// - Neighborhood-Based Collaborative Filtering
// - Context-Aware Factors
//
// Seluruh komponen dijumlahkan menggunakan pendekatan
// weighted sum sehingga menghasilkan skor akhir 0–100.
// ============================================================
function calculateHybridScore(
  campaign: CampaignData,
  preferredCategories: string[],
  collaborativeCampaignIds: string[],
  daysSinceCreation: number
): number {
  let score = 0;

// ------------------------------------------------------------
// 1. Content-Based Filtering
//
// Mengukur kesesuaian antara:
//
// User Profile
//     vs
// Item Profile (kategori campaign)
//
// Jika kategori campaign termasuk kategori favorit pengguna,
// maka campaign memperoleh maksimum 30 poin.
// ------------------------------------------------------------
  if (preferredCategories.includes(campaign.category)) {
    score += 30;
  }

// ------------------------------------------------------------
// 2. Neighborhood-Based Collaborative Filtering
//
// Campaign memperoleh tambahan skor apabila campaign tersebut
// pernah didonasikan oleh pengguna lain yang memiliki
// kemiripan kategori donasi.
//
// Similarity dibangun menggunakan implicit similarity
// berdasarkan overlap kategori donasi.
// ------------------------------------------------------------
  if (collaborativeCampaignIds.includes(campaign.id)) {
    score += 20;
  }

// ------------------------------------------------------------
// 3. Context-Aware Factors
//
// Faktor kontekstual yang digunakan:
//
// • Popularity
// • Urgency
// • Recency
// • Progress Momentum
//
// Total kontribusi maksimum = 50 poin.
// ------------------------------------------------------------
  const totalDonations = campaign._count.donations;
  const progress =
    campaign.targetAmount > 0
      ? campaign.collectedAmount / campaign.targetAmount
      : 0;

  // A. Tren Popularitas (Maks 15 poin) — 1 donatur = 3 poin
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
    // MODE PUBLIK (Tanpa Login) — Hanya Popularity Engine
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
          (now.getTime() - new Date(c.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const score = calculateHybridScore(c, [], [], daysSinceCreation);
        return { ...c, score, reason: getScoreLabel(score) };
      });

      // Buat copy terpisah untuk tiap sorting agar tidak saling menimpa (array mutation fix)
      const byScore = [...scoredPublic].sort((a, b) => b.score - a.score);
      const byDonationCount = [...scoredPublic]
        .filter((c) => c._count.donations > 0)
        .sort((a, b) => b._count.donations - a._count.donations);
      const byCollectedAmount = [...scoredPublic].sort(
        (a, b) => b.collectedAmount - a.collectedAmount
      );

      return NextResponse.json({
        recommendations: byScore.slice(0, 8),
        trending: byDonationCount.slice(0, 4),
        popular: byCollectedAmount.slice(0, 4),
        urgent: scoredPublic.filter((c) => c.isUrgent).slice(0, 3),
      });
    }

    // ============================================================
    // MODE AUTHENTICATED — FULL AI HYBRID RECOMMENDER
    // ============================================================
    const userId = (session.user as { id: string }).id;

// -------------------------------------------------------
// TAHAP 1
// USER PROFILE CONSTRUCTION
// (Content-Based Filtering)
//
// Membangun profil minat pengguna menggunakan:
//
// • Implicit Feedback
//   Frekuensi histori donasi.
//
// • Explicit Feedback
//   Preferensi kategori pada tabel UserPreference.
//
// Hasil akhirnya berupa daftar kategori yang
// diurutkan berdasarkan tingkat preferensi.
// -------------------------------------------------------
    const userDonations = await db.donation.findMany({
      where: { userId, status: "approved" },
      select: {
        campaignId: true,
        campaign: { select: { category: true } },
        amount: true,
      },
    });

    const categoryFrequency: Record<string, number> = {};

    // Implicit Feedback
    // Profil dibangun dari frekuensi kategori
    // berdasarkan histori donasi pengguna.
    userDonations.forEach((d) => {
      const cat = d.campaign.category;
      categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;
    });

    // Explicit Feedback
    // Preferensi yang tersimpan pada UserPreference
    // diberi bobot lebih besar dibanding implicit feedback.
    const userPrefs = await db.userPreference.findMany({ where: { userId } });
    userPrefs.forEach((p) => {
      categoryFrequency[p.category] =
        (categoryFrequency[p.category] || 0) + p.weight * 2;
    });

    // Urutkan kategori favorit dari yang paling sering
    const preferredCategories = Object.entries(categoryFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([cat]) => cat);

// -------------------------------------------------------
// TAHAP 2
// NEIGHBORHOOD-BASED COLLABORATIVE FILTERING
//
// Langkah:
//
// 1. Menemukan pengguna lain yang memiliki
//    overlap kategori donasi.
//
// 2. Mengambil campaign yang pernah
//    mereka donasikan.
//
// 3. Campaign yang belum pernah didonasikan
//    oleh target user menjadi kandidat rekomendasi.
//
// Similarity dibangun menggunakan implicit
// category overlap, bukan cosine similarity.
// -------------------------------------------------------
    const userDonatedCampaignIds = userDonations.map((d) => d.campaignId);
    let collaborativeCampaignIds: string[] = [];

    if (preferredCategories.length > 0) {
      // Langkah 1
      // Identifikasi similar users berdasarkan
    // kesamaan kategori donasi.
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

    // Langkah 2
    // Ambil campaign dari similar users
    // yang belum pernah didonasikan
    // oleh target user.
      if (similarUserIds.length > 0) {
        const collabDonations = await db.donation.findMany({
          where: {
            userId: { in: similarUserIds },
            status: "approved",
            campaignId: { notIn: userDonatedCampaignIds },
          },
          select: { campaignId: true },
          distinct: ["campaignId"],
          take: 10,
        });
        collaborativeCampaignIds = collabDonations.map((d) => d.campaignId);
      }
    }

// -------------------------------------------------------
// TAHAP 3
// WEIGHTED HYBRID SCORING
//
// Seluruh campaign aktif dievaluasi menggunakan:
//
// Content-Based Filtering
// + Collaborative Filtering
// + Context-Aware Factors
//
// sehingga menghasilkan skor akhir
// pada rentang 0–100.
// -------------------------------------------------------
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
        (now.getTime() - new Date(c.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
// Hitung skor akhir menggunakan
// Weighted Hybrid Recommender System.
//
// Hybrid Score =
// Content-Based +
// Collaborative +
// Context-Aware Factors
      let score = calculateHybridScore(
        c,
        preferredCategories,
        collaborativeCampaignIds,
        daysSinceCreation
      );

      // Penalti: campaign yang sudah pernah didonasikan user tidak direkomendasikan lagi
      if (userDonatedCampaignIds.includes(c.id)) {
        score -= 40;
      }

      score = Math.max(0, Math.min(score, 100));

// Generate explanation
//
// Sistem menghasilkan alasan rekomendasi
// berdasarkan faktor yang benar-benar
// berkontribusi terhadap skor campaign.
      const reasons: string[] = [];
      if (preferredCategories.includes(c.category))
        reasons.push(`Berdasarkan minat Anda (${c.category})`);
      if (collaborativeCampaignIds.includes(c.id))
        reasons.push("Banyak didonasikan oleh pengguna serupa");
      if (c.isUrgent) reasons.push("⚠️ Kebutuhan Mendesak");
      if (c._count.donations > 10) reasons.push("🔥 Sedang Trending");

      const reason =
        reasons.length > 0
          ? reasons.slice(0, 2).join(" • ")
          : getScoreLabel(score);

      return {
        ...c,
        score,
        reason,
        matchPercentage: score,
      };
    });

// -------------------------------------------------------
// TAHAP 4
// HASIL REKOMENDASI
//
// Campaign yang telah diberi skor
// dikelompokkan menjadi:
//
// • Hybrid Recommendation
//
// • Content-Based Recommendation
//
// • Collaborative Recommendation
//
// Pengelompokan ini hanya memengaruhi
// penyajian pada antarmuka,
// bukan proses perhitungan skor.
// -------------------------------------------------------
    scoredCampaigns.sort((a, b) => b.score - a.score);

    // 🌟 HYBRID — campaign yang mendapat sinyal dari CBF + CF sekaligus (skor ≥ 50)
    const personalized = scoredCampaigns
      .filter((c) => c.score >= 50)
      .slice(0, 6);

    // 🏷️ CONTENT-BASED — campaign yang kategorinya cocok histori donasi user
    // (belum pernah didonasikan, murni dari engine CBF)
    const becauseYouLiked = scoredCampaigns
      .filter(
        (c) =>
          preferredCategories.includes(c.category) &&
          !userDonatedCampaignIds.includes(c.id)
      )
      .slice(0, 4);

    // 👥 COLLABORATIVE FILTERING — campaign dari user lain yang minatnya serupa
    // (belum pernah didonasikan, murni dari engine CF)
    const collaborative = scoredCampaigns
      .filter(
        (c) =>
          collaborativeCampaignIds.includes(c.id) &&
          !userDonatedCampaignIds.includes(c.id)
      )
      .slice(0, 4);

    return NextResponse.json({
      recommendations: scoredCampaigns.slice(0, 10),
      personalized,       // → ditampilkan sebagai section "Rekomendasi Personal" (badge: Hybrid)
      becauseYouLiked,    // → ditampilkan sebagai section "Karena Anda Suka" (badge: Content-Based)
      collaborative,      // → ditampilkan sebagai section "Pengguna Serupa Juga Donasi" (badge: Collaborative Filtering)
      preferredCategories,
      totalScored: scoredCampaigns.length,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan internal";
    console.error("AI Hybrid Recommender Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}