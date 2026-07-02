import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Polines Care database...\n");

  // ============================================================
  // 1. USERS (Bawaan + Ekstrak dari JSON)
  // ============================================================
  const adminPassword = await bcrypt.hash("admin123", 10);
  const donaturPassword = await bcrypt.hash("donatur123", 10);

  // Admin Utama
  const admin = await prisma.user.upsert({
    where: { email: "admin@polines.ac.id" },
    update: {},
    create: {
      email: "admin@polines.ac.id",
      name: "Admin Polines Care",
      password: adminPassword,
      role: "admin",
      phone: "081234567890",
      isVerified: true,
    },
  });

  // List Donatur bawaan template proyek
  const donatur1 = await prisma.user.upsert({
    where: { email: "budi@polines.ac.id" },
    update: {},
    create: { email: "budi@polines.ac.id", name: "Budi Santoso", password: donaturPassword, role: "donatur", phone: "082345678901", isVerified: true },
  });

  const donatur2 = await prisma.user.upsert({
    where: { email: "siti@polines.ac.id" },
    update: {},
    create: { email: "siti@polines.ac.id", name: "Siti Aminah", password: donaturPassword, role: "donatur", phone: "083456789012", isVerified: true },
  });

  const donatur3 = await prisma.user.upsert({
    where: { email: "ahmad@polines.ac.id" },
    update: {},
    create: { email: "ahmad@polines.ac.id", name: "Ahmad Rizky", password: donaturPassword, role: "donatur", phone: "084567890123", isVerified: true },
  });

  const donatur4 = await prisma.user.upsert({
    where: { email: "dewi@polines.ac.id" },
    update: {},
    create: { email: "dewi@polines.ac.id", name: "Dewi Lestari", password: donaturPassword, role: "donatur", phone: "085678901234", isVerified: true },
  });

  const donatur5 = await prisma.user.upsert({
    where: { email: "raka@polines.ac.id" },
    update: {},
    create: { email: "raka@polines.ac.id", name: "Raka Pratama", password: donaturPassword, role: "donatur", phone: "086789012345", isVerified: true },
  });

  const demoPassword = await bcrypt.hash("demo123", 10);
  const donaturDemo = await prisma.user.upsert({
    where: { email: "donatur@demo.com" },
    update: {},
    create: { email: "donatur@demo.com", name: "Donatur Demo", password: demoPassword, role: "donatur", isVerified: true },
  });

  // --- MEMBACA DAN EKSTRAK DATA DARI 700 DATA EXCEL (donasi.json) ---
  const dataPath = path.join(__dirname, "donasi.json");
  if (!fs.existsSync(dataPath)) {
    throw new Error("File donasi.json tidak ditemukan! Jalankan 'node convert.js' terlebih dahulu di dalam folder prisma.");
  }
  const rawData = fs.readFileSync(dataPath, "utf-8");
  const dataset = JSON.parse(rawData);

  console.log(`📦 Mendeteksi ${dataset.length} data riwayat transaksi dari donasi.json`);

  // Registrasikan user-user unik dari Excel ke database agar terdaftar sebagai User valid
  const jsonUserNames = Array.from(new Set(dataset.map((d: any) => d.User)));
  const userMap: Record<string, any> = {};

  // Masukkan user bawaan ke map agar tidak tertimpa
  userMap["Budi Santoso"] = donatur1;
  userMap["Siti Aminah"] = donatur2;
  userMap["Ahmad Rizky"] = donatur3;
  userMap["Dewi Lestari"] = donatur4;
  userMap["Raka Pratama"] = donatur5;
  userMap["Donatur Demo"] = donaturDemo;

  for (const name of jsonUserNames) {
    if (!userMap[name as string]) {
      const emailObj = `${(name as string).toLowerCase().replace(/\s+/g, "")}@gmail.com`;
      const user = await prisma.user.upsert({
        where: { email: emailObj },
        update: {},
        create: {
          email: emailObj,
          name: name as string,
          password: donaturPassword,
          role: "donatur",
          phone: "08123456789",
          isVerified: true,
        },
      });
      userMap[name as string] = user;
    }
  }
  console.log(`✅ Akun default & ${jsonUserNames.length} user unik dari dataset berhasil dikonfigurasi.`);

  // ============================================================
  // 2. CAMPAIGNS (Bawaan + Dinamis dari Excel)
  // ============================================================
  const now = new Date();
  const daysAgo = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date;
  };
  const daysLater = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    return date;
  };

  // Buat map penampung campaign
  const campaignMap: Record<string, string> = {};

  // Buat campaign dinamis dari data Excel
  const jsonCampaignMapData = new Map();
  dataset.forEach((item: any) => {
    if (!jsonCampaignMapData.has(item.Campaign)) {
      jsonCampaignMapData.set(item.Campaign, {
        title: item.Campaign,
        category: item.Kategori || "Sosial",
        location: item.Lokasi || "Semarang",
      });
    }
  });

  // PERBAIKAN LOOPING CAMPAIGN: Memakai variabel tampung dinamis agar aman saat penambahan nilai nominal
  for (const cam of Array.from(jsonCampaignMapData.values())) {
    const idKey = `seed-${cam.title.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`;
    const campaign = await prisma.campaign.upsert({
      where: { id: idKey },
      update: {},
      create: {
        id: idKey,
        title: cam.title,
        description: `Program galang dana sosial-keagamaan untuk ${cam.title} di lingkungan kampus Polines.`,
        category: cam.category,
        targetAmount: 60000000,
        collectedAmount: 0,
        startDate: daysAgo(30),
        endDate: daysLater(90),
        location: cam.location,
        status: "active",
        createdBy: admin.id,
      },
    });
    campaignMap[cam.title] = campaign.id;
  }

  // Tambahkan pula campaign bawaan proyek jika belum ter-cover
  const staticCampaignsData = [
    { title: "Bantuan Bencana Alam Semarang", category: "Bencana", targetAmount: 50000000 },
    { title: "Peduli Ramadhan 2025", category: "Ramadhan", targetAmount: 30000000 },
    { title: "Beasiswa Mahasiswa Kurang Mampu", category: "Sosial", targetAmount: 75000000 },
    { title: "Renovasi Mushola Kampus Polines", category: "Keagamaan", targetAmount: 40000000 },
    { title: "Donasi Buku untuk Perpustakaan Desa", category: "Pendidikan", targetAmount: 15000000 },
    { title: "Operasi Kucing Terlantar Kampus", category: "Sosial", targetAmount: 10000000 },
    { title: "Bantuan Medis Mahasiswa Sakit", category: "Bencana", targetAmount: 25000000 },
    { title: "Perlengkapan Lab Komputer Jurusan TI", category: "Pendidikan", targetAmount: 100000000 },
  ];

  for (const c of staticCampaignsData) {
    const idKey = `seed-${c.title.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`;
    if (!campaignMap[c.title]) {
      const campaign = await prisma.campaign.upsert({
        where: { id: idKey },
        update: {},
        create: {
          id: idKey,
          title: c.title,
          description: `Deskripsi program untuk kegiatan ${c.title} Polines Care.`,
          category: c.category,
          targetAmount: c.targetAmount,
          collectedAmount: 0,
          startDate: daysAgo(14),
          endDate: daysLater(30),
          status: "active",
          createdBy: admin.id,
        },
      });
      campaignMap[c.title] = campaign.id;
    }
  }

  // One completed campaign bawaan template
  const completedCampaign = await prisma.campaign.upsert({
    where: { id: "seed-completed-qurban-2024" },
    update: {},
    create: {
      id: "seed-completed-qurban-2024",
      title: "Qurban Polines 2024",
      description: "Program qurban bersama kampus Polines tahun 2024. Alhamdulillah target tercapai.",
      category: "Keagamaan",
      targetAmount: 20000000,
      collectedAmount: 20000000,
      startDate: daysAgo(90),
      endDate: daysAgo(30),
      status: "completed",
      createdBy: admin.id,
    },
  });
  campaignMap["Qurban Polines 2024"] = completedCampaign.id;

  console.log("✅ Platform Campaigns seeded.");

  // ============================================================
  // 3. SEEDING 700+ DONATIONS (DARI DATASET EXCEL KAMU)
  // ============================================================
  console.log("🚀 Memeriksa dan menyuntikkan riwayat transaksi dari Excel...");
  let countDonation = 0;

  // PERBAIKAN LOOPING DONATION: Menambahkan pengecekan findUnique untuk mencegah error Unique Constraint
  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    const userObj = userMap[item.User];
    const campaignId = campaignMap[item.Campaign];

    if (userObj && campaignId) {
      const donationId = `excel-don-${i}`;

      // Periksa apakah record donasi dengan ID ini sudah tersimpan
      const existingDonation = await prisma.donation.findUnique({
        where: { id: donationId },
      });

      // Jika data belum ada, eksekusi pembuatan data baru dan naikkan agregasi collectedAmount
      if (!existingDonation) {
        await prisma.donation.create({
          data: {
            id: donationId,
            campaignId: campaignId,
            userId: userObj.id,
            amount: Math.floor(Number(item.Nominal)),
            donorName: userObj.name,
            donorEmail: userObj.email,
            donorPhone: userObj.phone || "08123456789",
            type: "uang",
            paymentMethod: "transfer",
            status: "approved",
            message: "Donasi riwayat lampau dari dataset.",
            createdAt: new Date(item.Waktu),
          },
        });

        // Akumulasikan nilai collectedAmount di tabel Campaign
        await prisma.campaign.update({
          where: { id: campaignId },
          data: {
            collectedAmount: { increment: Math.floor(Number(item.Nominal)) },
          },
        });
        countDonation++;
      }
    }
  }
  console.log(`✅ Selesai! Berhasil memproses pengisian ${countDonation} riwayat transaksi baru (transaksi yang sudah ada otomatis dilewati).`);

  // ============================================================
  // 4. PROPOSALS (Tetap dipertahankan)
  // ============================================================
  const proposalsData = [
    { title: "Program Santunan Anak Yatim di Panti Asuhan", description: "Mengusulkan program santunan rutin bulanan...", category: "Sosial", targetAmount: 12000000, proposedBy: donatur1.id, votesCount: 24, status: "approved", kejelasanTujuan: 90, kelayakanAnggaran: 85, urgensi: 70, keterkaitanKampus: 80, kontribusiSosial: 95 },
    { title: "Pelatihan Coding Gratis untuk SMA", description: "Mengusulkan program pelatihan dasar coding...", category: "Pendidikan", targetAmount: 8000000, proposedBy: donatur3.id, votesCount: 18, status: "approved", kejelasanTujuan: 85, kelayakanAnggaran: 80, urgensi: 60, keterkaitanKampus: 90, kontribusiSosial: 75 },
    { title: "Bank Sampah Kampus Polines", description: "Mengusulkan pembuatan bank sampah...", category: "Sosial", targetAmount: 5000000, proposedBy: donatur2.id, votesCount: 31, status: "approved", kejelasanTujuan: 80, kelayakanAnggaran: 90, urgensi: 65, keterkaitanKampus: 95, kontribusiSosial: 85 },
    { title: "Konseling Mental Health Mahasiswa", description: "Mengusulkan layanan konseling gratis...", category: "Sosial", targetAmount: 15000000, proposedBy: donatur4.id, votesCount: 42, status: "pending", kejelasanTujuan: 88, kelayakanAnggaran: 72, urgensi: 85, keterkaitanKampus: 90, kontribusiSosial: 92 },
    { title: "Taman Baca 24 Jam di Kampus", description: "Mengusulkan pembuatan taman baca...", category: "Pendidikan", targetAmount: 20000000, proposedBy: donatur5.id, votesCount: 15, status: "pending", kejelasanTujuan: 75, kelayakanAnggaran: 65, urgensi: 55, keterkaitanKampus: 88, kontribusiSosial: 70 },
  ];

  for (const p of proposalsData) {
    await prisma.proposal.upsert({
      where: { id: `seed-prop-${p.title.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}` },
      update: {},
      create: { id: `seed-prop-${p.title.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`, ...p },
    });
  }
  console.log(`✅ Proposals seeded (${proposalsData.length} proposals)`);

  // ============================================================
  // 5. USER PREFERENCES (Bawaan)
  // ============================================================
  const preferencesData = [
    { userId: donatur1.id, category: "Sosial", weight: 5 },
    { userId: donatur1.id, category: "Bencana", weight: 3 },
    { userId: donatur2.id, category: "Ramadhan", weight: 5 },
    { userId: donatur2.id, category: "Keagamaan", weight: 4 },
    { userId: donatur3.id, category: "Pendidikan", weight: 5 },
    { userId: donatur3.id, category: "Sosial", weight: 3 },
    { userId: donatur4.id, category: "Bencana", weight: 4 },
    { userId: donatur4.id, category: "Sosial", weight: 4 },
    { userId: donatur5.id, category: "Sosial", weight: 5 },
    { userId: donatur5.id, category: "Keagamaan", weight: 3 },
  ];

  for (const pref of preferencesData) {
    await prisma.userPreference.upsert({
      where: { userId_category: { userId: pref.userId, category: pref.category } },
      update: { weight: pref.weight },
      create: pref,
    });
  }
  console.log(`✅ User preferences seeded.`);

  // ============================================================
  // 6. NOTIFICATIONS & FUND USAGES & VOTES (Bawaan)
  // ============================================================
  const notificationsData = [
    { userId: donatur1.id, title: "Donasi Disetujui", message: "Donasi Anda sebesar Rp 5.000.000 telah disetujui.", type: "success" },
    { userId: donatur1.id, title: "Campaign Baru", message: "Campaign baru 'Bantuan Medis Mahasiswa Sakit' telah dibuka.", type: "warning" },
    { userId: admin.id, title: "Donasi Menunggu Verifikasi", message: "Ada donasi baru menunggu verifikasi Anda.", type: "warning" },
  ];

  for (let i = 0; i < notificationsData.length; i++) {
    await prisma.notification.upsert({
      where: { id: `seed-notif-${i}` },
      update: {},
      create: { id: `seed-notif-${i}`, ...notificationsData[i], isRead: false },
    });
  }

  const fundUsagesData = [
    { campaignId: completedCampaign.id, description: "Pembelian 5 ekor kambing qurban", amount: 15000000, createdBy: admin.id },
    { campaignId: completedCampaign.id, description: "Biaya potong dan distribusi daging", amount: 3000000, createdBy: admin.id },
  ];

  for (const f of fundUsagesData) {
    await prisma.fundUsage.create({
      data: { id: `seed-fund-${f.description.slice(0, 15).replace(/\s+/g, "-")}`, ...f },
    });
  }

  const proposalIds = proposalsData.map(p => `seed-prop-${p.title.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`);
  const voterUserIds = [donatur1.id, donatur2.id, donatur3.id];

  for (const propId of proposalIds) {
    for (const uId of voterUserIds) {
      await prisma.vote.upsert({
        where: { proposalId_userId: { proposalId: propId, userId: uId } },
        update: {},
        create: { proposalId: propId, userId: uId },
      });
    }
  }

  console.log("✅ Notifications, Fund Usages, and Votes seeded.");
  console.log("\n🎉 GABUNGAN SEEDING SELESAI SEMPURNA!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });