import { prisma } from "../lib/db/client";

async function setupBucket() {
  try {
    await prisma.$executeRaw`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES (
        'team-logos',
        'team-logos',
        true,
        524288,
        ARRAY['image/svg+xml', 'image/png', 'image/webp']::text[]
      )
      ON CONFLICT (id) DO UPDATE SET
        public = true,
        file_size_limit = 524288,
        allowed_mime_types = ARRAY['image/svg+xml', 'image/png', 'image/webp']::text[];
    `;
    console.log("✅ storage.buckets 'team-logos' oluşturuldu/güncellendi.");

    const buckets: any = await prisma.$queryRaw`SELECT * FROM storage.buckets WHERE id = 'team-logos';`;
    console.log("Bucket:", buckets);
  } catch (err: any) {
    console.error("Bucket setup error:", err.message);
  }
}

setupBucket().finally(() => prisma.$disconnect());
