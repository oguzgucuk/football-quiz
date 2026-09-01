import { prisma } from "../lib/db/client";

async function checkPopularTeamsLogos() {
  const names = [
    "Real Madrid",
    "FC Barcelona",
    "Galatasaray",
    "Fenerbahçe",
    "Beşiktaş",
    "AC Milan",
    "Inter Milan",
    "Juventus",
    "Manchester United",
    "Liverpool FC",
    "Arsenal FC",
    "Chelsea FC",
    "Bayern München",
    "Borussia Dortmund",
    "Paris Saint-Germain",
    "Atlético de Madrid",
    "Boca Juniors",
    "Santos FC",
    "São Paulo FC"
  ];

  const teams = await prisma.team.findMany({
    where: {
      name: { in: names }
    },
    select: {
      id: true,
      name: true,
      country: true,
      league: true,
      logoUrl: true,
    }
  });

  console.log(JSON.stringify(teams, null, 2));
}

checkPopularTeamsLogos().then(() => prisma.$disconnect());
