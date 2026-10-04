import { db } from "../src/lib/db";

async function seed() {
  // Seed categories
  const cats = [
    { name: "Servis AC & elektronik", slug: "servis-ac", icon: "air-vent" },
    { name: "Servis laptop & HP", slug: "servis-laptop", icon: "laptop" },
    { name: "Rental & cuci mobil", slug: "rental-mobil", icon: "car" },
    { name: "Cleaning service & laundry", slug: "cleaning-laundry", icon: "sparkles" },
    { name: "Fotografer & video", slug: "fotografer", icon: "camera" },
    { name: "Tukang listrik & CCTV", slug: "tukang-listrik", icon: "zap" },
    { name: "Tukang & renovasi rumah", slug: "tukang-renovasi", icon: "hammer" },
    { name: "Barbershop & salon", slug: "barbershop", icon: "scissors" },
  ];

  for (const c of cats) {
    await db.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }

  // Seed districts
  const districts = [
    "Kebumen", "Gombong", "Karanganyar", "Kutowinangun", "Prembun",
    "Sruweng", "Petanahan", "Puring", "Klirong", "Buluspesantren", "Alian",
    "Pejagoan", "Adimulyo", "Poncowarno", "Rowokele", "Ambal", "Kuwarasan",
    "Mirit", "Bonorowo", "Panjer", "Sadang", "Buayan", "Ayah", "Sempor",
    "Somagede", "Kalibangkang", "Karangsambung", "Karanggayam", "Padureso",
  ];

  for (const name of districts) {
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    await db.district.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
  }

  // Seed some sample providers as "published"
  const allCats = await db.category.findMany();
  const allDists = await db.district.findMany();
  const catMap = Object.fromEntries(allCats.map(c => [c.slug, c.id]));
  const distMap = Object.fromEntries(allDists.map(d => [d.name, d.id]));

  const providers = [
    { name: "AC Sejahtera", catSlug: "servis-ac", distName: "Kebumen", desc: "Jasa servis AC, cuci AC, isi freon, dan servis elektronik rumah tangga.", wa: "6281270010001" },
    { name: "LaptopFix Karanganyar", catSlug: "servis-laptop", distName: "Karanganyar", desc: "Servis laptop dan HP, ganti LCD, install ulang software.", wa: "6281270010002" },
    { name: "Gombong AutoCare", catSlug: "rental-mobil", distName: "Gombong", desc: "Rental mobil lepas kunci & dengan sopir, cuci mobil, detailing.", wa: "6281270010003" },
    { name: "BersihKilat", catSlug: "cleaning-laundry", distName: "Kutowinangun", desc: "Cleaning service rumah, cuci sofa, kasur, karpet, dan laundry harian.", wa: "6281270010004" },
    { name: "Ruang Lensa Studio", catSlug: "fotografer", distName: "Kebumen", desc: "Jasa foto dan video wedding, prewedding, dokumentasi acara.", wa: "6281270010005" },
    { name: "Bangunan Jaya", catSlug: "tukang-renovasi", distName: "Gombong", desc: "Tukang bangunan, renovasi rumah, keramik, genteng atap, plesteran.", wa: "6281270010006" },
    { name: "Listrik Buwono", catSlug: "tukang-listrik", distName: "Prembun", desc: "Tukang listrik profesional, instalasi kabel, pasang CCTV.", wa: "6281270010007" },
    { name: "Kedai Gunting", catSlug: "barbershop", distName: "Kebumen", desc: "Barbershop & salon, potong rambut, cukur, juga melayani panggilan.", wa: "6281270010008" },
  ];

  for (const p of providers) {
    const existing = await db.provider.findFirst({ where: { name: p.name } });
    if (!existing) {
      await db.provider.create({
        data: {
          name: p.name,
          description: p.desc,
          whatsappNumber: p.wa,
          status: "published",
          categoryId: catMap[p.catSlug],
          districtId: distMap[p.distName],
        },
      });
    }
  }

  console.log("✅ Seed complete!");
  await db.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
