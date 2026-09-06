/**
 * matchPlayerToFifa mantığını sentetik ve gerçekçi örneklerle test eden unit test.
 */

import { buildFifaIndices, matchPlayerToFifa } from "../lib/overall/matchPlayerToFifa";
import { FifaPlayerRecord, DbPlayerRecord } from "../lib/overall/fifaTypes";

function runTests() {
  console.log("🧪 [Unit Test: matchPlayerToFifa] Başlatılıyor...");

  const mockFifaRecords: FifaPlayerRecord[] = [
    {
      shortName: "L. Messi",
      longName: "Lionel Andrés Messi Cuccittini",
      dob: "1987-06-24",
      nationality: "Argentina",
      maxOverall: 94,
      positions: ["RW", "ST", "CF"],
    },
    {
      shortName: "Cristiano Ronaldo",
      longName: "Cristiano Ronaldo dos Santos Aveiro",
      dob: "1985-02-05",
      nationality: "Portugal",
      maxOverall: 94,
      positions: ["ST", "LW"],
    },
    {
      shortName: "Alex",
      longName: "Alexsandro de Souza",
      dob: "1977-09-14",
      nationality: "Brazil",
      maxOverall: 85,
      positions: ["CAM"],
    },
    {
      shortName: "İ. Yüksek",
      longName: "İsmail Yüksek",
      dob: "1999-01-26",
      nationality: "Turkey",
      maxOverall: 77,
      positions: ["CDM", "CM"],
    },
  ];

  const indices = buildFifaIndices(mockFifaRecords);

  // Test 1: Messi (Transfermarkt formatı: "Lionel Messi")
  const p1: DbPlayerRecord = {
    id: "p1",
    fullName: "Lionel Messi",
    birthDate: new Date("1987-06-24T00:00:00.000Z"),
    nationality: "Argentina",
  };
  const m1 = matchPlayerToFifa(p1, indices);
  console.assert(m1 !== null && m1.maxOverall === 94, "Test 1 Başarısız: Messi eşleşmedi!");
  console.log("   ✅ Test 1 Geçti: Lionel Messi -> Overall 94, Positions: " + m1?.positions.join(","));

  // Test 2: Cristiano Ronaldo
  const p2: DbPlayerRecord = {
    id: "p2",
    fullName: "Cristiano Ronaldo",
    birthDate: new Date("1985-02-05T00:00:00.000Z"),
    nationality: "Portugal",
  };
  const m2 = matchPlayerToFifa(p2, indices);
  console.assert(m2 !== null && m2.maxOverall === 94, "Test 2 Başarısız: Ronaldo eşleşmedi!");
  console.log("   ✅ Test 2 Geçti: Cristiano Ronaldo -> Overall 94, Positions: " + m2?.positions.join(","));

  // Test 3: Alex de Souza
  const p3: DbPlayerRecord = {
    id: "p3",
    fullName: "Alex",
    birthDate: new Date("1977-09-14T00:00:00.000Z"),
    nationality: "Brazil",
  };
  const m3 = matchPlayerToFifa(p3, indices);
  console.assert(m3 !== null && m3.maxOverall === 85, "Test 3 Başarısız: Alex eşleşmedi!");
  console.log("   ✅ Test 3 Geçti: Alex -> Overall 85, Positions: " + m3?.positions.join(","));

  // Test 4: İsmail Yüksek (Türkçe karakterli)
  const p4: DbPlayerRecord = {
    id: "p4",
    fullName: "İsmail Yüksek",
    birthDate: new Date("1999-01-26T00:00:00.000Z"),
    nationality: "Turkey",
  };
  const m4 = matchPlayerToFifa(p4, indices);
  console.assert(m4 !== null && m4.maxOverall === 77, "Test 4 Başarısız: İsmail Yüksek eşleşmedi!");
  console.log("   ✅ Test 4 Geçti: İsmail Yüksek -> Overall 77, Positions: " + m4?.positions.join(","));

  // Test 5: FIFA'da olmayan veya 67 altı amatör oyuncu
  const p5: DbPlayerRecord = {
    id: "p5",
    fullName: "Ahmet Bilinmeyen",
    birthDate: new Date("2002-05-12T00:00:00.000Z"),
    nationality: "Turkey",
  };
  const m5 = matchPlayerToFifa(p5, indices);
  console.assert(m5 === null, "Test 5 Başarısız: Olmayan oyuncu eşleşti!");
  console.log("   ✅ Test 5 Geçti: Bilinmeyen oyuncu -> null döndü (doğru).");

  console.log("\n🎉 Tüm matcher testleri başarıyla geçti!");
}

runTests();
