async function testSakarya() {
  const query = `
    SELECT DISTINCT ?playerName WHERE {
      ?player p:P54 [ ps:P54 wd:Q1369461 ] .
      ?player rdfs:label ?playerName FILTER(LANG(?playerName) = "tr" || LANG(?playerName) = "en") .
    }
    LIMIT 30
  `;
  const res = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query), {
    headers: { "User-Agent": "FootballQuiz/1.0" },
  });
  interface WikidataPlayerBinding {
    playerName: { value: string };
  }
  const data = (await res.json()) as { results: { bindings: WikidataPlayerBinding[] } };
  console.log("Sakaryaspor Q1369461 Oyuncuları:", data.results.bindings.map((b) => b.playerName.value));
}
testSakarya();
