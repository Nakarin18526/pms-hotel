import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function utcDay(offset: number): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offset));
}

async function main() {
  const adminEmail = "admin@example.com";
  const adminPassword = "admin1234";

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Hotel Admin",
      passwordHash: await bcrypt.hash(adminPassword, 10),
    },
  });

  const deluxe = await prisma.roomType.upsert({
    where: { id: "seed-deluxe" },
    update: {},
    create: {
      id: "seed-deluxe",
      name: "Deluxe Room",
      description:
        "ห้องพักขนาด 32 ตร.ม. มองเห็นวิวสวน เตียง King size พร้อมระเบียงส่วนตัว",
      maxOccupancy: 2,
      totalUnits: 5,
      imageUrls: [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
      ],
    },
  });

  const suite = await prisma.roomType.upsert({
    where: { id: "seed-suite" },
    update: {},
    create: {
      id: "seed-suite",
      name: "Family Suite",
      description: "ห้องสวีทขนาด 60 ตร.ม. มี 2 ห้องนอน รองรับ 4 ท่าน",
      maxOccupancy: 4,
      totalUnits: 2,
      imageUrls: [
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200",
      ],
    },
  });

  for (let i = 0; i < 365; i++) {
    const d = utcDay(i);
    await prisma.roomRate.upsert({
      where: { roomTypeId_date: { roomTypeId: deluxe.id, date: d } },
      update: {},
      create: { roomTypeId: deluxe.id, date: d, price: 2500 },
    });
    await prisma.roomRate.upsert({
      where: { roomTypeId_date: { roomTypeId: suite.id, date: d } },
      update: {},
      create: { roomTypeId: suite.id, date: d, price: 4500 },
    });
  }

  console.log("Seed complete");
  console.log(`Admin login: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
