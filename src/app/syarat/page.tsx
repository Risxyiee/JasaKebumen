import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FileText } from "lucide-react";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — JasaKebumen",
  description:
    "Syarat dan ketentuan penggunaan JasaKebumen: ketentuan untuk pengunjung, syarat pendaftaran mitra usaha, kebijakan moderasi, ulasan, serta privasi data.",
  openGraph: {
    title: "Syarat & Ketentuan — JasaKebumen",
    description:
      "Ketentuan penggunaan direktori jasa lokal Kabupaten Kebumen: untuk pengunjung dan mitra usaha.",
    url: "/syarat",
    siteName: "JasaKebumen",
    locale: "id_ID",
    type: "website",
  },
};

const LAST_UPDATED = "18 Oktober 2026";

interface Section {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
}

const SECTIONS: Section[] = [
  {
    id: "tentang",
    title: "1. Tentang JasaKebumen",
    body: [
      "JasaKebumen (jasakebumen.id) adalah direktori jasa lokal untuk Kabupaten Kebumen, Jawa Tengah. Kami menghimpun dan menampilkan profil penyedia jasa — seperti teknisi, tukang, dan usaha jasa lainnya — agar masyarakat Kebumen lebih mudah menemukan layanan yang mereka butuhkan di dekat rumah mereka. Seluruh fitur utama situs ini gratis, baik bagi pengunjung maupun bagi mitra usaha yang mendaftar.",
      "Penting dipahami: JasaKebumen hanyalah penghubung informasi. Kami BUKAN penyedia jasa, bukan pihak yang mengerjakan pekerjaan, dan bukan perantara pembayaran. Setiap transaksi, kesepakatan harga, dan hasil pekerjaan terjadi sepenuhnya langsung antara Anda dan mitra usaha terkait.",
    ],
  },
  {
    id: "pengunjung",
    title: "2. Ketentuan untuk Pengunjung",
    body: [
      "Dengan menggunakan situs ini, Anda dianggap telah membaca, memahami, dan menyetujui ketentuan ini. Anda dipersilakan menjelajahi direktori, menghubungi mitra melalui tombol WhatsApp yang tersedia, serta meninggalkan ulasan yang jujur berdasarkan pengalaman Anda sendiri.",
      "Kami mohon Anda menggunakan situs ini secara wajar dan bertanggung jawab:",
    ],
    bullets: [
      "Lakukan verifikasi mandiri sebelum menyetujui pekerjaan — misalnya menanyakan detail harga, estimasi waktu, dan garansi langsung kepada mitra.",
      "Waspada penipuan. Sebaiknya jangan mengirim uang di muka dalam jumlah besar kepada orang yang belum Anda kenal, dan utamakan pembayaran setelah pekerjaan disepakati atau selesai.",
      "Jangan mengambil data situs secara massal (scraping) untuk keperluan komersial tanpa izin tertulis dari kami.",
      "Jangan menyalahgunakan fitur ulasan untuk menyebarkan konten bohong, ujaran kebencian, atau promosi pihak lain.",
    ],
  },
  {
    id: "mitra",
    title: "3. Syarat bagi Mitra Usaha",
    body: [
      "Pendaftaran terbuka bagi pelaku usaha jasa yang benar-benar berdomisili atau melayani wilayah Kabupaten Kebumen. Dengan mengirimkan formulir pendaftaran, Anda menyatakan bahwa seluruh data yang Anda kirimkan adalah benar, tidak menyesatkan, dan Anda berhak untuk menggunakannya — termasuk nama usaha, deskripsi layanan, foto, dan nomor WhatsApp yang aktif.",
      "Sebagai mitra, Anda juga menyetujui hal-hal berikut:",
    ],
    bullets: [
      "Menyediakan layanan sesuai deskripsi yang Anda cantumkan dan menjawab percakapan pelanggan dengan sopan serta wajar.",
      "Tidak mendaftarkan usaha fiktif, akun ganda, atau memakai identitas serta foto milik pihak lain tanpa izin.",
      "Tidak menayangkan konten yang melanggar hukum Indonesia, termasuk konten SARA, pornografi, kekerasan, penipuan, serta promosi barang atau jasa ilegal.",
      "Memahami bahwa ditampilkannya profil usaha di JasaKebumen bukan merupakan sertifikasi legalitas, izin usaha, atau jaminan kualitas dari kami.",
      "Siap menerima peninjauan ulang profil apabila tim kami menemukan ketidaksesuaian data atau menerima laporan yang wajar dari pelanggan.",
    ],
  },
  {
    id: "kurasi",
    title: "4. Kurasi, Moderasi, dan Penayangan",
    body: [
      "Setiap pendaftaran mitra dan setiap ulasan melewati tahap kurasi (moderasi) sebelum tampil di publik. Tim kami berhak menyetujui, meminta perbaikan, menolak, atau menonaktifkan kembali sebuah profil maupun ulasan — termasuk menghapus profil yang sudah tayang — jika ditemukan pelanggaran ketentuan, data yang tidak benar, usaha tidak dapat dihubungi dalam waktu lama, atau ada laporan penipuan yang cukup kuat.",
      "Keputusan kurasi dapat kami sampaikan tanpa kewajiban merinci alasan internal. Jika profil Anda ditolak atau dinonaktifkan dan Anda merasa hal itu keliru, silakan hubungi kami melalui kanal kontak di bagian bawah halaman ini; kami akan meninjau kembali dengan senang hati.",
    ],
  },
  {
    id: "ulasan",
    title: "5. Ulasan dan Rating",
    body: [
      "Ulasan dan rating dimaksudkan untuk membantu calon pelanggan mendapat gambaran yang jujur. Karena itu, ulasan harus didasarkan pada pengalaman nyata dengan mitra yang bersangkutan — bukan ulasan dari pihak yang tidak pernah menggunakan jasa tersebut, ulasan berbayar, balasan dendam, ataupun upaya menekan pesaing.",
      "Kami berhak menolak atau menghapus ulasan yang mengandung data pribadi orang lain, kata-kata kasar yang tidak perlu, tuduhan kriminal yang belum jelas buktinya, konten promosi, atau hal-hal yang melanggar ketentuan ini. Rating rata-rata yang tampil di profil usaha dihitung otomatis dari ulasan yang telah disetujui dan dapat berubah sewaktu-waktu seiring masuknya ulasan baru.",
    ],
  },
  {
    id: "privasi",
    title: "6. Privasi dan Perlindungan Data",
    body: [
      "Kami menghargai privasi Anda dan mengumpulkan data sesedikit mungkin. Dari mitra usaha, kami menyimpan nama usaha, deskripsi, kategori, kecamatan, foto yang diunggah, dan nomor WhatsApp untuk keperluan kontak. Dari pengunjung yang menulis ulasan, kami menyimpan nama panggilan, nilai rating, dan isi komentar. Dari pengunjung yang menghubungi layanan pesan (chat CS), kami menyimpan isi pesan serta kontak yang sukarela ditinggalkan agar admin dapat membalas.",
      "Nomor WhatsApp mitra TIDAK kami tampilkan sebagai teks biasa maupun data terstruktur yang dapat diambil robot. Nomor tersebut hanya dibuka melalui tombol \u201cChat WhatsApp\u201d yang Anda klik sendiri, sehingga risiko nomor dipanen oleh spammer dapat ditekan.",
      "Kami tidak menjual dan tidak menyewakan data Anda kepada pihak ketiga. Data hanya digunakan untuk mengoperasikan dan meningkatkan kualitas direktori ini. Jika Anda ingin data Anda dihapus dari situs kami, hubungi kami melalui kanal kontak di bawah dan kami akan memprosesnya dalam waktu yang wajar.",
    ],
  },
  {
    id: "tanggung-jawab",
    title: "7. Batasan Tanggung Jawab",
    body: [
      "Situs ini disediakan \u201csebagaimana adanya\u201d. Kami berupaya menjaga agar informasi tetap akurat dan mutakhir, namun kami tidak menjamin bahwa seluruh data selalu lengkap, bebas galat, atau tersedia tanpa gangguan. Keputusan untuk menggunakan jasa seorang mitra sepenuhnya adalah keputusan Anda sendiri setelah mempertimbangkan informasi yang tersedia.",
      "Sejauh diizinkan oleh hukum yang berlaku, JasaKebumen tidak bertanggung jawab atas kerugian langsung maupun tidak langsung yang timbul dari transaksi, kesepakatan, kualitas pekerjaan, maupun komunikasi antara Anda dan mitra usaha atau pihak ketiga lainnya. Sengketa apa pun yang terjadi antara pengunjung dan mitra harus diselesaikan oleh kedua belah pihak yang bersangkutan; sejauh kami mampu, kami siap membantu memfasilitasi klarifikasi.",
    ],
  },
  {
    id: "hak-cipta",
    title: "8. Hak Kekayaan Intelektual",
    body: [
      "Nama, logo, desain tampilan, dan konten situs JasaKebumen dilindungi dan tidak boleh disalin atau digunakan ulang untuk keperluan komersial tanpa izin tertulis. Foto dan deskripsi usaha tetap menjadi tanggung jawab mitra yang mengirimkannya; dengan mengirimkannya, mitra memberi kami izin untuk menayangkannya di profil usaha miliknya di situs ini serta di materi promosi kami.",
    ],
  },
  {
    id: "perubahan",
    title: "9. Perubahan Ketentuan",
    body: [
      "Ketentuan ini dapat kami perbarui sewaktu-waktu mengikuti perkembangan layanan. Versi terbaru selalu tersedia di halaman ini beserta tanggal pembaruannya di bagian atas. Perubahan berlaku sejak dipublikasikan; kami sarankan Anda memeriksa halaman ini secara berkala, terutama sebelum mendaftar sebagai mitra.",
    ],
  },
  {
    id: "kontak",
    title: "10. Kontak",
    body: [
      "Pertanyaan tentang ketentuan ini, permintaan penghapusan data, atau laporan pelanggaran dapat disampaikan melalui widget chat CS (tombol chat hijau di sudut situs) yang dikelola admin JasaKebumen, atau melalui email jasakebumenid@gmail.com. Kami berusaha membalas pesan dalam 1-2 hari kerja.",
    ],
  },
];

export default function SyaratPage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-5">
          <Link href="/" className="flex items-center gap-2 text-green transition hover:opacity-80">
            <Image
              src="/logo-sm.png"
              alt="JasaKebumen"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
            <span className="font-semibold tracking-tight text-ink">JasaKebumen</span>
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-5 py-10 md:py-14">
        {/* Judul */}
        <div className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-tint px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-green">
            <FileText className="h-3 w-3" /> Legal
          </span>
          <h1 className="mt-4 font-serif text-3xl text-ink md:text-4xl">Syarat &amp; Ketentuan</h1>
          <p className="mt-3 text-sm text-faint">Terakhir diperbarui: {LAST_UPDATED}</p>
        </div>

        {/* Ringkasan */}
        <div className="mb-10 rounded-2xl border border-green/20 bg-green-tint p-5 md:p-6">
          <h2 className="font-serif text-lg font-semibold text-green">Ringkasan singkat</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink/90">
            <li className="flex gap-2">
              <span aria-hidden className="text-green">•</span>
              JasaKebumen adalah direktori informasi — kami bukan penyedia jasa dan tidak ikut dalam transaksi apa pun.
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-green">•</span>
              Gratis untuk pengunjung maupun mitra; semua pendaftaran dan ulasan melewati kurasi.
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-green">•</span>
              Nomor WhatsApp mitra tidak dipublikasikan sebagai teks — hanya terbuka lewat tombol chat.
            </li>
            <li className="flex gap-2">
              <span aria-hidden className="text-green">•</span>
              Data Anda tidak dijual ke pihak ketiga; permintaan penghapusan data kami proses.
            </li>
          </ul>
        </div>

        {/* Isi */}
        <article className="space-y-9">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id}>
              <h2 className="font-serif text-xl font-semibold text-ink md:text-2xl">{s.title}</h2>
              <div className="mt-3 space-y-3">
                {s.body.map((p, i) => (
                  <p key={i} className="text-[15px] leading-relaxed text-mute">
                    {p}
                  </p>
                ))}
              </div>
              {s.bullets && (
                <ul className="mt-3 space-y-2.5">
                  {s.bullets.map((b, i) => (
                    <li key={i} className="flex gap-2.5 text-[15px] leading-relaxed text-mute">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-green/60" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        {/* CTA */}
        <div className="mt-12 rounded-2xl border border-line bg-surface p-6 text-center shadow-sm">
          <h2 className="font-serif text-lg font-semibold text-ink">Siap bergabung sebagai mitra?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mute">
            Dengan mendaftar, Anda dianggap telah menyetujui seluruh ketentuan di halaman ini.
            Pendaftaran gratis dan ditinjau tim kami sebelum tayang.
          </p>
          <Link
            href="/daftar"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-green px-6 py-3 text-sm font-semibold text-black transition hover:bg-green-dark"
          >
            Daftarkan Usaha Anda
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
