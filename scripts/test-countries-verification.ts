import { prisma } from "../lib/db/client";
import { POPULAR_NATIONS, findNationByIdOrAlias } from "../lib/data/nations";
import { verifyNationAnswerInServer } from "../lib/realtime/verifyNationAnswer";
import { getCommonPlayersByNationAndTeam } from "../lib/db/players";
import assert from "assert";

async function main() {
  console.log("============================================================");
  console.log("🧪 ÇİN, ARNAVUTLUK VE AFRİKA ÜLKELERİ DOĞRULAMA TESTİ");
  console.log("============================================================\n");

  // 1. Ülke Varlık Kontrolleri
  console.log("--- 1. Ülke Listesi Kontrolü ---");
  const testCountries = [
    { query: "çin", expectedName: "Çin", expectedEn: "China", flag: "cn" },
    { query: "china", expectedName: "Çin", expectedEn: "China", flag: "cn" },
    { query: "arnavutluk", expectedName: "Arnavutluk", expectedEn: "Albania", flag: "al" },
    { query: "albania", expectedName: "Arnavutluk", expectedEn: "Albania", flag: "al" },
    { query: "cezayir", expectedName: "Cezayir", expectedEn: "Algeria", flag: "dz" },
    { query: "tunus", expectedName: "Tunus", expectedEn: "Tunisia", flag: "tn" },
    { query: "mali", expectedName: "Mali", expectedEn: "Mali", flag: "ml" },
    { query: "kongo dc", expectedName: "Kongo DC", expectedEn: "DR Congo", flag: "cd" },
    { query: "güney afrika", expectedName: "Güney Afrika", expectedEn: "South Africa", flag: "za" },
    { query: "gine", expectedName: "Gine", expectedEn: "Guinea", flag: "gn" },
    { query: "gabon", expectedName: "Gabon", expectedEn: "Gabon", flag: "ga" },
    { query: "burkina faso", expectedName: "Burkina Faso", expectedEn: "Burkina Faso", flag: "bf" },
  ];

  for (const tc of testCountries) {
    const nation = findNationByIdOrAlias(tc.query);
    assert(nation !== undefined, `Ülke '${tc.query}' findNationByIdOrAlias ile bulundu`);
    assert(nation.name === tc.expectedName, `'${tc.query}' Türkçe adı '${tc.expectedName}'`);
    assert(nation.englishName === tc.expectedEn, `'${tc.query}' İngilizce adı '${tc.expectedEn}'`);
    assert(nation.flagCode === tc.flag, `'${tc.query}' bayrak kodu '${tc.flag}'`);
    console.log(`✅ ${nation.name} (${nation.englishName}) [${nation.flagCode}] doğrulandı.`);
  }

  // 2. Veritabanı Oyuncu Doğrulama (Gerçek Kulüp + Millet Eşleşmeleri)
  console.log("\n--- 2. Veritabanı ve Sunucu Doğrulama Testi ---");

  // A. Çin (China) + RCD Espanyol (Wu Lei)
  const china = findNationByIdOrAlias("china")!;
  const espanyol = await prisma.team.findFirst({
    where: { name: { contains: "Espanyol", mode: "insensitive" } },
  });
  if (espanyol) {
    const chinaPlayers = await getCommonPlayersByNationAndTeam([china.englishName, china.name, ...china.aliases], espanyol.id, 5);
    console.log(`Çin + Espanyol Oyuncuları (${chinaPlayers.length}):`, chinaPlayers.map(p => p.fullName));
    if (chinaPlayers.some(p => p.fullName.toLowerCase().includes("wu lei"))) {
      const v1 = await verifyNationAnswerInServer("Wu Lei", china, espanyol.id);
      assert(v1.isCorrect === true, "Çin + Espanyol: Wu Lei doğru cevap");
      console.log(`✅ Çin + Espanyol: 'Wu Lei' başarıyla doğrulandı!`);
    }
  }

  // B. Arnavutluk (Albania) + Inter Milan (Kristjan Asllani veya Rey Manaj)
  const albania = findNationByIdOrAlias("albania")!;
  const interMilan = await prisma.team.findFirst({
    where: { name: { equals: "Inter Milan", mode: "insensitive" } },
  });
  if (interMilan) {
    const albaniaPlayers = await getCommonPlayersByNationAndTeam([albania.englishName, albania.name, ...albania.aliases], interMilan.id, 5);
    console.log(`Arnavutluk + Inter Milan Oyuncuları (${albaniaPlayers.length}):`, albaniaPlayers.map(p => p.fullName));
    assert(albaniaPlayers.length > 0, "Arnavutluk + Inter Milan oyuncusu bulundu");
    const testPlayer = albaniaPlayers[0];
    const v2 = await verifyNationAnswerInServer(testPlayer.fullName, albania, interMilan.id);
    assert(v2.isCorrect === true, `Arnavutluk + Inter: '${testPlayer.fullName}' doğru kabul edildi`);
    console.log(`✅ Arnavutluk + Inter Milan: '${testPlayer.fullName}' başarıyla doğrulandı!`);
  }

  // C. Cezayir (Algeria) + Manchester City (Riyad Mahrez)
  const algeria = findNationByIdOrAlias("algeria")!;
  const manCity = await prisma.team.findFirst({
    where: { name: { equals: "Manchester City", mode: "insensitive" } },
  });
  if (manCity) {
    const algeriaPlayers = await getCommonPlayersByNationAndTeam([algeria.englishName, algeria.name, ...algeria.aliases], manCity.id, 5);
    console.log(`Cezayir + Manchester City Oyuncuları (${algeriaPlayers.length}):`, algeriaPlayers.map(p => p.fullName));
    assert(algeriaPlayers.length > 0, "Cezayir + Manchester City oyuncusu bulundu");
    const v3 = await verifyNationAnswerInServer("Riyad Mahrez", algeria, manCity.id);
    assert(v3.isCorrect === true, "Cezayir + Man City: Riyad Mahrez doğru kabul edildi");
    console.log(`✅ Cezayir + Manchester City: 'Riyad Mahrez' başarıyla doğrulandı!`);
  }

  // D. Mali + Tottenham Hotspur (Yves Bissouma)
  const mali = findNationByIdOrAlias("mali")!;
  const tottenham = await prisma.team.findFirst({
    where: { name: { equals: "Tottenham Hotspur", mode: "insensitive" } },
  });
  if (tottenham) {
    const maliPlayers = await getCommonPlayersByNationAndTeam([mali.englishName, mali.name, ...mali.aliases], tottenham.id, 5);
    console.log(`Mali + Tottenham Hotspur Oyuncuları (${maliPlayers.length}):`, maliPlayers.map(p => p.fullName));
    assert(maliPlayers.length > 0, "Mali + Tottenham Hotspur oyuncusu bulundu");
    const v4 = await verifyNationAnswerInServer("Yves Bissouma", mali, tottenham.id);
    assert(v4.isCorrect === true, "Mali + Tottenham: Yves Bissouma doğru kabul edildi");
    console.log(`✅ Mali + Tottenham Hotspur: 'Yves Bissouma' başarıyla doğrulandı!`);
  }

  // E. Yanlış Cevap Reddi Kontrolü
  const falseCheck = await verifyNationAnswerInServer("Lionel Messi", china, espanyol?.id || "dummy");
  assert(falseCheck.isCorrect === false, "Çin + Espanyol için Lionel Messi reddedildi");
  console.log(`✅ Yanlış oyuncu ('Lionel Messi') başarıyla reddedildi!`);

  console.log("\n============================================================");
  console.log("🎉 ÇİN, ARNAVUTLUK VE AFRİKA ÜLKELERİ TESTLERİ BAŞARIYLA GEÇTİ!");
  console.log("============================================================");
}

main()
  .catch((err) => {
    console.error("❌ Test hatası:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
