async function test() {
  const url = "https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=133804";
  const res = await fetch(url);
  const data = await res.json();
  const team = data.teams?.[0];
  if (team) {
    // Badge URL'yi bul
    for (const [k, v] of Object.entries(team)) {
      if (typeof v === "string" && v.startsWith("http")) {
        console.log(`${k}: ${v}`);
      }
    }
  }
}

test();
