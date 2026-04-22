import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

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
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
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
        </Providers>
      </body>
    </html>
  );
}
