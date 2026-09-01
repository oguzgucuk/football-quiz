import { prisma } from "../lib/db/client";

async function checkStorage() {
  try {
    const buckets: any = await prisma.$queryRaw`SELECT * FROM storage.buckets;`;
    console.log("Storage buckets:", buckets);
  } catch (err: any) {
    console.error("Storage query error:", err.message);
  }
}

checkStorage().finally(() => prisma.$disconnect());
