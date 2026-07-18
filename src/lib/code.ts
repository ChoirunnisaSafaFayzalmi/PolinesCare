import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ── Generate & assign uniqueCode campaign secara OTOMATIS di server ──
//
// Dipakai dari SEMUA jalur pembuatan campaign:
//   1. POST /api/campaigns                    (Buat Campaign Baru — manual)
//   2. PUT  /api/proposals/[id]  (status=approved)  (auto-create dari Ajuan)
//
// Admin TIDAK PERNAH mengisi kode ini secara manual — field uniqueCode di
// body request dari client selalu DIABAIKAN, kode selalu di-generate di sini.
//
// Lapisan keamanan:
//   1. Sebelum create: scan campaign aktif, cari kode 000-999 terkecil yang
//      belum kepakai (mengurangi kemungkinan konflik di kasus normal).
//   2. Saat create: kalau tetap konflik (race condition — ada request lain
//      yang keburu ambil kode sama persis sebelum request ini commit),
//      partial unique index di database ("Campaign_uniqueCode_active_key")
//      akan menolak insert itu → Prisma melempar error P2002 → kita retry
//      dengan kode baru. Ini jaring pengaman yang benar-benar tidak bisa
//      ditembus, karena keunikannya dijamin oleh database, bukan aplikasi.
//
// PENTING: ACTIVE_STATUSES di sini HARUS selalu sinkron dengan kondisi WHERE
// pada partial unique index di migration SQL "campaign_unique_code_partial_index".
export const ACTIVE_STATUSES = ["active", "awaiting_completion"];

const MAX_CODE = 999;
export const MAX_RETRY = 5;

// ⬅ FIX: tambah param excludeCampaignId. Dipakai saat re-check kode milik
// campaign yang SUDAH ADA (kasus reactivate: completed → active), supaya
// campaign itu sendiri tidak dihitung sebagai "bentrok" terhadap kodenya
// sendiri saat scan campaign aktif lain.
export async function getNextAvailableCode(excludeCampaignId?: string): Promise<number> {
  const used = await db.campaign.findMany({
    where: {
      status: { in: ACTIVE_STATUSES },
      ...(excludeCampaignId && { id: { not: excludeCampaignId } }),
    },
    select: { uniqueCode: true },
  });
  const usedSet = new Set(used.map((c) => c.uniqueCode));

  for (let code = 0; code <= MAX_CODE; code++) {
    if (!usedSet.has(code)) return code;
  }

  throw new Error(
    "Semua 1000 kode unik (000-999) sedang dipakai oleh campaign aktif. " +
    "Tutup/selesaikan beberapa campaign terlebih dahulu sebelum membuat yang baru."
  );
}

export function isUniqueCodeConflict(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}

/**
 * Membuat campaign baru dengan uniqueCode yang di-generate OTOMATIS.
 * `data` TIDAK BOLEH menyertakan uniqueCode — kalau ada, akan ditimpa.
 * Dipanggil dari dalam try/catch di caller seperti biasa; error lain
 * (bukan soal kode) akan tetap dilempar apa adanya ke caller.
 */
export async function createCampaignWithAutoCode(
  data: Omit<Prisma.CampaignCreateInput, "uniqueCode">
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const uniqueCode = await getNextAvailableCode();
    try {
      return await db.campaign.create({
        data: { ...data, uniqueCode },
      });
    } catch (err) {
      if (isUniqueCodeConflict(err)) {
        lastError = err;
        continue; // race condition — request lain keburu ambil kode ini, coba lagi
      }
      throw err;
    }
  }

  throw new Error(
    "Gagal membuat campaign: tidak berhasil mendapatkan kode unik setelah beberapa percobaan. Coba lagi.",
    { cause: lastError }
  );
}

/**
 * ⬅ FIX (baru): dipanggil HANYA saat campaign bertransisi dari status
 * non-aktif (mis. "completed") KEMBALI ke status aktif ("active" /
 * "awaiting_completion").
 *
 * Latar belakang: kode milik campaign yang sudah "completed" dianggap bebas
 * dan boleh dipakai ulang oleh campaign lain yang sedang aktif (lihat
 * getNextAvailableCode — hanya scan status ACTIVE_STATUSES). Konsekuensinya,
 * begitu campaign lama ini diaktifkan lagi, kode yang dulu dipegangnya bisa
 * jadi sudah "dipinjam" campaign lain yang aktif duluan. Fungsi ini
 * memastikan hal itu tidak menghasilkan duplikat:
 *   - Kalau kode lama masih aman (tidak dipakai campaign aktif lain) →
 *     kode dipertahankan, tidak berubah.
 *   - Kalau kode lama sudah bentrok → kode baru di-generate.
 */
export async function resolveUniqueCodeOnActivate(
  campaignId: string,
  currentCode: number
): Promise<number> {
  const conflict = await db.campaign.findFirst({
    where: {
      status: { in: ACTIVE_STATUSES },
      uniqueCode: currentCode,
      id: { not: campaignId },
    },
    select: { id: true },
  });

  if (!conflict) return currentCode; // aman, tidak ada bentrok, kode tetap sama

  return getNextAvailableCode(campaignId);
}