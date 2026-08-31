/**
 * Kimlik doğrulama (Auth) sistemini uçtan uca test eden script.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signSessionToken, verifySessionToken } from "../lib/auth/jwt";

const prisma = new PrismaClient();

async function runAuthTests() {
  console.log("🔐 [Auth Testi] Başlatılıyor...\n");

  const testUsername = `testuser_${Date.now()}`;
  const testEmail = `${testUsername}@example.com`;
  const testPassword = "superSecretPassword123";

  // 1. Password hashing
  const hash = await bcrypt.hash(testPassword, 10);
  const isValidPass = await bcrypt.compare(testPassword, hash);
  console.log(`✓ [bcrypt] Parola şifreleme ve doğrulama: ${isValidPass ? "BAŞARILI" : "BAŞARISIZ"}`);

  // 2. User creation in DB
  const user = await prisma.user.create({
    data: {
      username: testUsername,
      email: testEmail,
      passwordHash: hash,
      eloRating: 1000,
      rankTier: "bronze",
      isGuest: false,
    },
  });
  console.log(`✓ [Database] Test kullanıcısı oluşturuldu: ${user.username} (${user.id})`);

  // 3. JWT Signing & Verification
  const token = await signSessionToken({
    userId: user.id,
    username: user.username,
    isGuest: false,
  });
  console.log(`✓ [JWT] Token üretildi (${token.slice(0, 25)}...)`);

  const payload = await verifySessionToken(token);
  console.log(`✓ [JWT] Token doğrulandı: Kullanıcı ID=${payload?.userId}, İsim=${payload?.username}`);

  // 4. Cleanup test user
  await prisma.user.delete({ where: { id: user.id } });
  console.log(`✓ [Temizlik] Test kullanıcısı başarıyla silindi.`);

  console.log("\n🎉 [Tüm Auth Testleri Başarılı!]");
}

runAuthTests()
  .catch((err) => {
    console.error("❌ [Auth Test Hatası]:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
