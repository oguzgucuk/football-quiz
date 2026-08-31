async function checkQ17507() {
  const query = `
    SELECT DISTINCT ?team ?teamName WHERE {
      wd:Q17507 p:P54 [ ps:P54 ?team ] .
      ?team rdfs:label ?teamName FILTER(LANG(?teamName) = "en" || LANG(?teamName) = "tr") .
    }
  `;
  const res = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query), {
    headers: { "User-Agent": "FootballQuiz/1.0" },
  });
  interface WikidataBinding {
    teamName: { value: string };
  }
  const data = (await res.json()) as { results: { bindings: WikidataBinding[] } };
  console.log("Gerard Piqué Q17507 Clubs:", data.results.bindings.map((b) => b.teamName.value));
}
checkQ17507();
