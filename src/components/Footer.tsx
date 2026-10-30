import Link from "next/link";
import Image from "next/image";
import { waAdminLink } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="bg-green-dark text-black">
      <div className="mx-auto max-w-6xl px-5 pt-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <a href="#" className="flex items-center gap-2">
              <Image
                src="/logo-sm.png"
                alt="JasaKebumen"
                width={28}
                height={28}
                className="h-7 w-7"
              />
              <span className="font-semibold tracking-tight">JasaKebumen</span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-black/60">
              Direktori UMKM & jasa lokal untuk Kabupaten Kebumen — produk asli
              dari produsen, dipesan langsung lewat WhatsApp tanpa komisi.
              Dikelola dari Kebumen sejak 2025.
            </p>
          </div>
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.16em] text-black/40">Jelajah</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-black/70">
              <li><a href="#fitur" className="transition hover:text-black">Fitur</a></li>
              <li><a href="#kategori" className="transition hover:text-black">Kategori usaha</a></li>
              <li><a href="#penyedia" className="transition hover:text-black">Direktori mitra</a></li>
              <li><a href="#cara" className="transition hover:text-black">Cara kerja</a></li>
              <li><a href="#faq" className="transition hover:text-black">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.16em] text-black/40">Mitra &amp; bantuan</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-black/70">
              <li><Link href="/daftar" className="transition hover:text-black">Daftar usaha</Link></li>
              <li><Link href="/kemasan-desain" className="transition hover:text-black">Pojok Kemasan &amp; Desain</Link></li>
              <li><Link href="/papan-informasi" className="transition hover:text-black">Papan Informasi Program</Link></li>
              <li><Link href="/syarat" className="transition hover:text-black">Syarat &amp; ketentuan</Link></li>
              <li><a href={waAdminLink("Halo Admin JasaKebumen.")} target="_blank" rel="noopener noreferrer" className="transition hover:text-black">Hubungi admin</a></li>
              <li><a href="mailto:jasakebumenid@gmail.com" className="transition hover:text-black">jasakebumenid@gmail.com</a></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-white/10 pt-6 font-mono text-[11px] text-black/40 sm:flex-row">
          <p>© 2026 JasaKebumen — Direktori UMKM & jasa lokal Kabupaten Kebumen.</p>
          <p>Dikelola dari Kebumen, Jawa Tengah</p>
        </div>
      </div>

      <div aria-hidden className="mt-8 h-[10vw] overflow-hidden">
        <p className="select-none whitespace-nowrap text-center font-serif font-medium leading-none text-black/[0.07]" style={{ fontSize: "15vw" }}>
          JasaKebumen
        </p>
      </div>
    </footer>
  );
}
