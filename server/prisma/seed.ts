import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

const libraries = [
  {
    name: "Parth Library", slug: "parth-library", phone: "8410003337", timings: "Contact library for timings",
    description: "An underground study library in Mathura with air conditioning, RO water, and separate rows for girls and boys.",
    facilities: ["Underground", "3 ACs", "RO Water", "Separate Girls/Boys Rows"],
    pricing: [{ name: "Fixed Seat", amount: 1000 }, { name: "After 2 PM", amount: 500 }]
  },
  {
    name: "Eklavya Library", slug: "eklavya-library", phone: "8979213211", timings: "24x7",
    description: "A 24x7 underground study library in Mathura with AC, WiFi, CCTV, reading material, and RO water.",
    facilities: ["Underground", "AC", "WiFi", "CCTV", "Books & Notes", "Newspapers", "Magazines", "RO Water", "Separate Girls/Boys Rows", "24x7"],
    pricing: [{ name: "Monthly Seat", amount: 700 }]
  },
  {
    name: "Dev Raj Library", slug: "dev-raj-library", phone: "9412171548", timings: "7 AM - 8 PM",
    description: "A ground-floor study library in Mathura with RO water and separate seating rows for girls and boys.",
    facilities: ["RO Water", "Ground Floor", "Separate Girls/Boys Rows"],
    pricing: [{ name: "Fixed Seat", amount: 700 }, { name: "Unfixed Seat", amount: 600 }]
  },
  {
    name: "Red Ex", slug: "red-ex", phone: "8218840919", timings: "7 AM - 8 PM",
    description: "An underground study library in Mathura offering a focused study environment and RO drinking water.",
    facilities: ["Underground", "RO Water"],
    pricing: [{ name: "Monthly Seat", amount: 650 }]
  },
  {
    name: "Shree Ji Library", slug: "shree-ji-library", phone: "8502805357", timings: "24x7",
    description: "A first-floor, 24x7 study library in Mathura with RO drinking water.",
    facilities: ["RO Water", "First Floor", "24x7"],
    pricing: [{ name: "Monthly Seat", amount: 700 }]
  },
  {
    name: "Om Library", slug: "om-library", phone: "9548857060", timings: "24x7",
    description: "A first-floor, 24x7 study library in Mathura with small and large seat options and RO drinking water.",
    facilities: ["RO Water", "First Floor", "24x7"],
    pricing: [
      { name: "Small Fixed", amount: 700 }, { name: "Small Unfixed", amount: 600 },
      { name: "Large Fixed", amount: 800 }, { name: "Large Unfixed", amount: 700 }
    ]
  }
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    await prisma.user.upsert({
      where: { email: adminEmail },
      create: { name: "BookMySeat Admin", email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 12), role: "ADMIN" },
      update: { passwordHash: await bcrypt.hash(adminPassword, 12), role: "ADMIN", status: "ACTIVE" }
    });
  }

  const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();
  const ownerPassword = process.env.OWNER_PASSWORD;
  const owner = ownerEmail && ownerPassword ? await prisma.user.upsert({
    where: { email: ownerEmail },
    create: {
      name: process.env.OWNER_NAME || "BookMySeat Library Owner",
      email: ownerEmail,
      phone: process.env.OWNER_PHONE || undefined,
      passwordHash: await bcrypt.hash(ownerPassword, 12),
      role: "OWNER"
    },
    update: { passwordHash: await bcrypt.hash(ownerPassword, 12), role: "OWNER", status: "ACTIVE" }
  }) : null;

  for (const library of libraries) {
    await prisma.library.upsert({
      where: { slug: library.slug },
      create: {
        ...library,
        address: "Mathura",
        area: "Mathura",
        city: "Mathura",
        state: "Uttar Pradesh",
        ownerId: owner && (process.env.OWNER_LIBRARY_SLUG || libraries[0].slug) === library.slug ? owner.id : undefined
      },
      update: {
        ...library,
        ...(owner && (process.env.OWNER_LIBRARY_SLUG || libraries[0].slug) === library.slug ? { ownerId: owner.id } : {})
      }
    });
  }

  const studentEmail = process.env.STUDENT_EMAIL?.toLowerCase();
  const studentPassword = process.env.STUDENT_PASSWORD;
  if (studentEmail && studentPassword) {
    await prisma.user.upsert({
      where: { email: studentEmail },
      create: {
        name: process.env.STUDENT_NAME || "BookMySeat Student",
        email: studentEmail,
        phone: process.env.STUDENT_PHONE || undefined,
        passwordHash: await bcrypt.hash(studentPassword, 12),
        role: "STUDENT"
      },
      update: { passwordHash: await bcrypt.hash(studentPassword, 12), role: "STUDENT", status: "ACTIVE" }
    });
  }

  console.log(`Seeded ${libraries.length} verified library records${owner ? " and launch owner" : ""}${studentEmail ? " and launch student" : ""}.`);
}

main().finally(() => prisma.$disconnect());
