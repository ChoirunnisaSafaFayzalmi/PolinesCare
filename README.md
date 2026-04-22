# Polines Care 🏥

Polines Care adalah platform donasi berbasis web yang dirancang khusus untuk komunitas kampus Politeknik Negeri Semarang. 
Platform ini memudahkan mahasiswa dan staf untuk saling membantu melalui sistem donasi yang transparan dan efisien.

## Features ✨

* 🔐 **User Authentication** 
* 💰 **Donation Management**
* 🤝 **Crowdsourcing System**
* 🤖 **AI-Based Recommender System**
* 📊 **Real-time Monitoring** 
* 📱 **Responsive Design** 
* 🎨 **Modern UI**

## Tech Stack 🛠️

* **Frontend:** [Next.js](https://nextjs.org/), TypeScript, [Tailwind CSS](https://tailwindcss.com/)
* **Backend:** Next.js Server Actions
* **Database:** MySQL / PostgreSQL
* **ORM:** [Prisma](https://www.prisma.io/)
* **UI Components:** Shadcn/ui & Lucide Icons

## Getting Started 🚀

### Prerequisites
* Node.js (versi 18 ke atas)
* NPM atau Bun
* Database (MySQL/PostgreSQL)

### Installation

1. Clone the repository:
   ```bash git clone [https://github.com/ChoirunnisaSafaFayzalmi/PolinesCare.git](https://github.com/ChoirunnisaSafaFayzalmi/PolinesCare.git)
   cd PolinesCare
2. Install dependencies:
npm install
3. Set up environment variables
DATABASE_URL="mysql://user:password@localhost:3306/polines_care"
4. Database Migration:
npx prisma generate
npx prisma db push
5. Run development server:
npm run dev

## Project Structure 📁

Struktur folder dalam project ini dirancang untuk skalabilitas dan keteraturan kode:

- `prisma/`             : Konfigurasi ORM Prisma dan file `schema.prisma`.
- `public/`             : Aset statis seperti gambar, ikon, dan logo.
- `src/`                : Direktori utama source code.
  - `app/`              : Routing utama (App Router) dengan pengelompokan akses:
    - `(protected)/`    : Halaman yang membutuhkan autentikasi (User/Admin).
    - `(public)/`       : Halaman yang bisa diakses publik secara bebas.
    - `(shared)/`       : Halaman atau komponen yang digunakan bersama antar route.
    - `api/`            : Backend API internal.
  - `components/`       : Reusable UI components (Button, Modal, Card, dll).
  - `db/`               : Konfigurasi koneksi database.
  - `hooks/`            : Custom React hooks untuk logika komponen.
  - `lib/`              : Utility functions dan konfigurasi library pihak ketiga.
  - `service/`          : Logika bisnis dan pemanggilan API.
  - `types/`            : Definisi TypeScript interfaces/types.
- `.env`                : File konfigurasi rahasia (Database URL, API Keys).
- `next.config.ts`      : Konfigurasi framework Next.js.
- `package.json`        : Daftar library pendukung dan script project.
- `tailwind.config.ts`  : Konfigurasi desain dan tema Tailwind CSS.


## Acknowledgements 🎓
Project ini dikembangkan sebagai syarat Tugas Akhir (TA) di Politeknik Negeri Semarang.

### Cara Pasangnya:
1. Buat file baru di folder project kamu di laptop, kasih nama `README.md`.
2. Paste kode di atas ke dalamnya.
3. Buka Git Bash lagi, terus ketik ini biar terupdate di GitHub:
   ```bash
   git add README.md
   git commit -m "Update README biar makin pro"
   git push
