/**
 * Futbolcu cevap eşleştirme algoritmasını test eden birim testi.
 */

import { matchPlayerAnswer, CandidatePlayer } from "../lib/validation/matchPlayerAnswer";

function runTests() {
  console.log("🧪 [Test] matchPlayerAnswer Doğrulama Testleri Başlıyor...\n");

  const candidates: CandidatePlayer[] = [
    { id: "1", fullName: "Emre Belözoğlu", nationality: "Turkey" },
    { id: "2", fullName: "Emre Mor", nationality: "Turkey" },
    { id: "3", fullName: "Emre Aşık", nationality: "Turkey" },
    { id: "4", fullName: "Gareth Bale", nationality: "Wales" },
    { id: "5", fullName: "Rüştü Reçber", nationality: "Turkey" },
    { id: "6", fullName: "Cristiano Ronaldo", nationality: "Portugal" },
    { id: "7", fullName: "Ronaldo Nazário", nationality: "Brazil" },
    { id: "8", fullName: "Didier Drogba", nationality: "Ivory Coast" },
  ];

  const testCases = [
    // 1. "emre belöz" -> MUST MATCH "Emre Belözoğlu", NEVER "Emre Mor"
    { input: "emre belöz", expected: "Emre Belözoğlu" },
    // 2. "emre belozoglu" -> "Emre Belözoğlu"
    { input: "emre belozoglu", expected: "Emre Belözoğlu" },
    // 3. "emre mor" -> "Emre Mor"
    { input: "emre mor", expected: "Emre Mor" },
    // 4. "belözoğlu" -> "Emre Belözoğlu"
    { input: "belözoğlu", expected: "Emre Belözoğlu" },
    // 5. "rüştü reçöberi" (typo) -> "Rüştü Reçber"
    { input: "rüştü reçöberi", expected: "Rüştü Reçber" },
    // 6. "reçber" -> "Rüştü Reçber"
    { input: "reçber", expected: "Rüştü Reçber" },
    // 7. "bale" -> "Gareth Bale"
    { input: "bale", expected: "Gareth Bale" },
    // 8. "cristiano ronaldo" -> "Cristiano Ronaldo" (not Ronaldo Nazário)
    { input: "cristiano ronaldo", expected: "Cristiano Ronaldo" },
    // 9. "drogba" -> "Didier Drogba"
    { input: "drogba", expected: "Didier Drogba" },
    // 10. "messi" (not in candidates) -> null
    { input: "messi", expected: null },
    // 11. "emre messi" (invalid second word) -> null
    { input: "emre messi", expected: null },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const result = matchPlayerAnswer(tc.input, candidates);
    const matchedName = result ? result.fullName : null;

    if (matchedName === tc.expected) {
      console.log(`✓ Girdi: "${tc.input}" ➔ Eşleşti: "${matchedName}" (Beklenen: "${tc.expected}")`);
      passed++;
    } else {
      console.error(`❌ Girdi: "${tc.input}" ➔ Hatalı Eşleşme: "${matchedName}" (Beklenen: "${tc.expected}")`);
    }
  }

  console.log(`\n📊 Sonuç: ${passed} / ${testCases.length} test başarılı!`);

  if (passed !== testCases.length) {
    process.exit(1);
  }
}

runTests();
