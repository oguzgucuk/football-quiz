import assert from "assert";
import fs from "fs";
import path from "path";
import { prisma } from "../lib/db/client";
import { getCommonPlayersByTeams, getCommonPlayersByNationAndTeam } from "../lib/db/players";
import { matchPlayerAnswer } from "../lib/validation/matchPlayerAnswer";

async function main() {
  console.log("============================================================");
  console.log("🧪 GATTUSO & EFSANELER DOĞRULAMA TESTİ");
  console.log("============================================================\n");

  // 1. JSON İndeksinde Arama Kontrolü
  console.log("--- 1. players-index.json Kontrolü ---");
  const indexPath = path.join(process.cwd(), "public", "data", "players-index.json");
  assert(fs.existsSync(indexPath), "players-index.json mevcut");
  const indexData = JSON.parse(fs.readFileSync(indexPath, "utf-8")) as { id: string; name: string; popularityScore: number }[];

  const gattusoInIndex = indexData.find((p) => p.name === "Gennaro Gattuso");
  assert(gattusoInIndex !== undefined, "Gennaro Gattuso players-index.json içerisinde bulundu");
  console.log(`✅ Gennaro Gattuso indekste mevcut! (Puan: ${gattusoInIndex.popularityScore})`);

  const nestaInIndex = indexData.find((p) => p.name === "Alessandro Nesta");
  assert(nestaInIndex !== undefined, "Alessandro Nesta players-index.json içerisinde bulundu");
  console.log(`✅ Alessandro Nesta indekste mevcut! (Puan: ${nestaInIndex.popularityScore})`);

  const gullitInIndex = indexData.find((p) => p.name === "Ruud Gullit");
  assert(gullitInIndex !== undefined, "Ruud Gullit players-index.json içerisinde bulundu");
  console.log(`✅ Ruud Gullit indekste mevcut! (Puan: ${gullitInIndex.popularityScore})`);

  const rijkaardInIndex = indexData.find((p) => p.name === "Frank Rijkaard");
  assert(rijkaardInIndex !== undefined, "Frank Rijkaard players-index.json içerisinde bulundu");
  console.log(`✅ Frank Rijkaard indekste mevcut! (Puan: ${rijkaardInIndex.popularityScore})`);

  const cafuInIndex = indexData.find((p) => p.name === "Cafu");
  assert(cafuInIndex !== undefined, "Cafu players-index.json içerisinde bulundu");
  console.log(`✅ Cafu indekste mevcut! (Puan: ${cafuInIndex.popularityScore})`);

  // 2. Kulüpler
  console.log("\n--- 2. Kulüp Doğrulama ---");
  const acMilan = await prisma.team.findFirst({ where: { name: "AC Milan" } });
  const rangers = await prisma.team.findFirst({ where: { name: "Rangers FC" } });
  const salernitana = await prisma.team.findFirst({ where: { name: "US Salernitana 1919" } });
  const lazio = await prisma.team.findFirst({ where: { name: "SS Lazio" } });
  const chelsea = await prisma.team.findFirst({ where: { name: "Chelsea FC" } });

  assert(acMilan !== null, "AC Milan bulundu");
  assert(rangers !== null, "Rangers FC bulundu");
  assert(salernitana !== null, "US Salernitana 1919 bulundu");
  assert(lazio !== null, "SS Lazio bulundu");
  assert(chelsea !== null, "Chelsea FC bulundu");

  // 3. Ortak Kulüp Modu (Team vs Team)
  console.log("\n--- 3. Ortak Kulüp Doğrulama ---");
  // AC Milan - Rangers FC
  const milanRangers = await getCommonPlayersByTeams(acMilan.id, rangers.id, 10);
  const gattusoInMilanRangers = milanRangers.find((p) => p.fullName === "Gennaro Gattuso");
  assert(gattusoInMilanRangers !== undefined, "AC Milan - Rangers FC ortak oyuncusu olarak Gattuso bulundu");
  console.log(`✅ AC Milan - Rangers FC ortak oyuncusu: Gennaro Gattuso (${gattusoInMilanRangers.fullName})`);

  // AC Milan - US Salernitana 1919
  const milanSalernitana = await getCommonPlayersByTeams(acMilan.id, salernitana.id, 10);
  const gattusoInSalernitana = milanSalernitana.find((p) => p.fullName === "Gennaro Gattuso");
  assert(gattusoInSalernitana !== undefined, "AC Milan - US Salernitana 1919 ortak oyuncusu olarak Gattuso bulundu");
  console.log(`✅ AC Milan - US Salernitana 1919 ortak oyuncusu: Gennaro Gattuso`);

  // AC Milan - SS Lazio
  const milanLazio = await getCommonPlayersByTeams(acMilan.id, lazio.id, 10);
  const nestaInMilanLazio = milanLazio.find((p) => p.fullName === "Alessandro Nesta");
  assert(nestaInMilanLazio !== undefined, "AC Milan - SS Lazio ortak oyuncusu olarak Nesta bulundu");
  console.log(`✅ AC Milan - SS Lazio ortak oyuncusu: Alessandro Nesta`);

  // AC Milan - Chelsea FC
  const milanChelsea = await getCommonPlayersByTeams(acMilan.id, chelsea.id, 10);
  const gullitInMilanChelsea = milanChelsea.find((p) => p.fullName === "Ruud Gullit");
  assert(gullitInMilanChelsea !== undefined, "AC Milan - Chelsea FC ortak oyuncusu olarak Gullit bulundu");
  console.log(`✅ AC Milan - Chelsea FC ortak oyuncusu: Ruud Gullit`);

  // 4. Millet-Takım Modu (Country vs Team)
  console.log("\n--- 4. Millet-Takım Modu Doğrulama ---");
  // İtalya - AC Milan
  const italyMilan = await getCommonPlayersByNationAndTeam(["Italy", "İtalya", "Italian"], acMilan.id, 20);
  const gattusoInItalyMilan = italyMilan.find((p) => p.fullName === "Gennaro Gattuso");
  assert(gattusoInItalyMilan !== undefined, "İtalya - AC Milan kombinasyonunda Gattuso bulundu");
  console.log(`✅ İtalya - AC Milan oyuncusu: Gennaro Gattuso`);

  const nestaInItalyMilan = italyMilan.find((p) => p.fullName === "Alessandro Nesta");
  assert(nestaInItalyMilan !== undefined, "İtalya - AC Milan kombinasyonunda Nesta bulundu");
  console.log(`✅ İtalya - AC Milan oyuncusu: Alessandro Nesta`);

  // İtalya - Rangers FC
  const italyRangers = await getCommonPlayersByNationAndTeam(["Italy", "İtalya", "Italian"], rangers.id, 10);
  const gattusoInItalyRangers = italyRangers.find((p) => p.fullName === "Gennaro Gattuso");
  assert(gattusoInItalyRangers !== undefined, "İtalya - Rangers FC kombinasyonunda Gattuso bulundu");
  console.log(`✅ İtalya - Rangers FC oyuncusu: Gennaro Gattuso`);

  // 5. Cevap Eşleştirme (matchPlayerAnswer)
  console.log("\n--- 5. Cevap Eşleştirme Algoritması (Yazım Toleransı) ---");
  const candidates = [
    { id: gattusoInMilanRangers.id, fullName: gattusoInMilanRangers.fullName },
    { id: nestaInMilanLazio.id, fullName: nestaInMilanLazio.fullName },
  ];

  const m1 = matchPlayerAnswer("Gattuso", candidates);
  assert(m1?.fullName === "Gennaro Gattuso", "'Gattuso' girdisi doğru eşleşti");

  const m2 = matchPlayerAnswer("gennaro gattuso", candidates);
  assert(m2?.fullName === "Gennaro Gattuso", "'gennaro gattuso' girdisi doğru eşleşti");

  const m3 = matchPlayerAnswer("gatuso", candidates); // 1 harf typo
  assert(m3?.fullName === "Gennaro Gattuso", "'gatuso' (typo) girdisi doğru eşleşti");

  const m4 = matchPlayerAnswer("nesta", candidates);
  assert(m4?.fullName === "Alessandro Nesta", "'nesta' girdisi doğru eşleşti");

  console.log("✅ Tüm cevap varyasyonları başarıyla eşleşti!");

  console.log("\n============================================================");
  console.log("🎉 TÜM DOĞRULAMA TESTLERİ BAŞARIYLA GEÇTİ (15/15)");
  console.log("============================================================");
}

main()
  .catch((err) => {
    console.error("❌ Test hatası:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
