import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
// Kalau build error soal axes, hapus baris axes — WONK hilang, font tetap Fraunces.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["SOFT", "WONK"], display: "swap" });
const jbmono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://jasakebumen.id"),
  title: "JasaKebumen — Direktori UMKM & Jasa Lokal Kabupaten Kebumen",
  description:
    "Direktori UMKM (kuliner, batik, kerajinan) dan jasa terverifikasi di 26 kecamatan Kabupaten Kebumen. Produk & layanan asli, hubungi langsung lewat WhatsApp tanpa komisi.",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "JasaKebumen — Cari Produk & Jasa Lokal Kebumen",
    description: "UMKM & jasa terverifikasi di 26 kecamatan Kebumen. Langsung chat WhatsApp, tanpa komisi, tanpa perantara.",
    url: "/",
    siteName: "JasaKebumen",
    locale: "id_ID",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = { themeColor: "#064E3B" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${fraunces.variable} ${jbmono.variable}`}>
        {children}
      </body>
    </html>
  );
}
