import { prisma } from "../lib/db/client";

async function setupPoliciesAndTest() {
  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow public select team-logos'
        ) THEN
          CREATE POLICY "Allow public select team-logos" ON storage.objects FOR SELECT USING (bucket_id = 'team-logos');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow public insert team-logos'
        ) THEN
          CREATE POLICY "Allow public insert team-logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'team-logos');
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow public update team-logos'
        ) THEN
          CREATE POLICY "Allow public update team-logos" ON storage.objects FOR UPDATE USING (bucket_id = 'team-logos');
        END IF;
      END
      $$;
    `);
    console.log("✅ Storage RLS politikaları tanımlandı.");
  } catch (err: any) {
    console.error("Policy error:", err.message);
  }
}

setupPoliciesAndTest().finally(() => prisma.$disconnect());
