import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const jbmono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://jasakebumen.id"),
  title: "JasaKebumen — Direktori Jasa Lokal Kabupaten Kebumen",
  description:
    "Direktori teknisi, tukang, dan penyedia jasa terverifikasi di 28 kecamatan Kabupaten Kebumen. Hubungi langsung lewat WhatsApp.",
  openGraph: {
    title: "JasaKebumen — Cari & Panggil Jasa Lokal Kebumen",
    description: "Teknisi & tukang terverifikasi di 28 kecamatan. Langsung chat WhatsApp, tanpa biaya.",
    url: "/",
    siteName: "JasaKebumen",
    locale: "id_ID",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#064E3B" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${fraunces.variable} ${jbmono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
