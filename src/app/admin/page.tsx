"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Shield,
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
  imageUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  category: Category;
  district: District;
}

type StatusFilter = "all" | "pending" | "published" | "rejected";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: "Menunggu", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  published: { label: "Dipublikasi", color: "text-green", bg: "bg-green-tint border-green/20", icon: CheckCircle2 },
  rejected: { label: "Ditolak", color: "text-red-600", bg: "bg-red-50 border-red-200", icon: XCircle },
};

export default function AdminPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
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

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

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

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-faint transition hover:text-ink">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Beranda</span>
            </Link>
            <span className="text-faint">·</span>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green">
                <Shield className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-serif text-lg font-semibold text-ink">Admin</span>
            </div>
          </div>
          <button
            onClick={fetchProviders}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-mute transition hover:border-green/30 hover:text-green disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-5 py-8">
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
                    ? "border-green bg-green text-white"
                    : "border-line bg-white text-mute hover:border-green/30 hover:text-green"
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
              className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-4 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15 sm:w-64"
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
            <div className="rounded-xl border border-line bg-white py-16 text-center">
              <Eye className="mx-auto h-10 w-10 text-faint" />
              <p className="mt-3 text-mute">Tidak ada mitra ditemukan.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProviders.map((p) => {
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                const isUpdating = updating === p;

                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border bg-white p-5 transition-shadow hover:shadow-md ${
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

                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-faint">
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            +62{p.whatsappNumber}
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
                        {p.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateStatus(p.id, "published")}
                              disabled={isUpdating}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-green px-4 py-2 text-xs font-semibold text-white transition hover:bg-green-dark disabled:opacity-50"
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
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
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

        {/* Footer note */}
        <p className="mt-10 text-center text-xs text-faint">
          Dashboard admin JasaKebumen — data tersimpan di database lokal.
        </p>
      </main>
    </div>
  );
}
