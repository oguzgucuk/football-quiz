async function checkPiqueUnited() {
  const query = `
    SELECT ?team ?teamName WHERE {
      wd:Q17507 p:P54 [ ps:P54 ?team ] .
      ?team rdfs:label ?teamName FILTER(LANG(?teamName) = "en") .
    }
  `;
  const res = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query), {
    headers: { "User-Agent": "FootballQuiz/1.0" },
  });
  const data = await res.json();
  for (const b of data.results.bindings) {
    console.log(`${b.team.value.split("/").pop()} -> ${b.teamName.value}`);
  }
}
checkPiqueUnited();
