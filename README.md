# Polines Care 🏥

Polines Care adalah platform donasi berbasis web yang dirancang khusus untuk komunitas kampus Politeknik Negeri Semarang. 
Platform ini memudahkan mahasiswa dan staf untuk saling membantu melalui sistem donasi yang transparan dan efisien.

## Features ✨

* 🔐 **User Authentication** 
* 💰 **Donation Management** 
* 📋 **Campaign Management**
* 🤝 **Crowdsourcing System** 
* ⭐ **Rekomendasi Campaign**
* 📊 **Dashboard Admin** 
* 📊 **Dashboard Donatur** 
* 📱 **Responsive Design** 
* 🎨 **Modern UI** 

## Tech Stack 🛠️

* **Frontend:** Next.js, TypeScript, Tailwind CSS
* **Backend:** Next.js API Routes, NextAuth.js
* **Database:** MySQL / PostgreSQL
* **ORM:** Prisma
* **UI Components:** Shadcn/ui & Lucide Icons

## Getting Started 🚀

### Prerequisites
* Node.js (versi 18 ke atas)
* NPM atau Bun

# Installation

**Clone the repository**
``'bash
git clone https://github.com/ChoirunnisaSafaFayzalmi/PolinesCare.git
cd PolinesCare

## Install dependencies
npm install

## Set up environment variables
Buat file .env di root folder project, lalu isi:
DATABASE_URL="file:./db/custom.db"

## Database Setup
npx prisma generate
npx prisma db push

## Run development server
npm run dev

## Demo Accounts 🔑

Gunakan akun berikut untuk mencoba fitur aplikasi:

| Role    | Email                  | Password   |
|---------|------------------------|------------|
| Admin   | admin@polines.ac.id    | admin123   |
| Donatur | donatur@demo.com       | demo123    |

**Project Structure 📁**

Struktur folder dalam project ini dirancang untuk skalabilitas dan keteraturan kode:
'''
polines-care/
├── prisma/
│   ├── schema.prisma          # Model database (User, Campaign, Donation, dll)
│   └── migrations/             # File migrasi database
├── public/                     # Aset statis (gambar, logo)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Halaman utama
│   │   ├── globals.css         # Style global
│   │   └── api/                # Backend API routes
│   │       ├── auth/           # Autentikasi (login, register, session)
│   │       ├── campaigns/      # CRUD campaign
│   │       ├── donations/      # CRUD donasi & verifikasi
│   │       ├── proposals/      # CRUD proposal & voting
│   │       ├── recommendations/# Rekomendasi campaign
│   │       ├── stats/          # Statistik platform
│   │       ├── fund-usage/     # Laporan penggunaan dana
│   │       ├── notifications/  # Notifikasi user
│   │       └── seed/           # Seed data demo
│   ├── components/
│   │   ├── polines/            # Komponen utama Polines Care
│   │   │   ├── header.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── landing-page.tsx
│   │   │   ├── admin-dashboard.tsx
│   │   │   ├── donatur-dashboard.tsx
│   │   │   ├── donation-modal.tsx
│   │   │   ├── campaign-form-modal.tsx
│   │   │   ├── campaign-detail-modal.tsx
│   │   │   ├── proposal-form-modal.tsx
│   │   │   ├── fund-usage-modal.tsx
│   │   │   ├── login-page.tsx
│   │   │   ├── register-page.tsx
│   │   │   ├── qr-code.tsx
│   │   │   └── types.ts        # Type definitions
│   │   ├── ui/                 # Shadcn/ui components
│   │   └── providers.tsx       # Provider wrapper (Session, Theme)
│   ├── hooks/                  # Custom React hooks
│   └── lib/
│       ├── auth.ts             # Konfigurasi NextAuth
│       ├── db.ts               # Koneksi database Prisma
│       └── utils.ts            # Utility functions
├── db/
│   └── custom.db               # File database SQLite
├── .env                        # Environment variables
├── next.config.ts              # Konfigurasi Next.js
├── tailwind.config.ts          # Konfigurasi Tailwind CSS
├── tsconfig.json               # Konfigurasi TypeScript
└── package.json                # Dependencies & scripts
