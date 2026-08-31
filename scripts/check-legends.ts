import { prisma } from "../lib/db/client";

async function checkLegends() {
  const legendNames = [
    "Nihat Kahveci",
    "Ronaldo",
    "Zinedine Zidane",
    "David Beckham",
    "Thierry Henry",
    "Luis Figo",
    "Clarence Seedorf",
    "Zlatan Ibrahimovic",
    "Kaka",
    "Ruud van Nistelrooy",
    "Roberto Carlos",
    "Michael Ballack",
    "Andriy Shevchenko",
    "Hernan Crespo",
    "Diego Forlan",
    "Samuel Eto'o",
    "Deco",
    "Edgar Davids",
    "Patrick Vieira",
    "Andrea Pirlo",
    "Arjen Robben",
    "Wesley Sneijder",
    "Robin van Persie",
    "Dirk Kuyt",
    "Didier Drogba",
    "Nicolas Anelka",
    "Emre Belözoğlu",
    "Arda Turan",
    "Tuncay Şanlı",
    "Tugay Kerimoğlu",
    "Sergen Yalçın",
    "Hakan Şükür",
    "Rüştü Reçber",
    "Nuri Şahin",
    "Hamit Altıntop",
  ];

  console.log("🔍 Efsane Futbolcular Kontrol Ediliyor...\n");

  for (const name of legendNames) {
    const player = await prisma.player.findFirst({
      where: {
        fullName: { contains: name, mode: "insensitive" },
      },
      include: {
        teamsHistory: {
          include: { team: true },
        },
      },
    });

    if (player) {
      console.log(`✅ BULUNDU: ${player.fullName} (${player.teamsHistory.length} Takım) -> ${player.teamsHistory.map(t => t.team.name).join(", ")}`);
    } else {
      console.log(`❌ EKSİK: ${name}`);
    }
  }
}

checkLegends()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
