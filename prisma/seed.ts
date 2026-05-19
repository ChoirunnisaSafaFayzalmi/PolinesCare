import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Polines Care database...\n");

  // ============================================================
  // 1. USERS
  // ============================================================
  const adminPassword = await bcrypt.hash("admin123", 10);
  const donaturPassword = await bcrypt.hash("donatur123", 10);

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

  const donatur1 = await prisma.user.upsert({
    where: { email: "budi@polines.ac.id" },
    update: {},
    create: {
      email: "budi@polines.ac.id",
      name: "Budi Santoso",
      password: donaturPassword,
      role: "donatur",
      phone: "082345678901",
      isVerified: true,
    },
  });

  const donatur2 = await prisma.user.upsert({
    where: { email: "siti@polines.ac.id" },
    update: {},
    create: {
      email: "siti@polines.ac.id",
      name: "Siti Aminah",
      password: donaturPassword,
      role: "donatur",
      phone: "083456789012",
      isVerified: true,
    },
  });

  const donatur3 = await prisma.user.upsert({
    where: { email: "ahmad@polines.ac.id" },
    update: {},
    create: {
      email: "ahmad@polines.ac.id",
      name: "Ahmad Rizky",
      password: donaturPassword,
      role: "donatur",
      phone: "084567890123",
      isVerified: true,
    },
  });

  const donatur4 = await prisma.user.upsert({
    where: { email: "dewi@polines.ac.id" },
    update: {},
    create: {
      email: "dewi@polines.ac.id",
      name: "Dewi Lestari",
      password: donaturPassword,
      role: "donatur",
      phone: "085678901234",
      isVerified: true,
    },
  });

  const donatur5 = await prisma.user.upsert({
    where: { email: "raka@polines.ac.id" },
    update: {},
    create: {
      email: "raka@polines.ac.id",
      name: "Raka Pratama",
      password: donaturPassword,
      role: "donatur",
      phone: "086789012345",
      isVerified: true,
    },
  });

  // Donatur Demo - untuk testing login
  const demoPassword = await bcrypt.hash("demo123", 10);
  const donaturDemo = await prisma.user.upsert({
    where: { email: "donatur@demo.com" },
    update: {},
    create: {
      email: "donatur@demo.com",
      name: "Donatur Demo",
      password: demoPassword,
      role: "donatur",
      isVerified: true,
    },
  });

  console.log("✅ Users seeded (1 admin + 6 donatur)");

  // ============================================================
  // 2. CAMPAIGNS
  // ============================================================
  const now = new Date();
  const daysAgo = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date.toISOString();
  };
  const daysLater = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    return date.toISOString();
  };

  const campaignsData = [
    {
      title: "Bantuan Bencana Alam Semarang",
      description: "Penggalangan dana untuk membantu korban bencana alam di wilayah Semarang dan sekitarnya. Dana akan disalurkan untuk kebutuhan pokok, obat-obatan, dan perbaikan rumah warga yang terdampak.",
      category: "Bencana",
      targetAmount: 50000000,
      collectedAmount: 32500000,
      startDate: daysAgo(14),
      endDate: daysLater(16),
      status: "active",
      isUrgent: true,
      uniqueCode: 10,
      createdBy: admin.id,
    },
    {
      title: "Peduli Ramadhan 2025",
      description: "Program berbagi takjil dan paket sembako untuk mahasiswa dan masyarakat sekitar kampus Polines selama bulan Ramadhan. Target kami adalah 500 paket sembako.",
      category: "Ramadhan",
      targetAmount: 30000000,
      collectedAmount: 22000000,
      startDate: daysAgo(7),
      endDate: daysLater(23),
      status: "active",
      isUrgent: false,
      uniqueCode: 25,
      createdBy: admin.id,
    },
    {
      title: "Beasiswa Mahasiswa Kurang Mampu",
      description: "Program beasiswa untuk membantu mahasiswa Polines yang memiliki prestasi akademik baik namun terkendala biaya kuliah. Dana digunakan untuk membayar SPP satu semester.",
      category: "Sosial",
      targetAmount: 75000000,
      collectedAmount: 45600000,
      startDate: daysAgo(30),
      endDate: daysLater(60),
      status: "active",
      isUrgent: false,
      uniqueCode: 33,
      createdBy: admin.id,
    },
    {
      title: "Renovasi Mushola Kampus Polines",
      description: "Renovasi dan penambahan fasilitas mushola di kampus Polines meliputi perbaikan atap, penambahan tempat wudhu, dan pengadaan mukena baru.",
      category: "Keagamaan",
      targetAmount: 40000000,
      collectedAmount: 18750000,
      startDate: daysAgo(10),
      endDate: daysLater(20),
      status: "active",
      isUrgent: false,
      uniqueCode: 41,
      createdBy: admin.id,
    },
    {
      title: "Donasi Buku untuk Perpustakaan Desa",
      description: "Pengumpulan buku pelajaran dan referensi untuk perpustakaan desa di sekitar Polines. Program ini juga mencakup pembangunan rak buku dan meja baca.",
      category: "Pendidikan",
      targetAmount: 15000000,
      collectedAmount: 11500000,
      startDate: daysAgo(20),
      endDate: daysLater(10),
      status: "active",
      isUrgent: false,
      uniqueCode: 57,
      createdBy: admin.id,
    },
    {
      title: "Operasi Kucing Terlantar Kampus",
      description: "Program sterilisasi dan perawatan kucing terlantar di lingkungan kampus Polines. Dana digunakan untuk biaya operasi, vaksinasi, dan makanan harian.",
      category: "Sosial",
      targetAmount: 10000000,
      collectedAmount: 7500000,
      startDate: daysAgo(5),
      endDate: daysLater(25),
      status: "active",
      isUrgent: false,
      uniqueCode: 68,
      createdBy: admin.id,
    },
    {
      title: "Bantuan Medis Mahasiswa Sakit",
      description: "Bantuan biaya pengobatan untuk mahasiswa Polines yang sedang menjalani perawatan di rumah sakit. Dana akan digunakan untuk biaya operasi dan rawat inap.",
      category: "Bencana",
      targetAmount: 25000000,
      collectedAmount: 8000000,
      startDate: daysAgo(3),
      endDate: daysLater(30),
      status: "active",
      isUrgent: true,
      uniqueCode: 79,
      createdBy: admin.id,
    },
    {
      title: "Perlengkapan Lab Komputer Jurusan TI",
      description: "Penggalangan dana untuk pengadaan 10 unit komputer baru untuk laboratorium komputer Jurusan Teknik Informatika Polines.",
      category: "Pendidikan",
      targetAmount: 100000000,
      collectedAmount: 62000000,
      startDate: daysAgo(45),
      endDate: daysLater(15),
      status: "active",
      isUrgent: false,
      uniqueCode: 83,
      createdBy: admin.id,
    },
  ];

  const campaigns: any[] = [];
  for (const c of campaignsData) {
    const campaign = await prisma.campaign.upsert({
      where: { id: `seed-${c.title.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}` },
      update: {},
      create: { id: `seed-${c.title.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`, ...c },
    });
    campaigns.push(campaign);
  }

  // One completed campaign
  const completedCampaign = await prisma.campaign.upsert({
    where: { id: "seed-completed-qurban-2024" },
    update: {},
    create: {
      id: "seed-completed-qurban-2024",
      title: "Qurban Polines 2024",
      description: "Program qurban bersama kampus Polines tahun 2024. Alhamdulillah target tercapai dan 5 ekor kambing berhasil disembelih.",
      category: "Keagamaan",
      targetAmount: 20000000,
      collectedAmount: 20000000,
      startDate: daysAgo(90),
      endDate: daysAgo(30),
      status: "completed",
      isUrgent: false,
      uniqueCode: 96,
      createdBy: admin.id,
    },
  });
  campaigns.push(completedCampaign);

  console.log(`✅ Campaigns seeded (${campaigns.length} campaigns)`);

  // ============================================================
  // 3. DONATIONS
  // ============================================================
  const donationsData = [
    // Campaign 0: Bencana Alam
    { campaignIdx: 0, userIdx: 0, amount: 5000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Semoga membantu korban bencana" },
    { campaignIdx: 0, userIdx: 1, amount: 3000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Bantuan untuk Semarang" },
    { campaignIdx: 0, userIdx: 2, amount: 7500000, status: "approved", type: "uang", paymentMethod: "qris", message: "Semoga cepat pulih" },
    { campaignIdx: 0, userIdx: 3, amount: 2000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "" },
    { campaignIdx: 0, userIdx: 4, amount: 1000000, status: "pending", type: "uang", paymentMethod: "qris", message: "Infaq dari gaji pertama" },
    { campaignIdx: 0, userIdx: 0, amount: 4000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Donasi kedua" },
    { campaignIdx: 0, userIdx: 1, amount: 10000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Untuk saudara-saudara di Semarang" },

    // Campaign 1: Ramadhan
    { campaignIdx: 1, userIdx: 0, amount: 2000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Berbagi keberkahan" },
    { campaignIdx: 1, userIdx: 1, amount: 5000000, status: "approved", type: "uang", paymentMethod: "qris", message: "Semoga menjadi amal jariyah" },
    { campaignIdx: 1, userIdx: 2, amount: 7000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Ramadhan Kareem" },
    { campaignIdx: 1, userIdx: 4, amount: 3000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "" },
    { campaignIdx: 1, userIdx: 3, amount: 5000000, status: "pending", type: "uang", paymentMethod: "qris", message: "Untuk takjil gratis" },

    // Campaign 2: Beasiswa
    { campaignIdx: 2, userIdx: 0, amount: 10000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Untuk adik-adik mahasiswa" },
    { campaignIdx: 2, userIdx: 2, amount: 5000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Pendidikan penting" },
    { campaignIdx: 2, userIdx: 3, amount: 15000000, status: "approved", type: "uang", paymentMethod: "qris", message: "Semoga mereka bisa kuliah dengan tenang" },
    { campaignIdx: 2, userIdx: 4, amount: 8000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Investasi masa depan" },
    { campaignIdx: 2, userIdx: 1, amount: 7600000, status: "pending", type: "uang", paymentMethod: "transfer", message: "" },

    // Campaign 3: Mushola
    { campaignIdx: 3, userIdx: 1, amount: 5000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Untuk kenyamanan ibadah" },
    { campaignIdx: 3, userIdx: 0, amount: 3750000, status: "approved", type: "uang", paymentMethod: "qris", message: "" },
    { campaignIdx: 3, userIdx: 4, amount: 10000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Semoga menjadi ladang pahala" },

    // Campaign 4: Buku Perpustakaan
    { campaignIdx: 4, userIdx: 2, amount: 5000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Buku adalah jendela dunia" },
    { campaignIdx: 4, userIdx: 3, amount: 6500000, status: "approved", type: "uang", paymentMethod: "transfer", message: "" },

    // Campaign 5: Kucing Terlantar
    { campaignIdx: 5, userIdx: 1, amount: 2000000, status: "approved", type: "uang", paymentMethod: "qris", message: "Cat lover! 🐱" },
    { campaignIdx: 5, userIdx: 4, amount: 1500000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Untuk kucing-kucing kampus" },
    { campaignIdx: 5, userIdx: 0, amount: 4000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "" },

    // Campaign 6: Bantuan Medis
    { campaignIdx: 6, userIdx: 0, amount: 3000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Semoga lekas sembuh" },
    { campaignIdx: 6, userIdx: 1, amount: 5000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Get well soon teman!" },

    // Campaign 7: Lab Komputer
    { campaignIdx: 7, userIdx: 2, amount: 20000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Untuk adik-adik TI" },
    { campaignIdx: 7, userIdx: 0, amount: 15000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "" },
    { campaignIdx: 7, userIdx: 1, amount: 12000000, status: "approved", type: "uang", paymentMethod: "qris", message: "Investasi untuk pendidikan" },
    { campaignIdx: 7, userIdx: 4, amount: 15000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "" },

    // Completed campaign donations
    { campaignIdx: 8, userIdx: 0, amount: 5000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "Qurban tahun ini" },
    { campaignIdx: 8, userIdx: 1, amount: 5000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "" },
    { campaignIdx: 8, userIdx: 2, amount: 5000000, status: "approved", type: "uang", paymentMethod: "qris", message: "" },
    { campaignIdx: 8, userIdx: 3, amount: 5000000, status: "approved", type: "uang", paymentMethod: "transfer", message: "" },
  ];

  const users = [donatur1, donatur2, donatur3, donatur4, donatur5];

  for (let i = 0; i < donationsData.length; i++) {
    const d = donationsData[i];
    const user = users[d.userIdx];
    const campaign = campaigns[d.campaignIdx];
    await prisma.donation.create({
      data: {
        id: `seed-don-${i}`,
        campaignId: campaign.id,
        userId: user.id,
        amount: d.amount,
        donorName: user.name,
        donorEmail: user.email,
        donorPhone: user.phone || "-",
        type: d.type,
        paymentMethod: d.paymentMethod,
        status: d.status,
        message: d.message,
        createdAt: daysAgo(Math.floor(Math.random() * 20) + 1),
      },
    });
  }

  console.log(`✅ Donations seeded (${donationsData.length} donations)`);

  // ============================================================
  // 4. PROPOSALS
  // ============================================================
  const proposalsData = [
    {
      title: "Program Santunan Anak Yatim di Panti Asuhan",
      description: "Mengusulkan program santunan rutin bulanan untuk anak-anak yatim di Panti Asuhan Al-Hikmah Semarang. Target 50 anak per bulan dengan santunan Rp 200.000/anak.",
      category: "Sosial",
      targetAmount: 12000000,
      proposedBy: donatur1.id,
      votesCount: 24,
      status: "approved",
      kejelasanTujuan: 90,
      kelayakanAnggaran: 85,
      urgensi: 70,
      keterkaitanKampus: 80,
      kontribusiSosial: 95,
    },
    {
      title: "Pelatihan Coding Gratis untuk SMA",
      description: "Mengusulkan program pelatihan dasar coding (HTML/CSS/JS) untuk siswa SMA di sekitar Polines. Biaya untuk pengadaan laptop pinjaman dan snack peserta.",
      category: "Pendidikan",
      targetAmount: 8000000,
      proposedBy: donatur3.id,
      votesCount: 18,
      status: "approved",
      kejelasanTujuan: 85,
      kelayakanAnggaran: 80,
      urgensi: 60,
      keterkaitanKampus: 90,
      kontribusiSosial: 75,
    },
    {
      title: "Bank Sampah Kampus Polines",
      description: "Mengusulkan pembuatan bank sampah di kampus Polines untuk mengurangi sampah dan mendanai kegiatan sosial dari hasil penjualan sampah.",
      category: "Sosial",
      targetAmount: 5000000,
      proposedBy: donatur2.id,
      votesCount: 31,
      status: "approved",
      kejelasanTujuan: 80,
      kelayakanAnggaran: 90,
      urgensi: 65,
      keterkaitanKampus: 95,
      kontribusiSosial: 85,
    },
    {
      title: "Konseling Mental Health Mahasiswa",
      description: "Mengusulkan layanan konseling gratis untuk mahasiswa Polines yang membutuhkan dukungan kesehatan mental. Dana untuk menyewa psikolog dan sewa ruang.",
      category: "Sosial",
      targetAmount: 15000000,
      proposedBy: donatur4.id,
      votesCount: 42,
      status: "pending",
      kejelasanTujuan: 88,
      kelayakanAnggaran: 72,
      urgensi: 85,
      keterkaitanKampus: 90,
      kontribusiSosial: 92,
    },
    {
      title: "Taman Baca 24 Jam di Kampus",
      description: "Mengusulkan pembuatan taman baca dengan akses 24 jam di kampus Polines, dilengkapi WiFi dan stop kontak untuk mendukung budaya literasi mahasiswa.",
      category: "Pendidikan",
      targetAmount: 20000000,
      proposedBy: donatur5.id,
      votesCount: 15,
      status: "pending",
      kejelasanTujuan: 75,
      kelayakanAnggaran: 65,
      urgensi: 55,
      keterkaitanKampus: 88,
      kontribusiSosial: 70,
    },
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
  // 5. USER PREFERENCES (for AI recommender)
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

  console.log(`✅ User preferences seeded (${preferencesData.length} preferences)`);

  // ============================================================
  // 6. NOTIFICATIONS
  // ============================================================
  const notificationsData = [
    { userId: donatur1.id, title: "Donasi Disetujui", message: "Donasi Anda sebesar Rp 5.000.000 untuk 'Bantuan Bencana Alam Semarang' telah disetujui.", type: "success" },
    { userId: donatur1.id, title: "Campaign Baru", message: "Campaign baru 'Bantuan Medis Mahasiswa Sakit' telah dibuka. Campaign ini mendesak!", type: "warning" },
    { userId: donatur2.id, title: "Donasi Disetujui", message: "Donasi Anda sebesar Rp 5.000.000 untuk 'Peduli Ramadhan 2025' telah disetujui.", type: "success" },
    { userId: donatur2.id, title: "Proposal Disetujui", message: "Proposal 'Program Santunan Anak Yatim' yang Anda ajukan telah disetujui.", type: "success" },
    { userId: donatur3.id, title: "Rekomendasi Baru", message: "AI Recommender menemukan 3 campaign baru yang sesuai dengan minat Anda!", type: "info" },
    { userId: admin.id, title: "Donasi Menunggu Verifikasi", message: "Ada 3 donasi baru yang menunggu verifikasi Anda.", type: "warning" },
    { userId: admin.id, title: "Proposal Baru", message: "Ada 2 proposal baru yang menunggu persetujuan.", type: "info" },
  ];

  for (let i = 0; i < notificationsData.length; i++) {
    const n = notificationsData[i];
    await prisma.notification.upsert({
      where: { id: `seed-notif-${i}` },
      update: {},
      create: {
        id: `seed-notif-${i}`,
        ...n,
        isRead: false,
      },
    });
  }

  console.log(`✅ Notifications seeded (${notificationsData.length} notifications)`);

  // ============================================================
  // 7. FUND USAGES (for completed campaign)
  // ============================================================
  const fundUsagesData = [
    { campaignId: completedCampaign.id, description: "Pembelian 5 ekor kambing qurban", amount: 15000000, createdBy: admin.id },
    { campaignId: completedCampaign.id, description: "Biaya potong dan distribusi daging", amount: 3000000, createdBy: admin.id },
    { campaignId: completedCampaign.id, description: "Transportasi dan logistik", amount: 2000000, createdBy: admin.id },
  ];

  for (const f of fundUsagesData) {
    await prisma.fundUsage.create({
      data: {
        id: `seed-fund-${f.description.slice(0, 15).replace(/\s+/g, "-")}`,
        ...f,
      },
    });
  }

  console.log(`✅ Fund usages seeded (${fundUsagesData.length} records)`);

  // ============================================================
  // 8. VOTES (for proposals)
  // ============================================================
  const proposalIds = proposalsData.map(p => `seed-prop-${p.title.toLowerCase().replace(/\s+/g, "-").slice(0, 20)}`);
  const voterUserIds = [donatur1.id, donatur2.id, donatur3.id, donatur4.id, donatur5.id];

  for (const propId of proposalIds) {
    for (const uId of voterUserIds) {
      await prisma.vote.upsert({
        where: { proposalId_userId: { proposalId: propId, userId: uId } },
        update: {},
        create: { proposalId: propId, userId: uId },
      });
    }
  }

  console.log(`✅ Votes seeded`);

  console.log("\n🎉 Seeding complete!");
  console.log("\n📋 Login credentials:");
  console.log("   Admin:   admin@polines.ac.id / admin123");
  console.log("   Demo:    donatur@demo.com / demo123");
  console.log("   Donatur: budi@polines.ac.id / donatur123");
  console.log("   Donatur: siti@polines.ac.id / donatur123");
  console.log("   Donatur: ahmad@polines.ac.id / donatur123");
  console.log("   Donatur: dewi@polines.ac.id / donatur123");
  console.log("   Donatur: raka@polines.ac.id / donatur123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
