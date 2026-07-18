import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// ============================================================
// AI HYBRID RECOMMENDER SYSTEM - Polines Care
//
// Algoritma:
// Weighted Hybrid Recommender System (Skala 0–100)
//
// Referensi konsep:
// Burke (2002) - Hybrid Recommender Systems:
// Survey and Experiments.
//
// ============================================================
// ⬅ exclusion logic becauseYouLiked/CF
//   (lihat histori komentar di bawah untuk detail lengkap; tidak diubah
//   pada revisi ini).
//
// ⬅ FIX: Collaborative Filtering (section
// "collaborative") tidak membedakan campaign yang KATEGORINYA sesuai
// minat user vs campaign LINTAS KATEGORI. Akibatnya urutan ranking di
// dalam section ini murni ditentukan oleh contextComponent (popularity/
// urgency/recency/momentum, maks 50 poin) — campaign lintas kategori
// yang kebetulan urgent/trending bisa mengalahkan campaign yang kategorinya
// justru sesuai riwayat donasi user. Ini keliru: kalau user pernah
// donasi ke campaign kategori "Sosial", campaign LAIN kategori "Sosial"
// yang direkomendasikan lewat CF seharusnya diprioritaskan dibanding
// campaign kategori "Bencana" meski skor context-nya lebih tinggi.
//
// Fix: skema FLOOR + VARIASI (sama seperti pola yang sudah dipakai di
// becauseYouLiked untuk kasus repeat-donation) diterapkan di sini juga.
// Campaign hasil CF yang kategorinya cocok dengan preferredCategories
// diberi floor 50, lalu bervariasi 50-100 berdasarkan context. Campaign
// CF yang lintas kategori dibatasi 0-49. Ini menjamin category-match
// SELALU menang secara konstruksi, bukan cuma "biasanya".
//
// Konsekuensi ikutan: karena range skor collaborativeRaw sekarang naik
// dari maks 70 jadi maks 100, konstanta CF_SECTION_MAX (dipakai untuk
// normalisasi skor hybrid di section Personalized) ikut diubah ke 100.
// CBF_SECTION_MAX juga dikoreksi ke 100 karena skor becauseYouLiked untuk
// campaign yang sudah didonasikan (floor 85-100) sebenarnya sudah lama
// melebihi 80 — nilai lama (80) di luar konteks fix CF ini, tapi memang
// salah dan ikut dibetulkan supaya normalisasi hybrid konsisten.
// ============================================================
function normalizeCategory(category: string): string {
  return category.trim().toLowerCase();
}

function isRecurringCategory(category: string): boolean {
  return normalizeCategory(category).includes("rutin");
}

interface CampaignData {
  id: string;
  category: string;
  collectedAmount: number;
  targetAmount: number;
  createdAt: Date;
  isUrgent: boolean;
  _count: { donations: number };
}

// ------------------------------------------------------------
// Komponen skor dipecah jadi 3 fungsi terpisah (sebelumnya jadi satu
// fungsi calculateHybridScore) supaya bisa dikombinasikan berbeda-beda
// per section (CBF pakai cbf+context, CF pakai cf+context, Hybrid pakai
// alpha-weighted keduanya).
// ------------------------------------------------------------

// Content-Based Filtering — maks 30 poin
function getCbfComponent(campaign: CampaignData, preferredCategories: string[]): number {
  return preferredCategories.includes(normalizeCategory(campaign.category)) ? 30 : 0;
}

// Neighborhood-Based Collaborative Filtering — maks 20 poin
function getCfComponent(campaign: CampaignData, collaborativeCampaignIds: string[]): number {
  return collaborativeCampaignIds.includes(campaign.id) ? 20 : 0;
}

// Context-Aware Factors — maks 50 poin
// (Popularity 15, Urgency 15, Recency 10, Progress Momentum 10)
function getContextComponent(campaign: CampaignData, daysSinceCreation: number): number {
  const totalDonations = campaign._count.donations;
  const progress =
    campaign.targetAmount > 0 ? campaign.collectedAmount / campaign.targetAmount : 0;

  let score = 0;
  score += Math.min(totalDonations * 3, 15); // A. Tren Popularitas
  if (campaign.isUrgent) score += 15; // B. Urgensi
  if (daysSinceCreation < 7) score += 10; // C. Recency
  else if (daysSinceCreation < 14) score += 5;
  if (progress >= 0.5 && progress < 0.9) score += 10; // D. Momentum/FOMO
  else if (progress >= 0.3 && progress < 0.5) score += 5;

  return score;
}

// Dipakai untuk mode publik (tanpa login) — kombinasi penuh 3 komponen,
// perilaku sama seperti sebelumnya.
function calculateHybridScore(
  campaign: CampaignData,
  preferredCategories: string[],
  collaborativeCampaignIds: string[],
  daysSinceCreation: number
): number {
  const score =
    getCbfComponent(campaign, preferredCategories) +
    getCfComponent(campaign, collaborativeCampaignIds) +
    getContextComponent(campaign, daysSinceCreation);
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

// Boost skor untuk campaign yang sudah pernah didonasikan user, khusus
// di section CBF (repeat-donation opportunity). Kategori "Donasi Rutin"
// dapat boost lebih besar karena probabilitas donasi ulang jauh lebih
// tinggi secara definisi kategorinya.
const REPEAT_DONATION_BOOST = 8;
const REPEAT_DONATION_BOOST_RECURRING = 15;

// Bobot alpha untuk Hybrid: alpha = porsi Collaborative Filtering.
// alpha > 0.5 supaya CF berkontribusi lebih besar ke skor akhir hybrid,
// sesuai kesepakatan ("> 50% dari collaborative").
const HYBRID_ALPHA = 0.6;

// ⬅ FIX: sebelumnya 80 dan 70. Karena becauseYouLiked (floor 85-100 untuk
// campaign yang sudah didonasikan) dan collaborativeRaw (floor 50-100
// untuk category-match, lihat CF_SAME_CATEGORY_FLOOR di bawah) sama-sama
// bisa mencapai skor 100, kedua konstanta normalisasi ini disamakan ke
// 100 supaya cfNormalized/cbfNormalized di TAHAP 4c tidak pernah > 1.
const CBF_SECTION_MAX = 100; // sebelumnya 80 (30 cbf + 50 context) — tidak akurat krn ada floor 85-100
const CF_SECTION_MAX = 100; // sebelumnya 70 (20 cf + 50 context) — tidak akurat krn ada floor 50-100

// ⬅ BARU: floor untuk campaign hasil CF yang kategorinya cocok dengan
// preferredCategories user. Menjamin campaign se-kategori SELALU
// mengungguli campaign lintas kategori di section collaborative,
// terlepas dari seberapa tinggi context-score (popularity/urgency/dst)
// campaign lintas kategori tsb.
const CF_SAME_CATEGORY_FLOOR = 50;

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
        where: { status: "active", isPublic: true },
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
    // TAHAP 1 — USER PROFILE CONSTRUCTION (Content-Based Filtering)
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

    userDonations.forEach((d) => {
      const cat = normalizeCategory(d.campaign.category);
      categoryFrequency[cat] = (categoryFrequency[cat] || 0) + 1;
    });

    const userPrefs = await db.userPreference.findMany({ where: { userId } });
    userPrefs.forEach((p) => {
      const cat = normalizeCategory(p.category);
      categoryFrequency[cat] = (categoryFrequency[cat] || 0) + p.weight * 2;
    });

    const preferredCategories = Object.entries(categoryFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([cat]) => cat);

    // -------------------------------------------------------
    // TAHAP 2 — NEIGHBORHOOD-BASED COLLABORATIVE FILTERING
    //
    // Similarity antar-user dibangun dari CO-DONATION ke CAMPAIGN YANG
    // SAMA PERSIS (bukan overlap kategori — kategori terlalu longgar
    // karena satu kategori bisa berisi banyak campaign berbeda).
    // -------------------------------------------------------
    const userDonatedCampaignIds = userDonations.map((d) => d.campaignId);
    let collaborativeCampaignIds: string[] = [];

    if (userDonatedCampaignIds.length > 0) {
      // Langkah 1
      // Identifikasi similar users: user lain yang pernah donasi ke
      // salah satu campaign yang sama dengan riwayat target user.
      const coDonations = await db.donation.findMany({
        where: {
          userId: { not: userId },
          status: "approved",
          campaignId: { in: userDonatedCampaignIds },
        },
        select: { userId: true },
        distinct: ["userId"],
      });

      const similarUserIds = coDonations.map((d) => d.userId);

      // Langkah 2
      // Ambil campaign LAIN yang pernah didonasikan similar users,
      // yang belum pernah didonasikan target user. CF tetap exclude
      // campaign yang sudah pernah didonasikan target user — nilai CF
      // adalah discovery campaign yang belum dicoba.
      if (similarUserIds.length > 0) {
        const collabDonations = await db.donation.findMany({
          where: {
            userId: { in: similarUserIds },
            status: "approved",
            campaignId: { notIn: userDonatedCampaignIds },
          },
          select: { campaignId: true },
          distinct: ["campaignId"],
        });
        collaborativeCampaignIds = collabDonations.map((d) => d.campaignId);
      }
    }

    // -------------------------------------------------------
    // TAHAP 3 — HITUNG KOMPONEN SKOR PER CAMPAIGN
    // -------------------------------------------------------
    const allActiveCampaigns = await db.campaign.findMany({
      where: { status: "active", isPublic: true },
      include: {
        creator: { select: { id: true, name: true } },
        _count: { select: { donations: true } },
      },
    });

    const now = new Date();
    const withComponents = allActiveCampaigns.map((c) => {
      const daysSinceCreation = Math.floor(
        (now.getTime() - new Date(c.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return {
        ...c,
        cbfComponent: getCbfComponent(c, preferredCategories),
        cfComponent: getCfComponent(c, collaborativeCampaignIds),
        contextComponent: getContextComponent(c, daysSinceCreation),
        isDonated: userDonatedCampaignIds.includes(c.id),
        // ⬅ BARU: dipakai di TAHAP 4b untuk floor CF berbasis kategori.
        categoryMatch: preferredCategories.includes(normalizeCategory(c.category)),
      };
    });

    // -------------------------------------------------------
    // TAHAP 4a — CONTENT-BASED FILTERING (becauseYouLiked)
    //
    // Kategori sesuai minat user, TERMASUK campaign yang sudah pernah
    // didonasikan (repeat opportunity — masih aktif berarti masih butuh
    // dana).
    //
    // Skema FLOOR + VARIASI: campaign yang sudah pernah didonasikan
    // diberi skor dasar (floor) yang SECARA KONSTRUKSI selalu lebih
    // tinggi daripada skor maksimum campaign non-donasi (maks 80 = 30
    // cbf + 50 context). Floor 85 (90 untuk kategori Donasi Rutin)
    // menjamin: skor donated (85-100) SELALU > skor non-donated (30-80).
    // -------------------------------------------------------
    const becauseYouLiked = withComponents
      .filter((c) => c.cbfComponent > 0)
      .map((c) => {
        const reasons: string[] = [];
        let score: number;

        if (c.isDonated) {
          const floor = isRecurringCategory(c.category) ? 90 : 85;
          const variation = Math.round((c.contextComponent / 50) * (100 - floor));
          score = floor + variation; // 85-100 (biasa) / 90-100 (Donasi Rutin)
          reasons.push("Sudah pernah Anda donasikan");
        } else {
          score = c.cbfComponent + c.contextComponent; // 30-80
        }
        score = Math.min(Math.round(score), 100);

        reasons.push(`Berdasarkan minat Anda (${c.category})`);
        if (c.isUrgent) reasons.push("⚠️ Kebutuhan Mendesak");

        return {
          ...c,
          score,
          matchPercentage: score,
          reason: reasons.slice(0, 2).join(" • "),
        };
      })
      .sort((a, b) => b.score - a.score);

    // -------------------------------------------------------
    // TAHAP 4b — NEIGHBORHOOD-BASED COLLABORATIVE FILTERING (collaborative)
    //
    // Campaign dari similar users, EXCLUDE yang sudah pernah didonasikan
    // user target (sudah dijamin dari query TAHAP 2, filter isDonated di
    // sini bersifat defensif/eksplisit).
    //
    // FIX: skema skor sebelumnya (cfComponent + context, maks 70) tidak
    // membedakan campaign yang kategorinya cocok dengan minat user vs
    // campaign lintas kategori — akibatnya ranking di section ini murni
    // ditentukan context-factor (popularity/urgency/dst), jadi campaign
    // lintas kategori yang urgent/trending bisa ngalahin campaign
    // se-kategori dengan riwayat donasi user.
    //
    // Sekarang dipakai skema FLOOR + VARIASI (sama seperti becauseYouLiked):
    // campaign hasil CF yang categoryMatch diberi floor 50, sisanya
    // bervariasi 50-100 mengikuti context. Campaign CF lintas kategori
    // dibatasi 0-49. Ini menjamin: skor same-category (50-100) SELALU
    // > skor cross-category (0-49), bukan cuma "biasanya lebih tinggi".
    // -------------------------------------------------------
    const collaborativeRaw = withComponents
      .filter((c) => c.cfComponent > 0 && !c.isDonated)
      .map((c) => {
        const reasons: string[] = ["Banyak didonasikan oleh pengguna serupa"];
        let score: number;

        if (c.categoryMatch) {
          const variation = Math.round(
            (c.contextComponent / 50) * (100 - CF_SAME_CATEGORY_FLOOR)
          );
          score = CF_SAME_CATEGORY_FLOOR + variation; // 50-100
          reasons.push(`Sesuai kategori favorit Anda (${c.category})`);
        } else {
          score = Math.round(
            (c.contextComponent / 50) * (CF_SAME_CATEGORY_FLOOR - 1)
          ); // 0-49
        }
        score = Math.min(Math.round(score), 100);

        if (c.isUrgent) reasons.push("⚠️ Kebutuhan Mendesak");

        return {
          ...c,
          score,
          matchPercentage: score,
          reason: reasons.slice(0, 2).join(" • "),
        };
      })
      .sort((a, b) => b.score - a.score);

    // -------------------------------------------------------
    // TAHAP 4c — WEIGHTED HYBRID (personalized)
    //
    // Candidate pool = UNION(becauseYouLiked, collaborativeRaw) — bukan
    // seluruh campaign aktif — supaya section ini selalu merepresentasikan
    // kombinasi sinyal personalisasi nyata (CBF dan/atau CF), bukan cuma
    // context-factor semata.
    //
    // Skor akhir = alpha-weighted antara komponen CF & CBF (masing-masing
    // dinormalisasi 0–1 dari skor maksimumnya), alpha = 0.6 (bobot CF
    // lebih besar dari CBF, sesuai kesepakatan).
    //
    // ⬅ Catatan fix: CBF_SECTION_MAX & CF_SECTION_MAX kini sama-sama 100
    // (lihat penjelasan di deklarasi konstanta di atas) supaya normalisasi
    // ini tidak pernah menghasilkan angka > 1.
    // -------------------------------------------------------
    const poolMap = new Map<
      string,
      (typeof withComponents)[number] & { cbfSectionScore: number; cfSectionScore: number }
    >();

    becauseYouLiked.forEach((c) => {
      poolMap.set(c.id, { ...c, cbfSectionScore: c.score, cfSectionScore: 0 });
    });
    collaborativeRaw.forEach((c) => {
      const existing = poolMap.get(c.id);
      if (existing) {
        existing.cfSectionScore = c.score;
      } else {
        poolMap.set(c.id, { ...c, cbfSectionScore: 0, cfSectionScore: c.score });
      }
    });

    const personalized = Array.from(poolMap.values())
      .map((c) => {
        const cfNormalized = c.cfSectionScore / CF_SECTION_MAX;
        const cbfNormalized = c.cbfSectionScore / CBF_SECTION_MAX;

        // ⬅ FIX: sebelumnya hybridScore = alpha*cf + (1-alpha)*cbf tanpa
        // renormalisasi. Akibatnya campaign CBF-only (cfSectionScore=0)
        // MUSTAHIL lolos threshold 50, karena porsi CBF di formula cuma
        // 40% (1-alpha) — bahkan skor CBF sempurna (100) cuma menghasilkan
        // hybrid 40. Sebaliknya, campaign CF-only otomatis lolos (skor CF
        // sempurna → hybrid 60). Ini merusak tujuan "union candidate pool",
        // karena separuh pool (yang CBF-only) jadi kandidat mati.
        //
        // Fix: bobot dinormalisasi ulang terhadap sinyal yang BENAR-BENAR
        // ada. Kalau cuma satu sinyal (CF-only atau CBF-only), skor itu
        // dipakai penuh (0-100) tanpa dipotong porsi alpha. Kalau dua-duanya
        // ada, tetap di-blend proporsional alpha=0.6 (CF lebih dominan),
        // sesuai kesepakatan awal.
        const cfWeight = c.cfSectionScore > 0 ? HYBRID_ALPHA : 0;
        const cbfWeight = c.cbfSectionScore > 0 ? 1 - HYBRID_ALPHA : 0;
        const totalWeight = cfWeight + cbfWeight;

        const hybridScore =
          totalWeight > 0
            ? Math.round(
                ((cfWeight * cfNormalized + cbfWeight * cbfNormalized) / totalWeight) * 100
              )
            : 0;

        const reasons: string[] = [];
        if (c.isDonated) reasons.push("Sudah pernah Anda donasikan");
        if (c.cbfSectionScore > 0) reasons.push(`Berdasarkan minat Anda (${c.category})`);
        if (c.cfSectionScore > 0) reasons.push("Banyak didonasikan oleh pengguna serupa");
        if (c.isUrgent) reasons.push("⚠️ Kebutuhan Mendesak");

        return {
          ...c,
          score: hybridScore,
          matchPercentage: hybridScore,
          reason:
            reasons.length > 0 ? reasons.slice(0, 2).join(" • ") : getScoreLabel(hybridScore),
        };
      })
      .filter((c) => c.score >= 50)
      .sort((a, b) => b.score - a.score);

    // -------------------------------------------------------
    // TAHAP 5 — SECTION INDEPENDEN (tanpa dedup lintas-section)
    //
    // Campaign yang sama BOLEH muncul di lebih dari satu section
    // sekaligus, supaya kontribusi masing-masing engine (CBF, CF,
    // Hybrid) selalu terlihat jelas ke user, bukan saling menyembunyikan.
    // -------------------------------------------------------

    return NextResponse.json({
      personalized, // → section "Rekomendasi Personal" (badge: Hybrid)
      becauseYouLiked, // → section "Karena Anda Suka" (badge: Content-Based)
      collaborative: collaborativeRaw, // → section "Pengguna Serupa Juga Donasi" (badge: Collaborative Filtering)
      preferredCategories,
      totalScored: withComponents.length,
      meta: {
        hasDonationHistory: userDonations.length > 0,
        hasNeighbors: collaborativeCampaignIds.length > 0,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan internal";
    console.error("AI Hybrid Recommender Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}