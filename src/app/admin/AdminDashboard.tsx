"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Loader2,
  LogOut,
  MapPin,
  MessageCircle,
  MousePointerClick,
  RefreshCw,
  Search,
  Shield,
  Star,
  Users,
  XCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface District {
  id: string;
  name: string;
  slug: string;
}

interface Provider {
  id: string;
  name: string;
  description: string;
  whatsappNumber: string;
  address: string;
  imageUrl: string | null;
  images: string[];
  priceMin: number | null;
  priceMax: number | null;
  priceNote: string;
  imageCaptions: string[];
  status: string;
  verified: boolean;
  waClicks: number;
  createdAt: string;
  updatedAt: string;
  category: Category;
  district: District;
}

interface AdminReview {
  id: string;
  name: string;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
  provider: { id: string; name: string; status: string };
}

interface CsMsg {
  id: string;
  sessionId: string;
  name: string;
  contact: string;
  text: string;
  handled: boolean;
  createdAt: string;
}

type StatusFilter = "all" | "pending" | "published" | "rejected";
type AdminTab = "mitra" | "ulasan" | "pesan";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: "Menunggu", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  published: { label: "Dipublikasi", color: "text-green", bg: "bg-green-tint border-green/20", icon: CheckCircle2 },
  rejected: { label: "Ditolak", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: XCircle },
};

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<AdminTab>("mitra");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [csMsgs, setCsMsgs] = useState<CsMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/providers?${params}`);
      const data = await res.json();
      setProviders(data.providers || []);
    } catch {
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/messages");
      const data = await res.json();
      setCsMsgs(data.messages || []);
    } catch {
      setCsMsgs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "mitra") fetchProviders();
    else if (tab === "ulasan") fetchReviews();
    else fetchMessages();
  }, [tab, fetchProviders, fetchReviews, fetchMessages]);

  const updateMessageHandled = async (id: string, handled: boolean) => {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, handled }),
      });
      if (res.ok) {
        const data = await res.json();
        setCsMsgs((prev) =>
          prev.map((m) => (m.id === id ? data.message : m))
        );
      }
    } catch {
      // silent
    } finally {
      setUpdating(null);
    }
  };

  const updateReviewStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setReviews((prev) =>
          prev.map((r) => (r.id === id ? data.review : r))
        );
      }
    } catch {
      // silent
    } finally {
      setUpdating(null);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      const res = await fetch("/api/providers/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setProviders((prev) =>
          prev.map((p) => (p.id === id ? data.provider : p))
        );
      }
    } catch {
      // silent
    } finally {
      setUpdating(null);
    }
  };

  /* Toggle badge Terverifikasi — hanya untuk mitra yang sudah dicek langsung */
  const updateVerified = async (id: string, verified: boolean) => {
    setUpdating(id);
    try {
      const res = await fetch("/api/providers/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, verified }),
      });
      if (res.ok) {
        const data = await res.json();
        setProviders((prev) =>
          prev.map((p) => (p.id === id ? data.provider : p))
        );
      }
    } catch {
      // silent
    } finally {
      setUpdating(null);
    }
  };

  const filteredProviders = providers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.district.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const counts = {
    pending: providers.filter((p) => p.status === "pending").length,
    published: providers.filter((p) => p.status === "published").length,
    rejected: providers.filter((p) => p.status === "rejected").length,
  };

  /* KPI PRD: jumlah usaha terverifikasi + total klik tombol WhatsApp */
  const kpi = {
    total: providers.length,
    verified: providers.filter((p) => p.verified).length,
    waClicks: providers.reduce((s, p) => s + (p.waClicks || 0), 0),
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-faint transition hover:text-ink">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Beranda</span>
            </Link>
            <span className="text-faint">·</span>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green">
                <Shield className="h-3.5 w-3.5 text-black" />
              </div>
              <span className="font-serif text-lg font-semibold text-ink">Admin</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={
                tab === "mitra" ? fetchProviders : tab === "ulasan" ? fetchReviews : fetchMessages
              }
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-mute transition hover:border-green/30 hover:text-green disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-mute transition hover:border-red-200 hover:text-red-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              Keluar
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {/* Tab: Mitra / Ulasan */}
        <div className="flex items-center gap-2">
          {([
            { key: "mitra", label: "Mitra", count: counts.pending },
            { key: "ulasan", label: "Ulasan", count: reviews.filter((r) => r.status === "pending").length },
            { key: "pesan", label: "Pesan", count: csMsgs.filter((m) => !m.handled).length },
          ] as { key: AdminTab; label: string; count: number }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                tab === t.key
                  ? "bg-green text-black"
                  : "border border-line bg-surface text-mute hover:border-green/30 hover:text-green"
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold ${
                  tab === t.key ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "mitra" && (<>
        {/* KPI Cards — metrik sukses sesuai PRD */}
        <div className="grid gap-4 sm:grid-cols-3">
          {([
            { label: "Total pendaftar", value: kpi.total, icon: Users, accent: "border-line bg-surface", iconBg: "bg-green-tint", iconColor: "text-green" },
            { label: "Terverifikasi", value: kpi.verified, icon: BadgeCheck, accent: "border-line bg-surface", iconBg: "bg-green-tint", iconColor: "text-green" },
            { label: "Klik tombol WhatsApp (KPI)", value: kpi.waClicks, icon: MousePointerClick, accent: "border-green/20 bg-green-tint", iconBg: "bg-surface", iconColor: "text-green" },
          ] as const).map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.accent}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.iconBg}`}>
                  <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-semibold tabular-nums text-ink">{s.value}</p>
                  <p className="text-xs text-faint">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {([
            { key: "pending", label: "Menunggu Review", icon: Clock, accent: "border-amber-200 bg-amber-50", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
            { key: "published", label: "Dipublikasi", icon: CheckCircle2, accent: "border-green/20 bg-green-tint", iconBg: "bg-green-tint", iconColor: "text-green" },
            { key: "rejected", label: "Ditolak", icon: XCircle, accent: "border-red-200 bg-red-50", iconBg: "bg-red-100", iconColor: "text-red-500" },
          ] as const).map((s) => (
            <div key={s.key} className={`rounded-xl border p-4 ${s.accent}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.iconBg}`}>
                  <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-ink">{counts[s.key as keyof typeof counts]}</p>
                  <p className="text-xs text-faint">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter & Search */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-faint" />
            <span className="text-sm font-medium text-mute">Filter:</span>
            {(["all", "pending", "published", "rejected"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`rounded-md border px-3 py-1 text-xs font-medium transition ${
                  statusFilter === f
                    ? "border-green bg-green text-black"
                    : "border-line bg-surface text-mute hover:border-green/30 hover:text-green"
                }`}
              >
                {f === "all" ? "Semua" : STATUS_CONFIG[f].label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mitra…"
              className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-4 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15 sm:w-64"
            />
          </div>
        </div>

        {/* Provider List */}
        <div className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-faint" />
              <span className="ml-3 text-mute">Memuat data mitra…</span>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="rounded-xl border border-line bg-surface py-16 text-center">
              <Eye className="mx-auto h-10 w-10 text-faint" />
              <p className="mt-3 text-mute">Tidak ada mitra ditemukan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProviders.map((p) => {
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                const isUpdating = updating === p.id;

                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border bg-surface p-5 transition-shadow hover:shadow-md ${
                      p.status === "pending"
                        ? "border-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,.08)]"
                        : "border-line"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      {/* Left: Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-tint font-serif text-sm font-semibold text-green">
                            {p.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="truncate text-base font-semibold text-ink">{p.name}</h3>
                              {p.verified && (
                                <BadgeCheck
                                  className="h-4 w-4 shrink-0 text-green"
                                  aria-label="Sudah terverifikasi"
                                />
                              )}
                              <span className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {cfg.label}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-faint">
                              {p.category.name} · {p.district.name}
                            </p>
                          </div>
                        </div>

                        {p.description && (
                          <p className="mt-3 line-clamp-2 text-sm text-mute leading-relaxed">
                            {p.description}
                          </p>
                        )}

                        {/* Keterangan harga — dibaca admin saat kurasi
                            (wajib di pendaftaran; usaha lama bisa kosong) */}
                        {(p.priceMin || p.priceMax || p.priceNote ||
                          (p.imageCaptions || []).some((c) => c)) && (
                          <div className="mt-2 rounded-lg border border-line bg-paper px-3 py-2 text-xs">
                            {(p.priceMin || p.priceMax) && (
                              <p className="font-mono font-semibold tabular-nums text-ink">
                                {p.priceMin ? `Rp ${p.priceMin.toLocaleString("id-ID")}` : "—"}
                                {p.priceMax && p.priceMax !== p.priceMin
                                  ? ` – Rp ${p.priceMax.toLocaleString("id-ID")}`
                                  : ""}
                              </p>
                            )}
                            {(p.imageCaptions || []).some((c) => c) && (
                              <p className="mt-1 text-mute">
                                <span className="font-semibold">Menu/foto:</span>{" "}
                                {p.imageCaptions.filter(Boolean).join(" · ")}
                              </p>
                            )}
                            {p.priceNote && (
                              <p className="mt-1 whitespace-pre-line text-mute">{p.priceNote}</p>
                            )}
                          </div>
                        )}

                        {/* Foto usaha — dilayani endpoint terlindungi (cookie admin) */}
                        {p.images && p.images.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {p.images.map((_, i) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                key={i}
                                src={`/api/providers/${p.id}/images/${i}`}
                                alt={`Foto ${i + 1} ${p.name}`}
                                loading="lazy"
                                className="h-16 w-16 rounded-lg border border-line object-cover"
                              />
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-faint">
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            +62{p.whatsappNumber}
                          </span>
                          {p.address && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {p.address}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 font-medium text-green">
                            <MousePointerClick className="h-3 w-3" />
                            {p.waClicks || 0} klik WA
                          </span>
                          <span>
                            {new Date(p.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                        {p.status !== "rejected" && (
                          <button
                            onClick={() => updateVerified(p.id, !p.verified)}
                            disabled={isUpdating}
                            title={
                              p.verified
                                ? "Klik untuk mencabut badge Terverifikasi"
                                : "Tandai sudah dicek langsung — badge ✓ tampil di situs"
                            }
                            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                              p.verified
                                ? "bg-green text-black hover:bg-green-dark"
                                : "border border-green/30 bg-surface text-green hover:bg-green-tint"
                            }`}
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <BadgeCheck className="h-3.5 w-3.5" />
                            )}
                            {p.verified ? "Terverifikasi" : "Verifikasi"}
                          </button>
                        )}
                        {p.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateStatus(p.id, "published")}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-green px-4 py-2 text-xs font-semibold text-black transition hover:bg-green-dark disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => updateStatus(p.id, "rejected")}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-surface px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </>
                        )}
                        {p.status === "rejected" && (
                          <button
                            onClick={() => updateStatus(p.id, "published")}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-xs font-medium text-mute transition hover:border-green/30 hover:text-green disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            Approve
                          </button>
                        )}
                        {p.status === "published" && (
                          <div className="flex gap-2">
                            <a
                              href={`https://wa.me/62${p.whatsappNumber}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-mute transition hover:border-green/30 hover:text-green"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              WhatsApp
                            </a>
                            <button
                              onClick={() => updateStatus(p.id, "rejected")}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-mute transition hover:border-red-200 hover:text-red-600 disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        </>
        )}

        {tab === "ulasan" && (
          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-faint" />
                <span className="ml-3 text-mute">Memuat ulasan…</span>
              </div>
            ) : reviews.length === 0 ? (
              <div className="rounded-xl border border-line bg-surface py-16 text-center">
                <Star className="mx-auto h-10 w-10 text-faint" />
                <p className="mt-3 text-mute">Belum ada ulasan masuk.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((r) => {
                  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  const isUpdating = updating === r.id;

                  return (
                    <div
                      key={r.id}
                      className={`rounded-xl border bg-surface p-5 transition-shadow hover:shadow-md ${
                        r.status === "pending"
                          ? "border-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,.08)]"
                          : "border-line"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Bintang */}
                            <span className="inline-flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Star
                                  key={n}
                                  className={`h-4 w-4 ${r.rating >= n ? "fill-amber-400 text-amber-400" : "text-stone-300"}`}
                                />
                              ))}
                            </span>
                            <span className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${cfg.bg} ${cfg.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {cfg.label}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-ink">
                            {r.name}
                            <span className="font-normal text-faint">
                              {" "}untuk{" "}
                              <Link href={`/usaha/${r.provider.id}`} className="text-green underline underline-offset-2 hover:text-green-dark" target="_blank">
                                {r.provider.name}
                              </Link>
                            </span>
                          </p>
                          {r.comment && (
                            <p className="mt-2 text-sm leading-relaxed text-mute">{r.comment}</p>
                          )}
                          <p className="mt-2 text-xs text-faint">
                            {new Date(r.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {r.status !== "published" && (
                            <button
                              onClick={() => updateReviewStatus(r.id, "published")}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-green px-4 py-2 text-xs font-semibold text-black transition hover:bg-green-dark disabled:opacity-50"
                            >
                              {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              Approve
                            </button>
                          )}
                          {r.status !== "rejected" && (
                            <button
                              onClick={() => updateReviewStatus(r.id, "rejected")}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-surface px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "pesan" && (
          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-faint" />
                <span className="ml-3 text-mute">Memuat pesan…</span>
              </div>
            ) : csMsgs.length === 0 ? (
              <div className="rounded-xl border border-line bg-surface py-16 text-center">
                <MessageCircle className="mx-auto h-10 w-10 text-faint" />
                <p className="mt-3 text-mute">Belum ada pesan masuk.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...csMsgs]
                  .sort((a, b) => (a.handled === b.handled ? 0 : a.handled ? 1 : -1))
                  .map((m) => {
                    const isUpdating = updating === m.id;
                    const waDigits = m.contact.replace(/\D/g, "").replace(/^0/, "62");

                    return (
                      <div
                        key={m.id}
                        className={`rounded-xl border bg-surface p-5 transition-shadow hover:shadow-md ${
                          m.handled ? "border-line" : "border-amber-200 shadow-[0_0_0_1px_rgba(245,158,11,.08)]"
                        }`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-ink">
                                {m.name || "Pengunjung"}
                              </p>
                              {!m.handled && (
                                <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                  Belum ditangani
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-faint">
                              {new Date(m.createdAt).toLocaleString("id-ID", {
                                day: "numeric", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                              })}
                              {" "}· sesi {m.sessionId.slice(-6)}
                            </p>
                            <p className="mt-3 text-sm leading-relaxed text-mute">{m.text}</p>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            {waDigits && (
                              <a
                                href={`https://wa.me/${waDigits}?text=${encodeURIComponent(`Halo ${m.name || ""}, saya admin JasaKebumen. Menjawab pesan Anda: "${m.text.slice(0, 60)}..."`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-green px-4 py-2 text-xs font-semibold text-black transition hover:bg-green-dark"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                Balas WA
                              </a>
                            )}
                            <button
                              onClick={() => updateMessageHandled(m.id, !m.handled)}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-4 py-2 text-xs font-medium text-mute transition hover:border-green/30 hover:text-green disabled:opacity-50"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : m.handled ? (
                                <Eye className="h-3.5 w-3.5" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              {m.handled ? "Buka lagi" : "Tandai selesai"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Footer note */}
        <p className="mt-10 text-center text-xs text-faint">
          Dashboard admin JasaKebumen — data tersimpan di database lokal.
        </p>
      </main>
    </div>
  );
}
