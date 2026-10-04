import { Facebook, Instagram, Mail, MapPin } from "lucide-react";
import { waAdminLink } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="bg-green-dark text-white">
      <div className="mx-auto max-w-6xl px-5 pt-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <a href="#" className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-[7px] bg-white/10">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <span className="font-semibold tracking-tight">JasaKebumen</span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              Direktori jasa lokal untuk Kabupaten Kebumen. Dikelola dari Kebumen sejak 2025.
            </p>
            <div className="mt-5 flex gap-2.5">
              {[Instagram, Facebook, Mail].map((Icon, i) => (
                <a key={i} href="#" aria-label="Media sosial"
                  className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-white/60 ring-1 ring-white/10 transition hover:bg-green hover:text-white">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">Jelajah</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li><a href="#fitur" className="transition hover:text-white">Fitur</a></li>
              <li><a href="#kategori" className="transition hover:text-white">Kategori jasa</a></li>
              <li><a href="#penyedia" className="transition hover:text-white">Penyedia terverifikasi</a></li>
              <li><a href="#cara" className="transition hover:text-white">Cara kerja</a></li>
              <li><a href="#faq" className="transition hover:text-white">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">Mitra &amp; bantuan</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li><a href="#daftar" className="transition hover:text-white">Daftar usaha</a></li>
              <li><a href="#" className="transition hover:text-white">Syarat &amp; ketentuan</a></li>
              <li><a href={waAdminLink("Halo Admin JasaKebumen.")} target="_blank" rel="noopener noreferrer" className="transition hover:text-white">Hubungi admin</a></li>
              <li><a href="mailto:halo@jasakebumen.id" className="transition hover:text-white">halo@jasakebumen.id</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-white/10 pt-6 font-mono text-[11px] text-white/40 sm:flex-row">
          <p>© 2026 JasaKebumen — Direktori jasa lokal Kabupaten Kebumen.</p>
          <p>Dikelola dari Kebumen, Jawa Tengah</p>
        </div>
      </div>

      <div aria-hidden className="mt-8 h-[10vw] overflow-hidden">
        <p className="select-none whitespace-nowrap text-center font-serif font-medium leading-none text-white/[0.07]" style={{ fontSize: "15vw" }}>
          JasaKebumen
        </p>
      </div>
    </footer>
  );
}
