import { prisma } from "../lib/db/client";

const LEGENDS_DATA = [
  {
    name: "Zinedine Zidane",
    birthDate: "1972-06-23",
    nationality: "France",
    clubs: ["Juventus", "Real Madrid", "Bordeaux", "Cannes"],
  },
  {
    name: "Luís Figo",
    birthDate: "1972-11-04",
    nationality: "Portugal",
    clubs: ["Sporting CP", "FC Barcelona", "Real Madrid", "Inter Milan"],
  },
  {
    name: "Zlatan Ibrahimović",
    birthDate: "1981-10-03",
    nationality: "Sweden",
    clubs: ["Malmö", "AFC Ajax", "Juventus", "Inter Milan", "FC Barcelona", "AC Milan", "Paris Saint-Germain", "Manchester United", "LA Galaxy"],
  },
  {
    name: "Tugay Kerimoğlu",
    birthDate: "1970-08-24",
    nationality: "Türkiye",
    clubs: ["Galatasaray", "Rangers FC", "Blackburn Rovers"],
  },
  {
    name: "Nuri Şahin",
    birthDate: "1988-09-05",
    nationality: "Türkiye",
    clubs: ["Borussia Dortmund", "Feyenoord", "Real Madrid", "Liverpool FC", "Werder Bremen", "Antalyaspor"],
  },
  {
    name: "Hamit Altıntop",
    birthDate: "1982-12-08",
    nationality: "Türkiye",
    clubs: ["Schalke 04", "Bayern München", "Real Madrid", "Galatasaray", "SV Darmstadt 98"],
  },
  {
    name: "Halil Altıntop",
    birthDate: "1982-12-08",
    nationality: "Türkiye",
    clubs: ["1. FC Kaiserslautern", "Schalke 04", "Eintracht Frankfurt", "Trabzonspor", "FC Augsburg", "Slavia Prag"],
  },
  {
    name: "Michael Ballack",
    birthDate: "1976-09-26",
    nationality: "Germany",
    clubs: ["1. FC Kaiserslautern", "Bayer 04 Leverkusen", "Bayern München", "Chelsea FC"],
  },
  {
    name: "Hernán Crespo",
    birthDate: "1975-07-05",
    nationality: "Argentina",
    clubs: ["River Plate", "Parma", "Lazio", "Inter Milan", "Chelsea FC", "AC Milan", "Genoa"],
  },
  {
    name: "Diego Forlán",
    birthDate: "1979-05-19",
    nationality: "Uruguay",
    clubs: ["Independiente", "Manchester United", "Villarreal CF", "Atlético de Madrid", "Inter Milan", "Internacional"],
  },
  {
    name: "Alpay Özalan",
    birthDate: "1973-05-29",
    nationality: "Türkiye",
    clubs: ["Altay", "Beşiktaş", "Fenerbahçe", "Aston Villa", "Incheon United", "Urawa Red Diamonds", "1. FC Köln"],
  },
  {
    name: "İlhan Mansız",
    birthDate: "1975-08-10",
    nationality: "Türkiye",
    clubs: ["Gençlerbirliği", "Samsunspor", "Beşiktaş", "Vissel Kobe", "Hertha BSC", "Ankaragücü"],
  },
  {
    name: "Ümit Davala",
    birthDate: "1973-07-30",
    nationality: "Türkiye",
    clubs: ["Afyonspor", "İstanbulspor", "Diyarbakırspor", "Galatasaray", "AC Milan", "Inter Milan", "Werder Bremen"],
  },
  {
    name: "Hasan Şaş",
    birthDate: "1976-08-01",
    nationality: "Türkiye",
    clubs: ["Adana Demirspor", "MKE Ankaragücü", "Galatasaray"],
  },
  {
    name: "Okan Buruk",
    birthDate: "1973-10-19",
    nationality: "Türkiye",
    clubs: ["Galatasaray", "Inter Milan", "Beşiktaş", "İstanbul Büyükşehir Belediyespor"],
  },
  {
    name: "Tayfun Korkut",
    birthDate: "1974-04-02",
    nationality: "Türkiye",
    clubs: ["Fenerbahçe", "Real Sociedad", "RCD Espanyol", "Beşiktaş", "Gençlerbirliği"],
  },
];

async function addKeyLegends() {
  console.log("⭐ [Key Legends] Efsane futbolcular DB'ye ekleniyor...\n");

  for (const leg of LEGENDS_DATA) {
    let player = await prisma.player.findFirst({
      where: {
        fullName: { equals: leg.name, mode: "insensitive" },
      },
    });

    if (!player) {
      player = await prisma.player.create({
        data: {
          fullName: leg.name,
          birthDate: new Date(leg.birthDate),
          nationality: leg.nationality,
        },
      });
      console.log(`✨ Yeni Eklendi: ${player.fullName}`);
    } else {
      console.log(`✓ Mevcut: ${player.fullName}`);
    }

    for (const clubName of leg.clubs) {
      let team = await prisma.team.findFirst({
        where: {
          OR: [
            { name: { contains: clubName, mode: "insensitive" } },
            { aliases: { has: clubName } },
          ],
        },
      });

      if (!team) {
        team = await prisma.team.create({
          data: {
            name: clubName,
            country: leg.nationality === "Türkiye" ? "Türkiye" : "Avrupa",
            league: "Classic / Historical",
          },
        });
        console.log(`   🏟️ Kulüp Oluşturuldu: ${team.name}`);
      }

      const existing = await prisma.playerTeamHistory.findFirst({
        where: {
          playerId: player.id,
          teamId: team.id,
        },
      });

      if (!existing) {
        await prisma.playerTeamHistory.create({
          data: {
            playerId: player.id,
            teamId: team.id,
          },
        });
        console.log(`   🔗 Bağlandı: ${player.fullName} -> ${team.name}`);
      }
    }
  }

  console.log("\n🎉 TÜM EFSANELER BAŞARIYLA TAMAMLANDI!");
}

addKeyLegends()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
