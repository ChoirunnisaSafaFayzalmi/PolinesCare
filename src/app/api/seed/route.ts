import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

// POST /api/seed - Seed database with sample data
export async function POST() {
  try {
    // Clear existing data (order matters due to relations)
    await db.vote.deleteMany();
    await db.donation.deleteMany();
    await db.fundUsage.deleteMany();
    await db.notification.deleteMany();
    await db.proposal.deleteMany();
    await db.userPreference.deleteMany();
    await db.campaign.deleteMany();
    await db.user.deleteMany();

    // Hash passwords
    const adminPassword = await bcrypt.hash("admin123", 12);
    const donaturPassword = await bcrypt.hash("demo123", 12);

    // Create users
    const admin = await db.user.create({
      data: {
        email: "admin@polines.ac.id",
        name: "Admin Polines Care",
        password: adminPassword,
        role: "admin",
        phone: "081234567890",
        isVerified: true,
      },
    });

    const donatur = await db.user.create({
      data: {
        email: "donatur@demo.com",
        name: "Ahmad Donatur",
        password: donaturPassword,
        role: "donatur",
        phone: "081298765432",
        isVerified: true,
      },
    });

    // Create additional donatur users
    const donatur2 = await db.user.create({
      data: {
        email: "siti@student.polines.ac.id",
        name: "Siti Nurhaliza",
        password: donaturPassword,
        role: "donatur",
        phone: "085612345678",
        isVerified: true,
      },
    });

    const donatur3 = await db.user.create({
      data: {
        email: "budi@student.polines.ac.id",
        name: "Budi Santoso",
        password: donaturPassword,
        role: "donatur",
        phone: "085789012345",
        isVerified: false,
      },
    });

    // Create campaigns
    const campaign1 = await db.campaign.create({
      data: {
        title: "Bantu Korban Banjir Semarang",
        description:
          "Banjir besar melanda kota Semarang pada awal tahun ini. Banyak warga yang kehilangan tempat tinggal dan harta benda mereka. Mari kita bersama-sama membantu mereka dengan donasi terbaik kita.",
        category: "Bencana",
        targetAmount: 50000000,
        collectedAmount: 32500000,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2024-03-15"),
        image: null,
        status: "active",
        isUrgent: true,
        createdBy: admin.id,
      },
    });

    const campaign2 = await db.campaign.create({
      data: {
        title: "Donasi Ramadhan untuk Anak Yatim",
        description:
          "Program donasi Ramadhan untuk membantu anak-anak yatim di Panti Asuhan Al-Hikmah Semarang. Dana akan digunakan untuk kebutuhan sehari-hari, pendidikan, dan perayaan Hari Raya.",
        category: "Ramadhan",
        targetAmount: 30000000,
        collectedAmount: 28000000,
        startDate: new Date("2024-03-01"),
        endDate: new Date("2024-04-10"),
        image: null,
        status: "active",
        isUrgent: false,
        createdBy: admin.id,
      },
    });

    const campaign3 = await db.campaign.create({
      data: {
        title: "Beasiswa Kampus untuk Mahasiswa Kurang Mampu",
        description:
          "Program beasiswa untuk membantu mahasiswa Polines yang memiliki prestasi akademik namun terkendala biaya kuliah. Beasiswa mencakup biaya SPP semester dan buku paket.",
        category: "Sosial",
        targetAmount: 75000000,
        collectedAmount: 42000000,
        startDate: new Date("2024-02-01"),
        endDate: new Date("2024-06-30"),
        image: null,
        status: "active",
        isUrgent: false,
        createdBy: admin.id,
      },
    });

    const campaign4 = await db.campaign.create({
      data: {
        title: "Renovasi Mushola Kampus Polines",
        description:
          "Mushola di dalam kampus Polines memerlukan renovasi. Atap bocor, lantai rusak, dan tempat wudhu kurang layak. Mari kita bersama memperbaiki tempat ibadah kita.",
        category: "Donasi Rutin",
        targetAmount: 100000000,
        collectedAmount: 65000000,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        image: null,
        status: "active",
        isUrgent: false,
        createdBy: admin.id,
      },
    });

    const campaign5 = await db.campaign.create({
      data: {
        title: "Bantuan Gempa Cianjur",
        description:
          "Gempa bumi melanda Cianjur dan sekitarnya. Banyak rumah warga yang rusak berat. Bantuan darurat sangat dibutuhkan untuk makanan, selimut, dan obat-obatan.",
        category: "Bencana",
        targetAmount: 80000000,
        collectedAmount: 80000000,
        startDate: new Date("2023-11-21"),
        endDate: new Date("2024-02-21"),
        image: null,
        status: "completed",
        isUrgent: false,
        createdBy: admin.id,
      },
    });

    const campaign6 = await db.campaign.create({
      data: {
        title: "Peduli Sesama: Pembagian Paket Sembako",
        description:
          "Program rutin pembagian paket sembako untuk warga kurang mampu di sekitar kampus Polines. Setiap bulan kami membagikan 100 paket sembako.",
        category: "Sosial",
        targetAmount: 25000000,
        collectedAmount: 18000000,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        image: null,
        status: "active",
        isUrgent: false,
        createdBy: admin.id,
      },
    });

    // Create donations with various statuses
    const donation1 = await db.donation.create({
      data: {
        campaignId: campaign1.id,
        userId: donatur.id,
        amount: 5000000,
        donorName: "Ahmad Donatur",
        donorEmail: "donatur@demo.com",
        donorPhone: "081298765432",
        type: "uang",
        paymentMethod: "transfer",
        status: "approved",
        message: "Semoga membantu korban banjir",
      },
    });

    const donation2 = await db.donation.create({
      data: {
        campaignId: campaign1.id,
        userId: donatur2.id,
        amount: 2500000,
        donorName: "Siti Nurhaliza",
        donorEmail: "siti@student.polines.ac.id",
        donorPhone: "085612345678",
        type: "uang",
        paymentMethod: "qris",
        status: "approved",
        message: "Bismillah, semoga cepat terkumpul",
      },
    });

    const donation3 = await db.donation.create({
      data: {
        campaignId: campaign2.id,
        userId: donatur.id,
        amount: 3000000,
        donorName: "Ahmad Donatur",
        donorEmail: "donatur@demo.com",
        donorPhone: "081298765432",
        type: "uang",
        paymentMethod: "transfer",
        status: "approved",
        message: "Untuk anak-anak yatim",
      },
    });

    const donation4 = await db.donation.create({
      data: {
        campaignId: campaign2.id,
        userId: donatur3.id,
        amount: 1500000,
        donorName: "Budi Santoso",
        donorEmail: "budi@student.polines.ac.id",
        donorPhone: "085789012345",
        type: "uang",
        paymentMethod: "qris",
        status: "pending",
        message: "Baru pertama kali donasi",
      },
    });

    const donation5 = await db.donation.create({
      data: {
        campaignId: campaign3.id,
        userId: donatur.id,
        amount: 10000000,
        donorName: "Ahmad Donatur",
        donorEmail: "donatur@demo.com",
        donorPhone: "081298765432",
        type: "uang",
        paymentMethod: "transfer",
        status: "approved",
        message: "Pendidikan adalah masa depan",
      },
    });

    const donation6 = await db.donation.create({
      data: {
        campaignId: campaign3.id,
        userId: donatur2.id,
        amount: 7500000,
        donorName: "Siti Nurhaliza",
        donorEmail: "siti@student.polines.ac.id",
        donorPhone: "085612345678",
        type: "uang",
        paymentMethod: "transfer",
        status: "approved",
      },
    });

    const donation7 = await db.donation.create({
      data: {
        campaignId: campaign4.id,
        userId: donatur.id,
        amount: 20000000,
        donorName: "Ahmad Donatur",
        donorEmail: "donatur@demo.com",
        donorPhone: "081298765432",
        type: "uang",
        paymentMethod: "transfer",
        status: "approved",
        message: "Semoga mushola segera direnovasi",
      },
    });

    const donation8 = await db.donation.create({
      data: {
        campaignId: campaign1.id,
        userId: donatur3.id,
        amount: 500000,
        donorName: "Budi Santoso",
        donorEmail: "budi@student.polines.ac.id",
        donorPhone: "085789012345",
        type: "barang",
        paymentMethod: "tunai",
        status: "rejected",
        message: "Donasi pakaian layak pakai",
      },
    });

    const donation9 = await db.donation.create({
      data: {
        campaignId: campaign5.id,
        userId: donatur.id,
        amount: 15000000,
        donorName: "Ahmad Donatur",
        donorEmail: "donatur@demo.com",
        donorPhone: "081298765432",
        type: "uang",
        paymentMethod: "transfer",
        status: "approved",
      },
    });

    const donation10 = await db.donation.create({
      data: {
        campaignId: campaign6.id,
        userId: donatur2.id,
        amount: 1000000,
        donorName: "Siti Nurhaliza",
        donorEmail: "siti@student.polines.ac.id",
        donorPhone: "085612345678",
        type: "uang",
        paymentMethod: "qris",
        status: "pending",
      },
    });

    // Create fund usage reports
    await db.fundUsage.create({
      data: {
        campaignId: campaign5.id,
        description: "Pembelian sembako dan obat-obatan untuk korban gempa di Cianjur",
        amount: 35000000,
        date: new Date("2023-12-01"),
        documentUrl: null,
        createdBy: admin.id,
      },
    });

    await db.fundUsage.create({
      data: {
        campaignId: campaign5.id,
        description: "Distribusi bantuan logistik ke posko pengungsian Cianjur",
        amount: 25000000,
        date: new Date("2024-01-15"),
        documentUrl: null,
        createdBy: admin.id,
      },
    });

    await db.fundUsage.create({
      data: {
        campaignId: campaign1.id,
        description: "Pengiriman bantuan logistik untuk korban banjir Semarang (tahap 1)",
        amount: 15000000,
        date: new Date("2024-01-20"),
        documentUrl: null,
        createdBy: admin.id,
      },
    });

    await db.fundUsage.create({
      data: {
        campaignId: campaign1.id,
        description: "Pembelian perlengkapan kebersihan dan obat-obatan korban banjir",
        amount: 10000000,
        date: new Date("2024-02-05"),
        documentUrl: null,
        createdBy: admin.id,
      },
    });

    // Create proposals
    const proposal1 = await db.proposal.create({
      data: {
        title: "Program Beasiswa Mahasiswa Berprestasi",
        description:
          "Proposal untuk mendirikan program beasiswa bagi mahasiswa Polines yang berprestasi namun kurang mampu secara finansial. Beasiswa akan mencakup biaya SPP 1 semester dan bantuan buku.",
        category: "Pendidikan",
        targetAmount: 50000000,
        proposedBy: donatur.id,
        votesCount: 15,
        status: "approved",
      },
    });

    const proposal2 = await db.proposal.create({
      data: {
        title: "Bantuan Sembako Bulanan untuk Warga Sekitar Kampus",
        description:
          "Proposal program distribusi sembako bulanan untuk warga kurang mampu di sekitar kampus Polines. Target 100 paket per bulan selama 6 bulan.",
        category: "Sosial",
        targetAmount: 30000000,
        proposedBy: donatur2.id,
        votesCount: 8,
        status: "pending",
      },
    });

    const proposal3 = await db.proposal.create({
      data: {
        title: "Pembangunan Taman Baca di Desa Binaan",
        description:
          "Proposal pembangunan taman baca masyarakat di desa binaan Polines. Taman baca akan dilengkapi dengan buku-buku pelajaran, komputer, dan akses internet.",
        category: "Pendidikan",
        targetAmount: 45000000,
        proposedBy: donatur.id,
        votesCount: 22,
        status: "approved",
      },
    });

    const proposal4 = await db.proposal.create({
      data: {
        title: "Program Pelatihan Keterampilan Digital untuk UMKM",
        description:
          "Proposal pelatihan keterampilan digital (desain grafis, media sosial marketing, e-commerce) untuk UMKM di sekitar kampus Polines.",
        category: "Sosial",
        targetAmount: 20000000,
        proposedBy: donatur3.id,
        votesCount: 5,
        status: "pending",
      },
    });

    // Create votes for proposals
    await db.vote.createMany({
      data: [
        { proposalId: proposal1.id, userId: donatur.id },
        { proposalId: proposal1.id, userId: donatur2.id },
        { proposalId: proposal1.id, userId: donatur3.id },
        { proposalId: proposal2.id, userId: donatur.id },
        { proposalId: proposal3.id, userId: donatur.id },
        { proposalId: proposal3.id, userId: donatur2.id },
        { proposalId: proposal4.id, userId: donatur2.id },
      ],
    });

    // Create user preferences
    await db.userPreference.createMany({
      data: [
        { userId: donatur.id, category: "Bencana", weight: 2.0 },
        { userId: donatur.id, category: "Sosial", weight: 1.5 },
        { userId: donatur.id, category: "Pendidikan", weight: 1.0 },
        { userId: donatur2.id, category: "Ramadhan", weight: 2.0 },
        { userId: donatur2.id, category: "Sosial", weight: 1.0 },
      ],
    });

    // Create sample notifications
    await db.notification.createMany({
      data: [
        {
          userId: donatur.id,
          title: "Selamat Datang di Polines Care!",
          message:
            "Terima kasih telah bergabung di platform donasi Polines Care. Anda dapat berdonasi dan mengajukan proposal sosial.",
          type: "info",
          isRead: true,
        },
        {
          userId: donatur.id,
          title: "Donasi Disetujui",
          message:
            "Donasi Anda sebesar Rp 5.000.000 untuk kampanye 'Bantu Korban Banjir Semarang' telah disetujui.",
          type: "success",
          isRead: false,
        },
        {
          userId: donatur.id,
          title: "Proposal Disetujui",
          message:
            "Proposal 'Program Beasiswa Mahasiswa Berprestasi' Anda telah disetujui oleh admin.",
          type: "success",
          isRead: false,
        },
        {
          userId: donatur2.id,
          title: "Selamat Datang di Polines Care!",
          message:
            "Terima kasih telah bergabung di platform donasi Polines Care. Mari bersama berbagi kebaikan.",
          type: "info",
          isRead: true,
        },
        {
          userId: donatur2.id,
          title: "Donasi Menunggu Verifikasi",
          message:
            "Donasi Anda sebesar Rp 1.500.000 untuk kampanye 'Donasi Ramadhan untuk Anak Yatim' menunggu verifikasi admin.",
          type: "info",
          isRead: false,
        },
        {
          userId: donatur3.id,
          title: "Selamat Datang di Polines Care!",
          message:
            "Terima kasih telah bergabung. Silakan lengkapi profil Anda dan mulai berdonasi.",
          type: "info",
          isRead: false,
        },
        {
          userId: donatur3.id,
          title: "Donasi Ditolak",
          message:
            "Donasi Anda berupa barang untuk kampanye 'Bantu Korban Banjir Semarang' ditolak. Silakan hubungi admin untuk informasi lebih lanjut.",
          type: "warning",
          isRead: false,
        },
      ],
    });

    return NextResponse.json(
      {
        message: "Database berhasil diisi dengan data sampel",
        data: {
          users: 4,
          campaigns: 6,
          donations: 10,
          fundUsages: 4,
          proposals: 4,
          votes: 7,
          preferences: 5,
          notifications: 7,
        },
        accounts: {
          admin: { email: "admin@polines.ac.id", password: "admin123" },
          donatur: { email: "donatur@demo.com", password: "demo123" },
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan";
    console.error("Seed error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
