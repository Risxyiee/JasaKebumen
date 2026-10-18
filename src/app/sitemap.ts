import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { ensureDb } from "@/lib/db-bootstrap";

/* Sitemap dinamis: entri statis + semua profil usaha yang sudah tayang.
   Selalu dieksekusi saat request (bukan build) karena bergantung DB. */
export const dynamic = "force-dynamic";

const SITE = "https://jasakebumen.id";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE}/daftar`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  try {
    const ready = await ensureDb();
    if (!ready) return staticEntries;

    const providers = await db.provider.findMany({
      where: { status: "published" },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    return [
      ...staticEntries,
      ...providers.map((p) => ({
        url: `${SITE}/usaha/${p.id}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    console.error("[sitemap] DB error:", error);
    return staticEntries;
  }
}
