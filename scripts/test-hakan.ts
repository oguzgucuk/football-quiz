async function testHakan() {
  const query = `
    SELECT DISTINCT ?item ?itemLabel ?team ?teamLabel WHERE {
      VALUES ?itemLabel { "Hakan Şükür"@tr "Tuncay Şanlı"@tr "Aykut Kocaman"@tr "Oğuz Çetin"@tr "Alex"@tr "Zinédine Zidane"@en "Diego Maradona"@en "Zico"@en "Ronaldinho"@en }
      ?item rdfs:label ?itemLabel .
      ?item p:P54 [ ps:P54 ?team ] .
      ?team rdfs:label ?teamLabel FILTER(LANG(?teamLabel) = "tr" || LANG(?teamLabel) = "en") .
    }
  `;
  const res = await fetch("https://query.wikidata.org/sparql?format=json&query=" + encodeURIComponent(query), {
    headers: { "User-Agent": "FootballQuiz/1.0" },
  });
  const data = await res.json();
  for (const b of data.results.bindings) {
    console.log(`${b.itemLabel.value} -> ${b.teamLabel.value} (${b.team.value.split("/").pop()})`);
  }
}
testHakan();
