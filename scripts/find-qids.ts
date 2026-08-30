async function findClubIds() {
  const clubs = [
    "Manchester United", "Liverpool FC", "Arsenal FC", "Chelsea FC", "Tottenham Hotspur",
    "Real Madrid CF", "FC Barcelona", "Atlético Madrid", "Juventus FC", "AC Milan", "Inter Milan",
    "FC Bayern München", "Borussia Dortmund", "Paris Saint-Germain FC", "Galatasaray SK",
    "Fenerbahçe SK", "Beşiktaş JK", "Trabzonspor", "Bursaspor", "Sakaryaspor",
    "CR Flamengo", "Santos FC", "SE Palmeiras", "Sport Club Corinthians Paulista", "São Paulo FC",
    "CA Boca Juniors", "CA River Plate"
  ];

  for (const name of clubs) {
    const query = `SELECT ?item ?itemLabel WHERE { ?item ?label "${name}"@en . ?item wdt:P31/wdt:P279* wd:Q476028 . } LIMIT 1`;
    const url = "https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query);
    try {
      const res = await fetch(url, { headers: { "User-Agent": "FootballQuizApp/1.0" } });
      const data = await res.json();
      const item = data.results.bindings[0]?.item?.value;
      const qId = item ? item.split("/").pop() : "NOT_FOUND";
      console.log(`{ id: "${qId}", name: "${name}" },`);
    } catch (e) {
      console.log(`Failed for ${name}`);
    }
  }
}
findClubIds();
