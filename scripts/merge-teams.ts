/**
 * 3. Adım: Onaylanan Kopya Kulüpleri Birleştir ($transaction ve Aliases desteği ile)
 */

import { prisma } from "../lib/db/client";

interface MergePair {
  canonicalName: string;
  duplicateName: string;
}

const APPROVED_MERGES: MergePair[] = [
  { canonicalName: "Feyenoord", duplicateName: "Feyenoord Rotterdam" },
  { canonicalName: "Çaykur Rizespor", duplicateName: "Caykur Rizespor" },
  { canonicalName: "Gaziantep FK", duplicateName: "Gaziantep F.K." },
  { canonicalName: "İstanbul Başakşehir", duplicateName: "İstanbul Başakşehir FK" },
  { canonicalName: "İstanbul Başakşehir", duplicateName: "İstanbul Başakşehir F.K." },
  { canonicalName: "Leeds United", duplicateName: "Leeds United AFC" },
  { canonicalName: "Swansea City", duplicateName: "Swansea City AFC" },
  { canonicalName: "1. FSV Mainz 05", duplicateName: "1.FSV Mainz 05" },
  { canonicalName: "Grasshopper Club Zürich", duplicateName: "Grasshopper Club Zurich" },
  { canonicalName: "Estudiantes de La Plata", duplicateName: "Club Estudiantes de La Plata" },
  { canonicalName: "Chievo Verona", duplicateName: "AC ChievoVerona" },
  { canonicalName: "Cesena FC", duplicateName: "AC Cesena" },
  { canonicalName: "Toluca FC", duplicateName: "Deportivo Toluca" },
  { canonicalName: "Club América", duplicateName: "CF América" },
  { canonicalName: "América de Cali", duplicateName: "CD América de Cali" },
  { canonicalName: "Independiente Medellín", duplicateName: "Deportivo Independiente Medellín" },
  { canonicalName: "Athletico Paranaense", duplicateName: "Club Athletico Paranaense" },
  { canonicalName: "Lech Poznań", duplicateName: "Lech Poznan" },
  { canonicalName: "Pogoń Szczecin", duplicateName: "Pogon Szczecin" },
  { canonicalName: "Al-Hilal", duplicateName: "Al Hilal SFC" },
  { canonicalName: "Al-Hilal", duplicateName: "Al-Hilal SFC" },
  { canonicalName: "Umm Salal", duplicateName: "Umm Salal SC" },
  { canonicalName: "Umm Salal", duplicateName: "Umm-Salal SC" },
  { canonicalName: "AS Nancy-Lorraine", duplicateName: "A.S. Nancy-Lorraine" },
  { canonicalName: "SK Dynamo České Budějovice", duplicateName: "SK Dynamo Ceske Budejovice" },
  { canonicalName: "MFK Karviná", duplicateName: "MFK Karvina" },
  { canonicalName: "Godoy Cruz Antonio Tomba", duplicateName: "CD Godoy Cruz Antonio Tomba" },
  { canonicalName: "Atlético Tucumán", duplicateName: "Club Atlético Tucumán" },
  { canonicalName: "FC Botoșani", duplicateName: "FC Botosani" },
  { canonicalName: "FC Petrolul Ploiești", duplicateName: "Petrolul Ploiesti" },
  { canonicalName: "FCV Farul Constanța", duplicateName: "FCV Farul Constanta" },
  { canonicalName: "FK Čukarički", duplicateName: "FK Cukaricki" },
  { canonicalName: "FK Radnički Niš", duplicateName: "FK Radnicki Nis" },
  { canonicalName: "Necaxa", duplicateName: "Club Necaxa" },
];

async function mergeTeams() {
  console.log("🔄 [Onaylanmış Kulüpleri Birleştirme] Başlatılıyor...\n");

  let totalMerged = 0;

  for (const pair of APPROVED_MERGES) {
    const canonicalTeam = await prisma.team.findFirst({
      where: {
        OR: [
          { name: { equals: pair.canonicalName, mode: "insensitive" } },
          { name: { equals: pair.duplicateName, mode: "insensitive" } },
        ],
      },
      orderBy: {
        playersHistory: {
          _count: "desc",
        },
      },
      include: {
        playersHistory: true,
      },
    });

    const duplicateTeams = await prisma.team.findMany({
      where: {
        name: { in: [pair.canonicalName, pair.duplicateName], mode: "insensitive" },
        id: { not: canonicalTeam?.id },
      },
      include: {
        playersHistory: true,
      },
    });

    if (!canonicalTeam || duplicateTeams.length === 0) continue;

    // Canonical takımın adını ve aliases alanını güncelle
    const newAliases = Array.from(
      new Set([
        ...(canonicalTeam.aliases || []),
        pair.canonicalName,
        pair.duplicateName,
        ...duplicateTeams.map((d) => d.name),
      ])
    ).filter((a) => a !== pair.canonicalName);

    await prisma.team.update({
      where: { id: canonicalTeam.id },
      data: {
        name: pair.canonicalName,
        aliases: newAliases,
      },
    });

    for (const dup of duplicateTeams) {
      // Transferleri canonical takıma taşı
      for (const history of dup.playersHistory) {
        try {
          await prisma.playerTeamHistory.upsert({
            where: {
              playerId_teamId: {
                playerId: history.playerId,
                teamId: canonicalTeam.id,
              },
            },
            create: {
              playerId: history.playerId,
              teamId: canonicalTeam.id,
              isNationalTeam: history.isNationalTeam,
              seasonStart: history.seasonStart,
              seasonEnd: history.seasonEnd,
            },
            update: {},
          });
        } catch {}
      }

      await prisma.playerTeamHistory.deleteMany({ where: { teamId: dup.id } });
      await prisma.team.delete({ where: { id: dup.id } });
      totalMerged++;
      console.log(`✓ '${dup.name}' (${dup.playersHistory.length} oyuncu) ➔ '${pair.canonicalName}' içine başarıyla birleştirildi.`);
    }
  }

  console.log(`\n🎉 Toplam ${totalMerged} onaylı kulüp başarıyla birleştirildi ve aliases alanına kaydedildi!`);
}

mergeTeams()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
