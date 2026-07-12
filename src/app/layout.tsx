import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import { Providers } from "@/components/providers";
import { Sora, Inter } from 'next/font/google'

const sora = Sora({ subsets: ['latin'], variable: '--font-display', weight: ['600','700','800'] })
const inter = Inter({ subsets: ['latin'], variable: '--font-body' })

// di <html className={`${sora.variable} ${inter.variable}`}>

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Polines Care - Sistem Informasi Donasi Kampus",
  description: "Platform donasi kampus Politeknik Negeri Semarang untuk menggalang dana bantuan sosial, bencana, dan kegiatan keagamaan.",
  keywords: ["Polines Care", "Donasi Kampus", "Politeknik Negeri Semarang", "Sosial", "Bencana", "Ramadhan"],
  authors: [{ name: "Polines Care Team" }],
  icons: {
    icon: "/Logo_PolinesCare.png",
  },
  openGraph: {
    title: "Polines Care - Sistem Informasi Donasi Kampus",
    description: "Platform donasi kampus Politeknik Negeri Semarang untuk menggalang dana bantuan sosial, bencana, dan kegiatan keagamaan.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
          <SonnerToaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  );
}