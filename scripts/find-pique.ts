async function findPique() {
  const query = `
    SELECT DISTINCT ?item ?itemLabel ?teamLabel WHERE {
      VALUES ?itemLabel { "Gerard Piqué"@en "Gerard Piqué"@tr "Gerard Pique"@en }
      ?item rdfs:label ?itemLabel .
      ?item p:P54 [ ps:P54 ?team ] .
      ?team rdfs:label ?teamLabel FILTER(LANG(?teamLabel) = "en" || LANG(?teamLabel) = "tr") .
    }
  `;
  const res = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query), {
    headers: { "User-Agent": "FootballQuiz/1.0" },
  });
  const data = await res.json();
  console.log("Pique Q-ID & Clubs:");
  for (const b of data.results.bindings) {
    console.log(`${b.item.value.split("/").pop()} -> ${b.teamLabel.value}`);
  }
}
findPique();
