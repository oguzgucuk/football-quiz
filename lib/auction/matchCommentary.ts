/**
 * 9 Bölge Simülasyonu Canlı Spiker ve Maç Anlatımı Motoru.
 * Bölgelere, taktiklere ve pozisyon tiplerine göre sinematik spiker metinleri üretir.
 */

import { PitchCorridor } from "./auctionTypes";
import { parseZone } from "./zoneGrid";
import { ZoneId } from "./zoneTypes";

function corridorName(c: PitchCorridor): string {
  if (c === "left") return "sol kanattan";
  if (c === "right") return "sağ kanattan";
  return "merkezden";
}

export function generateTurnoverCommentary(
  stealerName: string,
  stealingTeamName: string,
  zone: ZoneId,
  isHighPress: boolean
): string {
  const { third, corridor } = parseZone(zone);
  const cName = corridorName(corridor);

  if (third === "def" && isHighPress) {
    const list = [
      `⚡ İNANILMAZ HATA! ${stealerName} (${stealingTeamName}) ceza sahası önünde müthiş presle topu kaptı! Net gol pozisyonu!`,
      `⚡ ÖNDE PRES SONUÇ VERDİ! ${stealerName} savunmanın hatasını affetmedi, topu kapıp ceza sahasına daldı!`,
      `⚡ BÜYÜK TEHLİKE! Savunmadan kısa pasla çıkarken ${stealerName} araya girdi ve ceza sahasında topla buluştu!`,
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  if (third === "mid") {
    const list = [
      `🛡️ ${stealerName} (${stealingTeamName}) orta alanda harika sezdi, pası keserek takımını atağa kaldırdı.`,
      `🛡️ ${stealerName} ${cName} rakibin hızlı hücumunu kritik bir müdahaleyle kesti.`,
      `🛡️ Orta sahada top kaybı! ${stealerName} araya girdi ve dikine pasını aktardı.`,
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  return `🛡️ ${stealerName} (${stealingTeamName}) kademeye girdi ve tehlikeyi savuşturdu.`;
}

export function generateDefenseBlockCommentary(
  defenderName: string,
  zone: ZoneId
): string {
  const { corridor } = parseZone(zone);
  const cName = corridorName(corridor);
  const list = [
    `🛡️ ${defenderName} ${cName} gelişen tehlikeyi sezdi ve kritik bir müdahaleyle topu kornere yolladı!`,
    `🛡️ ${defenderName} ceza sahasında adeta etten duvar ördü, şutun kaleye gitmesine izin vermedi!`,
    `🛡️ Kademede kusursuz müdahale! ${defenderName} forvetin vuruş açısını kapattı.`,
  ];
  return list[Math.floor(Math.random() * list.length)];
}

export function generateSaveCommentary(
  gkName: string,
  shooterName: string,
  isCorner: boolean = true
): string {
  if (isCorner) {
    const list = [
      `🧤 ${gkName}, ${shooterName}'in sert şutunu inanılmaz bir refleksle kornere çeldi!`,
      `🧤 MUAZZAM KURTARIŞ! ${shooterName} köşeye vurdu ancak ${gkName} devleşti, top kornere çıktı!`,
      `🧤 ${shooterName} karşı karşıya vurdu, ${gkName} parmaklarının ucuyla golü önledi! Korner!`,
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  const list = [
    `🧤 ${shooterName} ceza sahasında vurdu ama ${gkName} rahat kontrol etti.`,
    `🧤 ${shooterName}'in vuruşunda ${gkName} doğru pozisyon aldı ve topu yakaladı.`,
  ];
  return list[Math.floor(Math.random() * list.length)];
}

export function generateGoalCommentary(
  shooterName: string,
  teamName: string,
  zone: ZoneId,
  assistName?: string,
  isLongShot?: boolean
): string {
  const { corridor } = parseZone(zone);
  const cName = corridorName(corridor);

  if (isLongShot) {
    const list = [
      `🚀 FÜZE! ${shooterName} (${teamName}) ceza sahası dışından mermi gibi vurdu, top 90'a asıldı!`,
      `💥 İNANILMAZ GOL! ${shooterName} (${teamName}) kaleyi görür görmez nefis vurdu, kaleci çaresiz!`,
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  if (assistName) {
    const list = [
      `⚽ GOL! ${assistName} ${cName} adrese teslim kesti, ${shooterName} (${teamName}) tek vuruşla topu ağlara yolladı!`,
      `⚽ GOL! ${assistName}'in harika ara pasında ${shooterName} (${teamName}) kaleciyi avladı!`,
      `⚽ GOL! ${assistName} şık gördü, ${shooterName} (${teamName}) köşeye bıraktı!`,
    ];
    return list[Math.floor(Math.random() * list.length)];
  }

  const solo = [
    `⚽ GOL! ${shooterName} (${teamName}) ceza sahasında klasını konuşturdu, nefis bir gol!`,
    `⚽ GOL! ${shooterName} (${teamName}) kaleciyle karşı karşıya kaldı ve affetmedi!`,
  ];
  return solo[Math.floor(Math.random() * solo.length)];
}

export function generateCornerCommentary(kickerName: string, targetName: string): string {
  const list = [
    `🚩 Köşe vuruşu kullanıldı. ${kickerName} ortaladı, ceza sahasında ${targetName} kafayı vurdu!`,
    `🚩 Korner tehlikesi! ${kickerName}'in ön direğe kestiği topa ${targetName} dokundu!`,
  ];
  return list[Math.floor(Math.random() * list.length)];
}

export function generateReboundCommentary(playerName: string): string {
  return `⚡ Dönen topta ceza sahası yayında büyük karambol! ${playerName} seken topa hareketlendi!`;
}

export function generateSubstitutionCommentary(teamName: string, outName: string, inName: string): string {
  return `🔄 OYUNCU DEĞİŞİKLİĞİ (${teamName}): ${outName} kenara geliyor, yerine ${inName} oyunda!`;
}

export function generateHalftimeCommentary(): string {
  return `⏸️ İLK YARI SONUCU: Hakem düdüğünü çaldı! Takımlar taktik konuşması ve değişiklikler için soyunma odasına gidiyor.`;
}
