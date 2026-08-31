/**
 * Veritabanındaki 'Ronaldo' isimli oyuncuları net ve ayırt edilebilir hale getiren script.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("⚡ [Ronaldo İsim Ayrıştırması] Başlatılıyor...\n");

  // 1. Efsanevi Ronaldo (R9 Fenômeno)
  const r9 = await prisma.player.update({
    where: { id: "cmtfrbg710uv0u6k42v1nbx7c" },
    data: {
      fullName: "Ronaldo Nazário",
      position: "Attack",
      birthDate: new Date("1976-09-18T00:00:00.000Z"),
      nationality: "Brazil",
    },
  });
  console.log(`✓ Efsane R9 güncellendi: ${r9.fullName} (${r9.birthDate?.toISOString().slice(0, 10)})`);

  // 2. Ronaldo Pompeu da Silva (Empoli)
  const rPompeu = await prisma.player.update({
    where: { id: "cmtfrb7q708o2u6k4irncznwg" },
    data: {
      fullName: "Ronaldo Pompeu",
      position: "Midfield",
      nationality: "Brazil",
    },
  });
  console.log(`✓ Ronaldo Pompeu güncellendi: ${rPompeu.fullName}`);

  // 3. Ronaldo da Silva Souza (Bahia / Vitoria)
  const rDaSilva = await prisma.player.update({
    where: { id: "cmtfrbayb0iizu6k4qeh4co9g" },
    data: {
      fullName: "Ronaldo da Silva",
      position: "Midfield",
      nationality: "Brazil",
    },
  });
  console.log(`✓ Ronaldo da Silva güncellendi: ${rDaSilva.fullName}`);

  // 4. Ronaldo Henrique Silva (Flamengo / Shimizu)
  const rHenrique = await prisma.player.update({
    where: { id: "cmtfrbbvw0jbbu6k48zbdcofv" },
    data: {
      fullName: "Ronaldo Henrique",
      position: "Midfield",
      nationality: "Brazil",
    },
  });
  console.log(`✓ Ronaldo Henrique güncellendi: ${rHenrique.fullName}`);

  console.log("\n🎉 [Tüm Ronaldo Kayıtları Başarıyla Netleştirildi!]");
}

main()
  .catch((err) => {
    console.error("Hata:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
