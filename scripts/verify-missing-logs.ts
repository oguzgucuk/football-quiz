import { prisma } from "../lib/db/client";

async function checkMissingLogs() {
  console.log("=== DOĞRULAMA 4: MISSING ANSWERS LOG İNCELEMESİ ===");

  const totalLogs = await prisma.missingAnswerLog.count();
  console.log(`1. missing_answer_logs toplam kayıt sayısı: ${totalLogs}`);

  const logs = await prisma.missingAnswerLog.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
  });

  console.log("2. Son 10 log kaydı:");
  console.log(logs.slice(0, 10));

  await prisma.$disconnect();
}

checkMissingLogs().catch((err) => {
  console.error(err);
  process.exit(1);
});
