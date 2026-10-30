"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  LogIn,
  LockKeyhole,
  Shield,
  TriangleAlert,
  User,
} from "lucide-react";
import AdminDashboard from "./AdminDashboard";

type View = "loading" | "setup" | "login" | "dashboard";

interface SessionInfo {
  envConfigured: boolean;
  dbConfigured: boolean;
  authed: boolean;
}

const inputCls =
  "w-full rounded-lg border border-line bg-surface py-2.5 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-faint transition focus:border-green focus:ring-2 focus:ring-green/15";

export default function AdminPage() {
  const [view, setView] = useState<View>("loading");
  const [session, setSession] = useState<SessionInfo | null>(null);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session", { cache: "no-store" });
      const data: SessionInfo = await res.json();
      setSession(data);
      setView(data.authed ? "dashboard" : data.dbConfigured || data.envConfigured ? "login" : "setup");
    } catch {
      setSession(null);
      setView("login"); // paling aman: minta login, error detail muncul saat submit
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        const data: SessionInfo = await res.json();
        if (cancelled) return;
        setSession(data);
        setView(
          data.authed
            ? "dashboard"
            : data.dbConfigured || data.envConfigured
              ? "login"
              : "setup"
        );
      } catch {
        if (cancelled) return;
        setSession(null);
        setView("login"); // paling aman: minta login, error detail muncul saat submit
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // silent — tetap kembali ke layar login
    }
    await loadSession();
  }, [loadSession]);

  if (view === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="flex items-center gap-3 text-mute">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Memeriksa sesi admin…</span>
        </div>
      </div>
    );
  }

  if (view === "dashboard") {
    return <AdminDashboard onLogout={logout} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-5 py-10">
      {/* Kartu utama */}
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green">
            <Shield className="h-6 w-6 text-black" />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-semibold text-ink">Admin JasaKebumen</h1>
          <p className="mt-1 text-sm text-mute">
            {view === "setup"
              ? "Pengaturan awal — buat username dan sandi untuk dashboard admin."
              : "Masuk untuk mengelola mitra, ulasan, dan pesan pengunjung."}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
          {view === "setup" ? (
            <SetupForm onDone={loadSession} onBack={() => setView("login")} />
          ) : (
            <LoginForm
              onDone={loadSession}
              onReset={() => setView("setup")}
              canReset={!session?.envConfigured}
            />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-faint">
          <Link href="/" className="underline underline-offset-2 transition hover:text-green">
            ← Kembali ke beranda
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ---------- Form login ---------- */

function LoginForm({
  onDone,
  onReset,
  canReset,
}: {
  onDone: () => Promise<void>;
  onReset: () => void;
  canReset: boolean;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await onDone();
        return;
      }
      setError(data.error || "Gagal masuk. Coba lagi.");
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="relative">
        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          autoComplete="username"
          className={inputCls}
        />
      </div>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sandi"
          autoComplete="current-password"
          className={inputCls}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green px-6 py-3 text-sm font-semibold text-black transition hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        Masuk
      </button>

      {canReset ? (
        <p className="text-center text-xs text-faint">
          Lupa sandi?{" "}
          <button
            type="button"
            onClick={onReset}
            className="font-medium text-green underline underline-offset-2 transition hover:text-green-dark"
          >
            Atur ulang dengan kode setup
          </button>
        </p>
      ) : (
        <p className="text-center text-xs leading-relaxed text-faint">
          Akses admin dikunci lewat Cloudflare Secrets (ADMIN_USERNAME &amp; ADMIN_PASSWORD).
          Untuk mengganti kredensial, ubah secrets di dashboard Cloudflare.
        </p>
      )}
    </form>
  );
}

/* ---------- Wizard pengaturan awal / atur ulang ---------- */

function SetupForm({ onDone, onBack }: { onDone: () => Promise<void>; onBack: () => void }) {
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (password !== confirm) {
      setError("Konfirmasi sandi tidak sama.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, username, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setInfo("Kredensial tersimpan. Mengbuka dashboard…");
        await onDone();
        return;
      }
      setError(data.error || "Gagal menyimpan. Coba lagi.");
    } catch {
      setError("Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Masukkan <b>kode setup</b> yang diberikan pemilik situs saat instalasi. Kode yang sama
          dipakai untuk atur ulang bila sandi terlupa.
        </span>
      </div>

      <div className="relative">
        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Kode setup (contoh: JK-XXXXX-…)"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className={`${inputCls} font-mono tracking-wide`}
        />
      </div>
      <div className="relative">
        <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username admin (mis. admin)"
          autoComplete="username"
          className={inputCls}
        />
      </div>
      <div className="relative">
        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Sandi (minimal 8 karakter)"
          autoComplete="new-password"
          className={inputCls}
        />
      </div>
      <div className="relative">
        <CheckCircle2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Ulangi sandi"
          autoComplete="new-password"
          className={inputCls}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {info && (
        <div className="flex items-start gap-2 rounded-lg border border-green/20 bg-green-tint px-3 py-2.5 text-sm text-green">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {info}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green px-6 py-3 text-sm font-semibold text-black transition hover:bg-green-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
        Simpan &amp; Masuk
      </button>

      <p className="text-center text-xs text-faint">
        Sudah punya akun?{" "}
        <button
          type="button"
          onClick={onBack}
          className="font-medium text-green underline underline-offset-2 transition hover:text-green-dark"
        >
          Kembali ke form masuk
        </button>
      </p>
    </form>
  );
}
