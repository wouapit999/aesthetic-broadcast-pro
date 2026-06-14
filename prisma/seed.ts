import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@aesthetic.shop";
const adminPassword = process.env.ADMIN_PASSWORD ?? "ChangeMe123!";

async function main() {
  console.log("🌱 Seeding database...");

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: { email: adminEmail, passwordHash, role: "admin" },
  });

  await prisma.settings.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      businessName: "Lumière Aesthetic Studio",
      businessDescription: "Premium skincare, facials & beauty treatments.",
      businessCategory: "Aesthetic",
      businessAddress: "Akwa, Douala, Cameroon",
      businessPhone: "+237600000000",
      openingHours: "Mon–Sat 9:00–19:00",
      language: "en",
      country: "Cameroon",
      primaryColor: "#E91E63",
      secondaryColor: "#9C27B0",
      accentColor: "#FF4081",
    },
  });

  const sampleContacts = [
    { name: "Ama Nguele", phone: "+237671000001", tags: ["vip", "facial"], gender: "female" },
    { name: "Brenda Okoro", phone: "+237671000002", tags: ["new"], gender: "female" },
    { name: "Chantal Mbarga", phone: "+237671000003", tags: ["vip", "botox"], gender: "female" },
    { name: "Daniela Sousa", phone: "+258840000004", tags: ["spa"], gender: "female" },
    { name: "Kwame Mensah", phone: "+233200000005", tags: ["new", "men"], gender: "male" },
  ];
  for (const c of sampleContacts) {
    await prisma.contact.upsert({ where: { phone: c.phone }, update: {}, create: c });
  }

  await prisma.segment.upsert({
    where: { id: "seed-vip-segment" },
    update: {},
    create: {
      id: "seed-vip-segment",
      name: "VIP Clients",
      rules: {
        combinator: "AND",
        conditions: [{ field: "tags", op: "contains", value: "vip" }],
      },
    },
  });

  const templates = [
    {
      name: "Welcome Offer",
      language: "en",
      category: "MARKETING",
      body: "Welcome to {{business}} ✨ Enjoy 15% off your first facial this week. Reply BOOK to reserve your spot!",
    },
    {
      name: "Birthday Treat",
      language: "en",
      category: "MARKETING",
      body: "Happy Birthday {{name}}! 🎉 Celebrate with a complimentary glow facial on us. Valid this month only 💆‍♀️",
    },
    {
      name: "Offre de Bienvenue",
      language: "fr",
      category: "MARKETING",
      body: "Bienvenue chez {{business}} ✨ Profitez de 15% de réduction sur votre premier soin. Répondez RDV pour réserver !",
    },
  ];
  for (const t of templates) {
    const exists = await prisma.template.findFirst({ where: { name: t.name } });
    if (!exists) await prisma.template.create({ data: t });
  }

  console.log(`✅ Seed complete. Admin login: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
